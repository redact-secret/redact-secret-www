// The bucket and the CDN behind two small interfaces (#11), so every publish
// step runs the same code against the real S3 bucket and CloudFront
// distribution (through the aws CLI already on the runners — no SDK
// dependency) or against a directory on disk in the tests.
//
//   Store  get(key) → Buffer | null          s3:GetObject
//          put(key, body, { contentType, cacheControl })   s3:PutObject
//          list(prefix) → [{ key, size }]    s3:ListBucket
//          delete(keys)                      s3:DeleteObject
//   Cdn    invalidate(paths) → id            cloudfront:CreateInvalidation
//
// Nothing here logs an object body.
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';

const safeKey = (key) => {
  if (typeof key !== 'string' || !/^[A-Za-z0-9_./-]+$/.test(key) || key.startsWith('/') || key.split('/').includes('..')) {
    throw new Error(`store: refusing object key ${JSON.stringify(String(key).slice(0, 80))}`);
  }
  return key;
};

/**
 * A directory standing in for the bucket. Metadata (content type, cache
 * control) sits in a sidecar tree; `ops` records every call in order, so a
 * test can count puts and deletes by prefix.
 */
export function fsStore(dir) {
  const objects = join(dir, 'objects');
  const meta = join(dir, 'meta');
  mkdirSync(objects, { recursive: true });
  mkdirSync(meta, { recursive: true });
  const ops = [];
  const walk = (d) => (existsSync(d) ? readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)])) : []);
  return {
    kind: 'fs',
    dir,
    ops,
    async get(key) {
      ops.push({ op: 'get', key: safeKey(key) });
      const file = join(objects, key);
      return existsSync(file) ? readFileSync(file) : null;
    },
    async put(key, body, { contentType, cacheControl }) {
      ops.push({ op: 'put', key: safeKey(key) });
      const file = join(objects, key);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, body);
      const m = join(meta, `${key}.json`);
      mkdirSync(dirname(m), { recursive: true });
      writeFileSync(m, JSON.stringify({ contentType, cacheControl }));
    },
    async list(prefix = '') {
      ops.push({ op: 'list', key: prefix });
      return walk(objects)
        .map((f) => ({ key: relative(objects, f).split(sep).join('/'), size: statSync(f).size }))
        .filter((o) => o.key.startsWith(prefix))
        .sort((a, b) => (a.key < b.key ? -1 : 1));
    },
    async delete(keys) {
      for (const key of keys) {
        ops.push({ op: 'delete', key: safeKey(key) });
        rmSync(join(objects, key), { force: true });
        rmSync(join(meta, `${key}.json`), { force: true });
      }
    },
    /** Test helper: an object's metadata, as the last put set it. */
    metadata(key) {
      const m = join(meta, `${key}.json`);
      return existsSync(m) ? JSON.parse(readFileSync(m, 'utf8')) : null;
    },
  };
}

/** A CDN that records invalidations instead of making them. */
export function fakeCdn() {
  const invalidations = [];
  return {
    invalidations,
    async invalidate(paths) {
      const id = `FAKE${String(invalidations.length + 1).padStart(4, '0')}`;
      invalidations.push({ id, paths: [...paths] });
      return id;
    },
  };
}

function aws(args, { input } = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile('aws', args, { maxBuffer: 256 * 1024 * 1024, encoding: 'utf8' }, (error, stdout, stderr) => {
      if (error) {
        // The CLI's own message names the operation and error code; it never
        // carries credentials. Keep it short.
        const e = new Error(`aws ${args.slice(0, 2).join(' ')} failed: ${String(stderr || error.message).trim().split('\n').slice(-3).join(' ').slice(0, 400)}`);
        e.stderr = stderr;
        reject(e);
      } else resolve(stdout);
    });
    if (input !== undefined) child.stdin.end(input);
  });
}

/** Resolves the site stack's BucketName and DistributionId outputs (cloudformation:DescribeStacks). */
export async function stackOutputs(stack) {
  if (!/^[A-Za-z][A-Za-z0-9-]{0,127}$/.test(stack)) throw new Error('stack name is not a CloudFormation stack name');
  const out = JSON.parse(await aws(['cloudformation', 'describe-stacks', '--stack-name', stack, '--output', 'json']));
  const outputs = Object.fromEntries((out.Stacks?.[0]?.Outputs ?? []).map((o) => [o.OutputKey, o.OutputValue]));
  if (!outputs.BucketName || !outputs.DistributionId) throw new Error(`stack ${stack} has no BucketName/DistributionId outputs`);
  return { bucket: outputs.BucketName, distributionId: outputs.DistributionId };
}

/** The real bucket, through `aws s3api` (s3:GetObject, s3:PutObject, s3:ListBucket, s3:DeleteObject). */
export function awsStore(bucket) {
  const tmp = mkdtempSync(join(tmpdir(), 'publish-'));
  return {
    kind: 'aws',
    async get(key) {
      const file = join(tmp, randomUUID());
      try {
        await aws(['s3api', 'get-object', '--bucket', bucket, '--key', safeKey(key), file, '--output', 'json']);
        return readFileSync(file);
      } catch (e) {
        if (/NoSuchKey|\(404\)|Not Found/.test(e.stderr ?? '')) return null;
        throw e;
      } finally {
        rmSync(file, { force: true });
      }
    },
    async put(key, body, { contentType, cacheControl }) {
      const file = join(tmp, randomUUID());
      writeFileSync(file, body);
      try {
        await aws([
          's3api', 'put-object', '--bucket', bucket, '--key', safeKey(key), '--body', file,
          '--content-type', contentType, '--cache-control', cacheControl,
          '--checksum-algorithm', 'SHA256', '--output', 'json',
        ]);
      } finally {
        rmSync(file, { force: true });
      }
    },
    async list(prefix = '') {
      const out = await aws(['s3api', 'list-objects-v2', '--bucket', bucket, '--prefix', prefix, '--output', 'json']);
      const parsed = out.trim() ? JSON.parse(out) : {};
      return (parsed.Contents ?? []).map((o) => ({ key: o.Key, size: o.Size }));
    },
    async delete(keys) {
      for (let i = 0; i < keys.length; i += 1000) {
        const batch = { Objects: keys.slice(i, i + 1000).map((k) => ({ Key: safeKey(k) })), Quiet: true };
        const out = await aws(['s3api', 'delete-objects', '--bucket', bucket, '--delete', JSON.stringify(batch), '--output', 'json']);
        const errors = (out.trim() ? JSON.parse(out) : {}).Errors ?? [];
        if (errors.length) throw new Error(`delete-objects: ${errors.length} object(s) not deleted (first: ${errors[0].Key}: ${errors[0].Code})`);
      }
    },
  };
}

/** The real distribution (cloudfront:CreateInvalidation). */
export function awsCdn(distributionId) {
  return {
    async invalidate(paths) {
      const batch = { Paths: { Quantity: paths.length, Items: paths }, CallerReference: `www-${Date.now()}-${randomUUID()}` };
      const out = await aws([
        'cloudfront', 'create-invalidation', '--distribution-id', distributionId,
        '--invalidation-batch', JSON.stringify(batch), '--query', 'Invalidation.Id', '--output', 'text',
      ]);
      return out.trim();
    },
  };
}

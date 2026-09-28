import styles from './Logo.module.css';

export type LogoProps = {
  href: string;
};

export function Logo({ href }: LogoProps) {
  return (
    <a class={styles.logo} href={href}>
      <img class={styles.light} src="/logo-light.svg" alt="Redact Secret" width={944} height={817} />
      <img class={styles.dark} src="/logo-dark.svg" alt="Redact Secret" width={944} height={817} />
    </a>
  );
}

import type { ComponentChildren } from 'preact';
import styles from './Flow.module.css';

export type FlowProps = { children: ComponentChildren };

/** A vertical flow of nodes and arrows: rules and grids only, no SVG (design spec § 07). */
export function Flow({ children }: FlowProps) {
  return <div class={styles.flow}>{children}</div>;
}

export type FlowNodeProps = {
  title: ComponentChildren;
  children?: ComponentChildren;
  /** A 4px ink left rule — "this one is the point", without spending green. */
  marked?: boolean;
};

export function FlowNode({ title, children, marked }: FlowNodeProps) {
  return (
    <div class={[styles.node, marked && styles.marked].filter(Boolean).join(' ')}>
      <span class={styles.title}>{title}</span>
      {children && <span class={styles.desc}>{children}</span>}
    </div>
  );
}

export type FlowArrowProps = {
  /** What crosses this step, if it needs saying. */
  children?: ComponentChildren;
};

export function FlowArrow({ children }: FlowArrowProps) {
  return (
    <div class={styles.arrow}>
      <span aria-hidden="true">↓</span>
      {children && <> {children}</>}
    </div>
  );
}

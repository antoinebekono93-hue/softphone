"use client";

import { animate, useInView } from "motion/react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

type CssVars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * Révélation à base de CSS (aucun `opacity:0` au SSR).
 * Le contenu est toujours visible sans JavaScript : l'animation n'est
 * qu'un habillage d'entrée qui se joue aussi avant l'hydratation.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <div
      className={`reveal${className ? ` ${className}` : ""}`}
      style={{ "--reveal-delay": `${delay}s`, "--reveal-y": `${y}px` } as CssVars}
    >
      {children}
    </div>
  );
}

/** Conteneur stagger : les enfants <Item /> se révèlent avec un décalage. */
export function Stagger({
  children,
  className,
  delay = 0,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  return (
    <div
      className={`reveal-group${className ? ` ${className}` : ""}`}
      style={{ "--reveal-group-delay": `${delay}s`, "--reveal-group-stagger": `${stagger}s` } as CssVars}
    >
      {children}
    </div>
  );
}

export function Item({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

/** Titre dévoilé mot par mot (opacité + translation + léger blur) — 100% CSS. */
export function WordReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden
          className="word-reveal inline-block mr-[0.26em] last:mr-0"
          style={{ "--reveal-delay": `${delay + i * 0.055}s` } as CssVars}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

/** Compteur animé qui démarre quand l'élément entre dans le viewport.
 *  La valeur finale est rendue côté serveur → visible même sans JavaScript. */
export function AnimatedNumber({
  value,
  decimals = 0,
  compact = false,
  duration = 1.6,
  className,
}: {
  value: number;
  decimals?: number;
  compact?: boolean;
  duration?: number;
  className?: string;
}) {
  const format = (v: number) =>
    compact
      ? v.toLocaleString("fr-FR", { notation: "compact", maximumFractionDigits: v < 1000 ? 0 : 1 })
      : v.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(() => format(value));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, compact, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

"use client";

import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Reveal au scroll : fade + translation vers le haut, une seule fois. */
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
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
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
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
} as const;

export function Item({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/** Titre dévoilé mot par mot (opacité + translation + léger blur). */
export function WordReveal({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className} aria-label={text} role="text">
      {words.map((word, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block mr-[0.26em] last:mr-0"
          initial={{ opacity: 0, y: reduced ? 0 : 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, delay: delay + i * 0.055, ease: EASE }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

/** Compteur animé qui démarre quand l'élément entre dans le viewport. */
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
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        if (compact) {
          setDisplay(
            v.toLocaleString("fr-FR", {
              notation: "compact",
              maximumFractionDigits: v < 1000 ? 0 : 1,
            })
          );
        } else {
          setDisplay(
            v.toLocaleString("fr-FR", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })
          );
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, compact, decimals, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
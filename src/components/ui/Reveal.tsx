"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

type Props = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: Direction;
  distance?: number;
  className?: string;
  once?: boolean;
};

const OFFSETS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  none: { x: 0, y: 0 },
};

export function Reveal({
  children,
  delay = 0,
  duration = 0.8,
  direction = "up",
  distance,
  className,
  once = true,
}: Props) {
  const reduceMotion = useReducedMotion();
  const offset = OFFSETS[direction];
  const dx = distance !== undefined && offset.x !== 0 ? Math.sign(offset.x) * distance : offset.x;
  const dy = distance !== undefined && offset.y !== 0 ? Math.sign(offset.y) * distance : offset.y;

  const variants: Variants = {
    hidden: reduceMotion ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: dx, y: dy },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, delay, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

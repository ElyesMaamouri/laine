"use client";

import { useEffect, useRef } from "react";
import { garments, type GarmentId } from "@/lib/garments";
import { drawProductPhoto, loadImage, tinted, type Look } from "@/lib/warp";

/** Vraie photo du pull, recolorée selon la variante, centrée sur un fond */
export default function GarmentImage({
  garment,
  look,
  bg = "#efece6",
  width = 800,
  height = 1000,
  pad = 0.1,
  className = "",
  label,
}: {
  garment: GarmentId;
  look: Look;
  bg?: string;
  width?: number;
  height?: number;
  pad?: number;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { tint, filter } = look;

  useEffect(() => {
    let alive = true;
    loadImage(garments[garment].src).then((img) => {
      const c = ref.current;
      if (!alive || !c) return;
      drawProductPhoto(c.getContext("2d")!, width, height, tinted(img, { tint, filter }), bg, pad);
    });
    return () => {
      alive = false;
    };
  }, [garment, tint, filter, bg, width, height, pad]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      role="img"
      aria-label={label}
      className={`block h-full w-full ${className}`}
      style={{ background: bg }}
    />
  );
}

"use client";

import GarmentImage from "./GarmentImage";
import type { Product, Variant } from "@/lib/products";

/**
 * Visuel d'un coloris : la vraie photo envoyée depuis l'admin si elle existe,
 * sinon la photo de base recolorée.
 */
export default function ProductImage({
  p,
  v,
  width = 800,
  height = 1000,
  bg = "#efece6",
  pad = 0.1,
  label,
}: {
  p: Product;
  v: Variant;
  width?: number;
  height?: number;
  bg?: string;
  pad?: number;
  label?: string;
}) {
  if (v.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- image locale envoyée par l'admin
      <img src={v.photo} alt={label ?? `${p.name} ${v.name}`} className="block h-full w-full object-cover" style={{ background: bg }} loading="lazy" />
    );
  }
  return <GarmentImage label={label ?? `${p.name} ${v.name}`} garment={p.garment} look={v} width={width} height={height} bg={bg} pad={pad} />;
}

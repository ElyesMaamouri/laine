"use client";

import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import ProductForm from "@/components/admin/ProductForm";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminShell title="Modifier le produit">
      <ProductForm key={id} id={id} />
    </AdminShell>
  );
}

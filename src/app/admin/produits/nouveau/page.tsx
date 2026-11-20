"use client";

import AdminShell from "@/components/admin/AdminShell";
import ProductForm from "@/components/admin/ProductForm";

export default function Page() {
  return (
    <AdminShell title="Nouveau produit">
      <ProductForm id={null} />
    </AdminShell>
  );
}

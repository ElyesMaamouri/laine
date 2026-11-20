"use client";

import Field from "./Field";

export type CustomerInput = { name: string; email: string; phone: string; address: string; city: string; zip: string; note: string };
export const emptyCustomer: CustomerInput = { name: "", email: "", phone: "", address: "", city: "", zip: "", note: "" };

/** Coordonnées de livraison (utilisé par le checkout et la commande express) */
export default function CustomerForm({
  value,
  onChange,
  errors = {},
  compact,
}: {
  value: CustomerInput;
  onChange: (v: CustomerInput) => void;
  errors?: Record<string, string>;
  compact?: boolean;
}) {
  const set = (k: keyof CustomerInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [k]: e.target.value });
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field className="col-span-2" label="Nom complet" autoComplete="name" required value={value.name} onChange={set("name")} error={errors.name} />
      <Field className="col-span-2 sm:col-span-1" label="E-mail" type="email" autoComplete="email" required value={value.email} onChange={set("email")} error={errors.email} />
      <Field className="col-span-2 sm:col-span-1" label="Téléphone" type="tel" autoComplete="tel" required value={value.phone} onChange={set("phone")} error={errors.phone} />
      <Field className="col-span-2" label="Adresse" autoComplete="street-address" required value={value.address} onChange={set("address")} error={errors.address} />
      <Field label="Ville" autoComplete="address-level2" required value={value.city} onChange={set("city")} error={errors.city} />
      <Field label="Code postal" autoComplete="postal-code" required value={value.zip} onChange={set("zip")} error={errors.zip} />
      {!compact && (
        <Field className="col-span-2" textarea label="Instructions de livraison (optionnel)" value={value.note} onChange={set("note")} />
      )}
    </div>
  );
}

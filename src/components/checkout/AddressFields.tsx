"use client";

import { Field } from "./Field";

export interface AddressDraft {
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  country: "DE";
}

export const emptyAddress: AddressDraft = {
  firstName: "",
  lastName: "",
  company: "",
  street: "",
  houseNumber: "",
  zip: "",
  city: "",
  country: "DE",
};

interface Props {
  prefix: string;
  value: AddressDraft;
  onChange: (next: AddressDraft) => void;
  errors: Record<string, string>;
  /** Pfad-Präfix der Fehler, z. B. "billingAddress" */
  errorPath: string;
  autoCompleteSection: "billing" | "shipping";
}

export function AddressFields({ prefix, value, onChange, errors, errorPath, autoCompleteSection }: Props) {
  const set = (k: keyof AddressDraft) => (v: string) => onChange({ ...value, [k]: v });
  const err = (k: string) => errors[`${errorPath}.${k}`];
  const ac = (token: string) => `section-${autoCompleteSection} ${autoCompleteSection} ${token}`;
  return (
    <div className="grid gap-4 sm:grid-cols-6">
      <Field id={`${prefix}-firstName`} label="Vorname" value={value.firstName} onChange={set("firstName")} error={err("firstName")} autoComplete={ac("given-name")} className="sm:col-span-3" />
      <Field id={`${prefix}-lastName`} label="Nachname" value={value.lastName} onChange={set("lastName")} error={err("lastName")} autoComplete={ac("family-name")} className="sm:col-span-3" />
      <Field id={`${prefix}-company`} label="Firma" optional value={value.company} onChange={set("company")} error={err("company")} autoComplete={ac("organization")} className="sm:col-span-6" />
      <Field id={`${prefix}-street`} label="Straße" value={value.street} onChange={set("street")} error={err("street")} autoComplete={ac("address-line1")} className="sm:col-span-4" />
      <Field id={`${prefix}-houseNumber`} label="Hausnummer" value={value.houseNumber} onChange={set("houseNumber")} error={err("houseNumber")} className="sm:col-span-2" />
      <Field
        id={`${prefix}-zip`}
        label="PLZ"
        value={value.zip}
        onChange={(v) => set("zip")(v.replace(/\D/g, "").slice(0, 5))}
        error={err("zip")}
        inputMode="numeric"
        autoComplete={ac("postal-code")}
        className="sm:col-span-2"
      />
      <Field id={`${prefix}-city`} label="Ort" value={value.city} onChange={set("city")} error={err("city")} autoComplete={ac("address-level2")} className="sm:col-span-4" />
      <div className="sm:col-span-6">
        <p className="field-label">Land</p>
        <p className="rounded-xl border border-line bg-mist px-4 py-3 text-[15px]">Deutschland</p>
        <p className="mt-1.5 text-xs text-muted">Wir liefern derzeit nur innerhalb Deutschlands.</p>
      </div>
    </div>
  );
}

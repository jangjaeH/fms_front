import type { PropsWithChildren } from "react";

interface FieldProps extends PropsWithChildren {
  label: string;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

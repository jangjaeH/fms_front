import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  tone?: "primary" | "neutral" | "danger";
}

export function ActionButton({ tone = "primary", className = "", children, ...props }: ActionButtonProps) {
  return (
    <button {...props} className={`action-button action-button--${tone} ${className}`.trim()}>
      {children}
    </button>
  );
}

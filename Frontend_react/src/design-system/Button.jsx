import { forwardRef } from "react";
import { cx } from "./cx";

/**
 * Botão do design system Shelf.
 * variant: "primary" (escuro) | "secondary" (neutro) | "ghost" (só contorno)
 * size: "sm" | "md" | "lg"
 * as: "button" (padrão) ou "a" para links.
 */
export const Button = forwardRef(function Button(
  { as: Tag = "button", variant = "primary", size = "md", className, type, ...props },
  ref,
) {
  const extra = Tag === "button" ? { type: type || "button" } : {};
  return (
    <Tag
      ref={ref}
      className={cx("ds-button", `ds-button--${variant}`, `ds-button--${size}`, className)}
      {...extra}
      {...props}
    />
  );
});

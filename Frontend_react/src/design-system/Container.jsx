import { cx } from "./cx";

/** Limita a largura do conteúdo e aplica a margem lateral padrão. size: "default" | "narrow" | "wide" */
export function Container({ as: Tag = "div", size = "default", className, ...props }) {
  return <Tag className={cx("ds-container", size !== "default" && `ds-container--${size}`, className)} {...props} />;
}

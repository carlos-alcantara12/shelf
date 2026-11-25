import { cx } from "./cx";

/** Faixa de página com espaçamento vertical padrão. tone: "page" | "raised" | "inverse" */
export function Section({ as: Tag = "section", tone = "page", className, ...props }) {
  return <Tag className={cx("ds-section", `ds-section--${tone}`, className)} {...props} />;
}

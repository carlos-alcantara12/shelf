import { cx } from "./cx";

/**
 * Título com a escala tipográfica do Shelf.
 * level: 1-6, define a tag (h1…h6) e é o que importa para acessibilidade.
 * size: "display" | "h1" | "h2" | "h3", define o visual (padrão acompanha o level).
 * serif: usa a Cormorant Garamond (títulos de livros e citações).
 * tone: "primary" | "secondary"
 */
export function Heading({ level = 2, size, serif = false, tone = "primary", className, ...props }) {
  const Tag = `h${level}`;
  const visual = size || (level <= 3 ? `h${level}` : "h3");
  return (
    <Tag
      className={cx(
        "ds-heading",
        `ds-heading--${visual}`,
        serif && "ds-heading--serif",
        tone === "secondary" && "ds-heading--secondary",
        className,
      )}
      {...props}
    />
  );
}

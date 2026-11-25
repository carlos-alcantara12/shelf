import { useEffect, useState } from "react";

/** Sumário fixo "Nesta página": destaca a seção que está na tela e leva até a escolhida. */
export default function SectionNav({ items }) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const elements = items.map((item) => document.getElementById(item.id)).filter(Boolean);
    if (elements.length === 0) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [items]);

  function go(event, id) {
    event.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  return (
    <nav className="dg-toc" aria-label="Nesta página">
      <p className="dg-toc__title">Nesta página</p>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={active === item.id ? "is-active" : ""} onClick={(event) => go(event, item.id)}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

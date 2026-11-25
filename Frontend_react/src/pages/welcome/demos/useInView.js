import { useEffect, useState } from "react";

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Informa se o elemento está visível (inclusive dentro do trilho horizontal do
 * carrossel). Vira `false` ao sair da tela, por qualquer lado, e `true` de novo
 * quando volta; é isso que reinicia as animações a cada passagem.
 */
export function useInView(ref, threshold = 0.6) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return inView;
}

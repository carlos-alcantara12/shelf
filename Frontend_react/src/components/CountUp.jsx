import { useEffect, useState } from "react";

/**
 * Número que sobe de 0 até `value` e recomeça sempre que o valor muda.
 * Com movimento reduzido no sistema, mostra o valor final direto. `format` transforma o número em texto.
 */
export default function CountUp({ value, format = (number) => number.toLocaleString("pt-BR"), duration = 900 }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return undefined;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value, duration]);

  return format(shown);
}

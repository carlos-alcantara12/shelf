import { useEffect, useRef, useState } from "react";
import { hdCover } from "@/lib/books";

const RETRY_DELAY = 1500;
const withRetryParam = (url) => `${url}${url.includes("?") ? "&" : "?"}_r=${Date.now()}`;

/**
 * Capa em alta qualidade: tenta a melhor versão; se falhar, a original; se falhar de novo (os catálogos
 * online limitam pedidos em rajada), espera um instante e tenta mais uma vez. Só depois disso chama
 * `onFail`, para o pai mostrar um cartão alternativo.
 */
export default function BookCover({ url, alt = "", className, onFail, ...props }) {
  const best = hdCover(url);
  const [source, setSource] = useState(best);
  const attemptRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function handleError() {
    attemptRef.current += 1;
    if (attemptRef.current === 1 && best !== url) {
      setSource(url);
    } else if (attemptRef.current <= 2) {
      timerRef.current = window.setTimeout(() => setSource(withRetryParam(url)), RETRY_DELAY);
    } else {
      onFail?.();
    }
  }

  return <img {...props} className={className} src={source} alt={alt} decoding="async" onError={handleError} />;
}

const PAGES = [1, 2, 3, 4];
const DUST = [0, 1, 2, 3, 4, 5, 6];

/**
 * Livro 3D em CSS puro. Um único relógio (`--t`, de 0 a 1, ciclo de 12 s) comanda
 * tudo: a capa abre, as páginas viram uma a uma (com sombra e leve curvatura),
 * o livro fica aberto soltando partículas de luz e depois fecha e recomeça.
 */
export default function LoginBook() {
  return (
    <div className="lb-scene" aria-hidden="true">
      <div className="lb-glow" />
      <div className="lb-shadow" />
      <div className="lb-dust">
        {DUST.map((i) => (
          <i key={i} style={{ "--i": i }} />
        ))}
      </div>
      <div className="lb-float">
        <div className="lb">
          <div className="lb-back" />
          <div className="lb-end">
            <i className="lb-ribbon" />
          </div>
          <div className="lb-spine" />
          <div className="lb-edge" />
          <div className="lb-top" />
          {PAGES.map((k) => (
            <div className="lb-page" key={k} style={{ "--k": k, "--s": 0.3 + (k - 1) * 0.1 }}>
              <b className="lb-face lb-face--front" />
              <b className="lb-face lb-face--back" />
            </div>
          ))}
          <div className="lb-cover">
            <div className="lb-cover__front">
              <svg viewBox="0 0 240 200" focusable="false">
                <rect x="63" y="34" width="37" height="120" rx="6" />
                <rect x="105" y="23" width="42" height="131" rx="6" />
                <rect x="155" y="35" width="38" height="123" rx="6" transform="rotate(-17 174 96.5)" />
                <rect x="34" y="165" width="172" height="11" rx="1" />
              </svg>
              <span>Shelf</span>
            </div>
            <div className="lb-cover__inside" />
          </div>
        </div>
      </div>
    </div>
  );
}

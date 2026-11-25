// Cor predominante da capa de um livro, para pintar a lombada na estante.
// A imagem é reduzida num canvas pequeno e as cores são agrupadas; cores vivas pesam mais que branco, preto e cinza,
// para que a lombada tenha a "cara" da capa e não o fundo dela. O resultado fica guardado por endereço de capa.

const STORAGE_KEY = "shelf:cover-colors";
const memory = new Map();
const pending = new Map();
let stored = null;

function readStore() {
  if (stored) return stored;
  try {
    stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    stored = {};
  }
  return stored;
}

function writeStore(url, color) {
  const store = readStore();
  store[url] = color;
  const keys = Object.keys(store);
  if (keys.length > 300) delete store[keys[0]];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // sem armazenamento: o cache em memória basta
  }
}

const toHex = ([r, g, b]) => `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;

/** Escolhe a cor predominante entre os pixels (grupos de 32 níveis por canal, com peso pela saturação). */
function dominant(data) {
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const lightness = (max + min) / 510;
    // quase branco ou quase preto quase nunca é a "cor" do livro
    const weight = (0.15 + saturation * 2.2) * (lightness > 0.92 || lightness < 0.07 ? 0.2 : 1);
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const bucket = buckets.get(key) || { weight: 0, r: 0, g: 0, b: 0, count: 0 };
    bucket.weight += weight;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  let best = null;
  buckets.forEach((bucket) => {
    if (!best || bucket.weight > best.weight) best = bucket;
  });
  return best ? [best.r / best.count, best.g / best.count, best.b / best.count] : null;
}

/** Deixa a cor boa para uma lombada: nem lavada, nem tão clara que o título suma. */
function forSpine([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 510;
  let factor = 1;
  if (lightness > 0.62) factor = 0.62 / lightness;
  if (lightness < 0.16) factor = 0.16 / Math.max(lightness, 0.02);
  return [r, g, b].map((value) => Math.min(255, value * factor));
}

/** Cor do texto (claro ou escuro) que lê bem sobre a cor da lombada. */
export function inkFor(hex) {
  const value = parseInt(hex.slice(1), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#2b2118" : "#fffaf0";
}

function load(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 24;
        canvas.height = 36;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0, 24, 36);
        const color = dominant(context.getImageData(0, 0, 24, 36).data);
        resolve(color ? toHex(forSpine(color)) : null);
      } catch {
        resolve(null); // imagem de outro domínio sem permissão de leitura
      }
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

/** Cor predominante da capa (hex) ou null se não for possível ler a imagem. */
export function coverColor(url) {
  if (!url) return Promise.resolve(null);
  if (memory.has(url)) return Promise.resolve(memory.get(url));
  const saved = readStore()[url];
  if (saved) {
    memory.set(url, saved);
    return Promise.resolve(saved);
  }
  if (!pending.has(url)) {
    pending.set(
      url,
      load(url).then((color) => {
        pending.delete(url);
        if (color) {
          memory.set(url, color);
          writeStore(url, color);
        }
        return color;
      }),
    );
  }
  return pending.get(url);
}

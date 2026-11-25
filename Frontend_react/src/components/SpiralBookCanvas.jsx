import { useEffect, useRef } from "react";

const PALETTE = ["#9d3f36", "#d59a36", "#286b78", "#4b477f", "#9b5572", "#52734a", "#355b91", "#aa6840"];
const TAU = Math.PI * 2;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function createSpiral(width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const innerRadius = Math.min(width, height) * 0.29;
  const outerRadius = Math.hypot(width, height) * 0.62;
  const turns = 2.7;
  const endAngle = turns * TAU;
  const pitch = (outerRadius - innerRadius) / endAngle;
  const count = clamp(Math.round(((innerRadius + outerRadius) / 2) * endAngle / 116), 32, 74);
  return { centerX, centerY, innerRadius, outerRadius, endAngle, pitch, count };
}

function drawFallback(context, title, index, width, height) {
  const color = PALETTE[index % PALETTE.length];
  const gradient = context.createLinearGradient(-width / 2, -height / 2, width / 2, height / 2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "#14121c");
  context.fillStyle = gradient;
  context.fillRect(-width / 2, -height / 2, width, height);
  context.fillStyle = "rgba(255,245,224,.82)";
  context.fillRect(-width / 2 + 6, -height / 2 + 8, 2, height - 16);
  context.fillStyle = "rgba(255,245,224,.9)";
  context.font = `600 ${Math.max(7, width * 0.12)}px Georgia, serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const words = (title || "Shelf").split(/\s+/).slice(0, 5);
  words.forEach((word, line) => context.fillText(word, 0, (line - (words.length - 1) / 2) * width * 0.15, width - 10));
}

/**
 * Espiral de capas girando. `background` é a cor de fundo do canvas e `dim`
 * (0 a 1) escurece as capas, útil sobre fundos escuros.
 */
export default function SpiralBookCanvas({ items = [], background = "#f5efe6", dim = 0 }) {
  const canvasRef = useRef(null);
  const sourcesKey = items.map((item) => item?.image).join("|");

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: false });
    const host = canvas?.parentElement;
    if (!canvas || !context || !host) return undefined;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = media.matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let geometry = null;
    let frame = 0;
    let startedAt = null;
    let pausedAt = null;
    let alive = true;

    const covers = items.map((item, index) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = requestDraw;
      image.src = item.image;
      return { image, title: item.title || "Shelf", index };
    });

    function render(timestamp = 0) {
      frame = 0;
      if (!alive || !geometry) return;
      if (startedAt === null) startedAt = timestamp;
      const elapsed = reducedMotion ? 0 : Math.max(0, timestamp - startedAt) / 1000;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const { centerX, centerY, innerRadius, endAngle, pitch, count } = geometry;
      const phase = elapsed * 0.065;
      for (let index = 0; index < count; index += 1) {
        const progress = (index + 0.5) / count;
        const curveAngle = progress * endAngle;
        const angle = curveAngle + phase;
        const distance = innerRadius + pitch * curveAngle;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        const tangentX = pitch * Math.cos(angle) - distance * Math.sin(angle);
        const tangentY = pitch * Math.sin(angle) + distance * Math.cos(angle);
        const rotation = Math.atan2(tangentY, tangentX) + Math.PI / 2;
        const variation = 0.92 + 0.08 * Math.sin(index * 2.17);
        const scale = (0.6 + progress * 0.62) * variation;
        const bookWidth = (58 + progress * 40) * scale;
        const bookHeight = (90 + progress * 58) * scale;
        const opacity = (0.32 + progress * 0.66) * (1 - dim);
        const cover = covers[(index * 7) % Math.max(covers.length, 1)];
        if (x < -bookHeight || x > width + bookHeight || y < -bookHeight || y > height + bookHeight) continue;

        context.save();
        context.translate(x, y);
        context.rotate(rotation);
        context.globalAlpha = opacity;
        context.shadowColor = "rgba(20,18,25,.38)";
        context.shadowBlur = 14 * scale;
        context.shadowOffsetY = 6 * scale;
        context.fillStyle = PALETTE[index % PALETTE.length];
        context.fillRect(-bookWidth / 2, -bookHeight / 2, bookWidth, bookHeight);
        context.shadowColor = "transparent";
        if (cover?.image.complete && cover.image.naturalWidth > 0) {
          context.drawImage(cover.image, -bookWidth / 2, -bookHeight / 2, bookWidth, bookHeight);
        } else {
          drawFallback(context, cover?.title || "Shelf", index, bookWidth, bookHeight);
        }
        context.strokeStyle = "rgba(36,33,44,.36)";
        context.lineWidth = Math.max(0.6, scale * 0.8);
        context.strokeRect(-bookWidth / 2, -bookHeight / 2, bookWidth, bookHeight);
        context.restore();
      }

      if (!reducedMotion && !document.hidden) frame = requestAnimationFrame(render);
    }

    function requestDraw() {
      if (alive && !frame) frame = requestAnimationFrame(render);
    }

    function resize() {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      geometry = createSpiral(width, height);
      requestDraw();
    }

    function handleMotionChange(event) {
      reducedMotion = event.matches;
      startedAt = null;
      if (reducedMotion) {
        cancelAnimationFrame(frame);
        frame = 0;
        render();
      } else if (!document.hidden) {
        startedAt = performance.now();
        requestDraw();
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        pausedAt = performance.now();
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        if (pausedAt !== null && startedAt !== null) startedAt += performance.now() - pausedAt;
        pausedAt = null;
        requestDraw();
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    media.addEventListener("change", handleMotionChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    resize();

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      media.removeEventListener("change", handleMotionChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      covers.forEach(({ image }) => { image.onload = null; });
    };
  }, [items, sourcesKey, background, dim]);

  return <canvas ref={canvasRef} className="spiral-book-canvas" aria-hidden="true" />;
}

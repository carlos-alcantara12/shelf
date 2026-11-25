import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { prefersReducedMotion, useInView } from "./useInView";

const PERCENT = 68;
const PAGES = 340;
const TOTAL = 500;
const GOAL = 14;
const GOAL_TOTAL = 24;
const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const WEEK = [
  { day: "S", value: 38 },
  { day: "T", value: 62 },
  { day: "Q", value: 48 },
  { day: "Q", value: 82 },
  { day: "S", value: 56 },
  { day: "S", value: 92 },
  { day: "D", value: 70 },
];

/**
 * Progresso de leitura. Cada vez que o card entra na tela (rolando para baixo
 * ou para cima) o anel, a barra, os números e as colunas se enchem de novo.
 */
export default function ProgressDemo() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      const counters = gsap.utils.toArray("[data-count]");
      const show = (element, value) => {
        element.textContent = Math.round(value);
      };
      counters.forEach((element) => show(element, 0));
      gsap.set(".pd-ring__value", { strokeDashoffset: CIRCUMFERENCE });
      gsap.set(".pd-bar__fill", { scaleX: 0, transformOrigin: "left center" });
      gsap.set(".pd-week__bar", { scaleY: 0, transformOrigin: "center bottom" });
      if (!inView) return;

      const timeline = gsap.timeline({ defaults: { ease: "power2.out" } });
      timeline
        .to(".pd-ring__value", { strokeDashoffset: CIRCUMFERENCE * (1 - PERCENT / 100), duration: 1.6 }, 0)
        .to(".pd-bar__fill", { scaleX: 1, duration: 1.6 }, 0)
        .to(".pd-week__bar", { scaleY: 1, duration: 0.8, stagger: 0.08 }, 0.25);
      counters.forEach((element) => {
        const progress = { value: 0 };
        timeline.to(
          progress,
          { value: Number(element.dataset.count), duration: 1.6, onUpdate: () => show(element, progress.value) },
          0,
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, [inView]);

  return (
    <div className="feature-demo feature-demo--progress" ref={rootRef}>
      <div className="demo-stage" aria-hidden="true">
        <div className="demo-panel pd">
          <div className="pd-head">
            <div className="pd-ring">
              <svg viewBox="0 0 84 84">
                <circle className="pd-ring__track" cx="42" cy="42" r={RADIUS} />
                <circle
                  className="pd-ring__value"
                  cx="42"
                  cy="42"
                  r={RADIUS}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - PERCENT / 100)}
                />
              </svg>
              <span className="pd-ring__label">
                <b data-count={PERCENT}>{PERCENT}</b>
                <small>%</small>
              </span>
            </div>
            <div className="pd-info">
              <strong>O nome do vento</strong>
              <span>
                <b data-count={PAGES}>{PAGES}</b> de {TOTAL} páginas
              </span>
              <div className="pd-bar">
                <i className="pd-bar__fill" style={{ width: `${PERCENT}%` }} />
              </div>
            </div>
          </div>
          <div className="pd-goal">
            <span>Meta anual</span>
            <span>
              <b data-count={GOAL}>{GOAL}</b> / {GOAL_TOTAL}
            </span>
          </div>
          <div className="pd-week">
            {WEEK.map((item, index) => (
              <span className="pd-week__col" key={index}>
                <i className="pd-week__bar" style={{ height: `${item.value}%` }} />
                <small>{item.day}</small>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

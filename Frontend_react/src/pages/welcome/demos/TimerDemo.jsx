import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, useInView } from "./useInView";

const START_SECONDS = 24 * 60 + 18;
const GOAL_SECONDS = 30 * 60;
const pad = (value) => String(value).padStart(2, "0");

/** Cronômetro de leitura: os segundos correm enquanto o card está visível. */
export default function TimerDemo() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef);
  const [reduced] = useState(prefersReducedMotion);
  const [seconds, setSeconds] = useState(START_SECONDS);

  useEffect(() => {
    if (reduced) return undefined;
    if (!inView) {
      setSeconds(START_SECONDS);
      return undefined;
    }
    const timer = window.setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [inView, reduced]);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const progress = Math.min(1, seconds / GOAL_SECONDS);

  return (
    <div className="feature-demo feature-demo--timer" ref={rootRef}>
      <div className="demo-stage" aria-hidden="true">
        <div className="demo-panel td">
          <span className="td-eyebrow">Sessão de leitura</span>
          <div className="td-clock">
            <span>{pad(hours)}</span>:<span>{pad(minutes)}</span>:
            <span key={rest} className="td-clock__tick">
              {pad(rest)}
            </span>
          </div>
          <span className="td-book">A biblioteca da meia-noite</span>
          <div className="td-bar">
            <i style={{ transform: `scaleX(${progress})` }} />
          </div>
          <div className="td-foot">
            <span className={`td-status${inView ? " is-live" : ""}`}>
              <i /> leitura em andamento
            </span>
            <span>Meta de 30 min</span>
          </div>
        </div>
      </div>
    </div>
  );
}

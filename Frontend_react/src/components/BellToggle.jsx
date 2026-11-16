import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification03Icon } from "@hugeicons/core-free-icons";
import "./BellToggle.css";

const ringFrames = (amplitude, passes) => [
  { transform: "rotate(0deg)" },
  ...Array.from({ length: passes }, (_, index) => ({
    transform: `rotate(${(amplitude * (index % 2 ? 1 : -1) * (1 - index / passes)).toFixed(2)}deg)`,
  })),
  { transform: "rotate(0deg)" },
];

/** Bell ring animation with both toggle and action-only modes. */
export default function BellToggle({
  icon,
  label = "Notifications",
  color = "#f5f5f5",
  background = "transparent",
  count = 0,
  badge = true,
  badgeColor = "#ef4444",
  badgeTextColor = "#ffffff",
  ringAmplitude = 17,
  ringPasses = 5,
  ringDuration = 820,
  waves = true,
  pressed,
  defaultPressed = false,
  onChange,
  onAction,
  disabled = false,
  className = "",
}) {
  const [inner, setInner] = useState(defaultPressed);
  const reducedMotion = useReducedMotion();
  const glyphRef = useRef(null);
  const leftWaveRef = useRef(null);
  const rightWaveRef = useRef(null);
  const previousCount = useRef(count);
  const actionMode = typeof onAction === "function";
  const on = pressed ?? inner;

  const ring = () => {
    if (reducedMotion || !glyphRef.current) return;
    glyphRef.current.animate(ringFrames(ringAmplitude, ringPasses), {
      duration: ringDuration,
      easing: "cubic-bezier(0.77, 0, 0.175, 1)",
    });
    if (waves) {
      [leftWaveRef.current, rightWaveRef.current].forEach((wave, index) => {
        wave?.animate(
          [
            { opacity: 0, transform: "scale(.55)" },
            { opacity: 0.75, offset: 0.3 },
            { opacity: 0, transform: "scale(1.25)" },
          ],
          { duration: 380, delay: index * 110, easing: "ease-out" },
        );
      });
    }
  };

  useEffect(() => {
    const increased = count > previousCount.current;
    previousCount.current = count;
    if (increased && (actionMode || on)) ring();
  }, [count, actionMode, on]);

  const handleClick = () => {
    if (actionMode) {
      ring();
      onAction();
      return;
    }
    const next = !on;
    if (pressed === undefined) setInner(next);
    onChange?.(next);
    if (next) ring();
  };

  const showBadge = badge && count > 0 && (actionMode || on);

  return (
    <motion.span
      className={`bell-toggle${className ? ` ${className}` : ""}`}
      data-on={on ? "true" : "false"}
      data-disabled={disabled ? "" : undefined}
      style={{
        "--bt-color": color,
        "--bt-bg": background,
        "--bt-badge": badgeColor,
        "--bt-badge-ink": badgeTextColor,
      }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
    >
      <button
        type="button"
        className="bell-toggle__button"
        aria-pressed={actionMode ? undefined : on}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
      >
        <span className="bell-toggle__bell" aria-hidden="true">
          <span ref={glyphRef} className="bell-toggle__glyph">
            {icon ?? <HugeiconsIcon icon={Notification03Icon} size={16} strokeWidth={2} />}
          </span>
          {waves && <>
            <svg ref={leftWaveRef} className="bell-toggle__wave bell-toggle__wave--left" viewBox="0 0 14 14" aria-hidden="true"><path d="M14 8a6 6 0 0 0-6 6M14 4A10 10 0 0 0 4 14" /></svg>
            <svg ref={rightWaveRef} className="bell-toggle__wave bell-toggle__wave--right" viewBox="0 0 14 14" aria-hidden="true"><path d="M0 8a6 6 0 0 1 6 6M0 4a10 10 0 0 1 10 10" /></svg>
          </>}
          {badge && <span className="bell-toggle__badge" data-show={showBadge ? "" : undefined}>
            <span key={count} className="bell-toggle__digit">{count > 9 ? "9+" : count}</span>
          </span>}
        </span>
      </button>
    </motion.span>
  );
}

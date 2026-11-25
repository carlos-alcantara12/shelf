// Ícones de traço usados nos chips de tema das perguntas e nos eixos do resultado.
// As chaves vêm do backend (`topic.icon`).

const PATHS = {
  book: "M5 4.5h10a3 3 0 0 1 3 3V19H8a3 3 0 0 1-3-3V4.5Z M5 16a3 3 0 0 1 3-3h10",
  gauge: "M4 15a8 8 0 1 1 16 0 M12 15l4-4",
  mask: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z M9 10v.5 M15 10v.5 M9 15c1 1 2 1.5 3 1.5s2-.5 3-1.5",
  heart: "M12 20s-7-4.4-7-9.5A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.5C19 15.6 12 20 12 20Z",
  ruler: "M4 16 16 4l4 4L8 20l-4-4Z M9 11l2 2 M12 8l2 2 M6 14l2 2",
  shield: "M12 4l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V7l7-3Z M9 12l2 2 4-4",
  device: "M7 4h10v16H7z M11 17h2",
  repeat: "M5 12a7 7 0 0 1 12-5l2 2 M19 12a7 7 0 0 1-12 5l-2-2 M19 5v4h-4 M5 19v-4h4",
  sparkle: "M12 4l1.8 4.7L18.5 10l-4.7 1.8L12 16.5l-1.8-4.7L5.5 10l4.7-1.3L12 4Z M18 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z",
  puzzle: "M9 4h3a2 2 0 1 1 4 0h3v4a2 2 0 1 0 0 4v4h-4a2 2 0 1 0-4 0H7v-4a2 2 0 1 1 0-4V4h2Z",
  calendar: "M5 6h14v13H5z M5 10h14 M9 4v4 M15 4v4",
  people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M3.5 19c.4-3 2.5-4.5 5.5-4.5s5.1 1.5 5.5 4.5 M16 6a3 3 0 0 1 0 5.5 M17 14.8c2 .5 3.2 2 3.5 4.2",
  compass: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z M15 9l-2 4-4 2 2-4 4-2Z",
  globe: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z M4 12h16 M12 4c2.5 2.2 3.5 5 3.5 8s-1 5.8-3.5 8c-2.5-2.2-3.5-5-3.5-8s1-5.8 3.5-8Z",
  star: "M12 4l2.4 5 5.4.7-4 3.7 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.7 5.4-.7L12 4Z",
  target: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M12 12h.01",
};

export default function TopicIcon({ name, className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name] || PATHS.book} />
    </svg>
  );
}

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import "./styles/tokens.css";
import "./styles.css";
import "./design-system/design-system.css";

const root = createRoot(document.getElementById("root"));

// Página de referência do design system: só existe no servidor de desenvolvimento.
if (import.meta.env.DEV && window.location.pathname === "/dev/design") {
  import("./design-system/DesignSystemPage.jsx").then(({ default: DesignSystemPage }) => {
    root.render(<DesignSystemPage />);
  });
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

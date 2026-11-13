import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { SiteNav, Studio } from "./components/site/studio";
import "./components/site/site.css";

function App() {
  return (
    <div className="site">
      <a className="skip-link" href="#index">
        Skip to the project list
      </a>
      <SiteNav />
      <main>
        <Studio />
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import type { PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";

export function Layout({ children }: PropsWithChildren) {
  const location = useLocation();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Przejdź do treści</a>
      <header className="topbar">
        <Link className="brand" to="/" aria-label="English Quiz — strona główna">English Quiz</Link>
        {location.pathname !== "/" && (
          <nav aria-label="Główna nawigacja">
            <Link className="link-button" to="/">Kategorie</Link>
          </nav>
        )}
      </header>
      <main id="main-content" className="page-container" tabIndex={-1}>{children}</main>
    </div>
  );
}

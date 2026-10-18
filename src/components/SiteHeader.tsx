import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { profile } from "../data/profile";
import { routeToPath, type Route } from "../state/routes";
import { useViewStore } from "../state/store";
import { ContactMenu } from "./ContactMenu";

interface Props {
  mode: "gallery" | "list";
  canShowGallery: boolean;
}

// Secciones de la vista en lista, además de "Sobre mí" y "Contacto".
const LIST_LINKS = [
  { href: "#proyectos", label: "Proyectos" },
  { href: "#experiencia", label: "Experiencia" },
];

// Redes del perfil (GitHub, LinkedIn), como íconos en la cápsula.
const SOCIAL = profile.contacts.filter((c) => c.external);
const ICONS: Record<string, string> = {
  github:
    "M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z",
  linkedin:
    "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z",
};

// Header: a la izquierda, una pestaña del color del marco de la galería con el rol y el nombre; a la
// derecha, una cápsula clara con la navegación (Sobre mí, la vista en lista, Contacto y las redes). En la
// vista en lista la navegación es solo texto sobre la pared (Sobre mí, Proyectos, Experiencia, Contacto) y
// toma un fondo suave al scrollear, cuando ya pasaría sobre el contenido. El CV se descarga desde el panel de Contacto. En pantallas angostas Contacto sigue a la vista y
// los otros links pasan a un menú que se despliega debajo.
export function SiteHeader({ mode, canShowGallery }: Props) {
  const navigate = useViewStore((s) => s.navigate);
  const route = useViewStore((s) => s.route);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const nav = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!nav.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  // En la lista, el nombre del hero está a la vista arriba: la pestaña aparece cuando queda debajo del header.
  // Sin IntersectionObserver la pestaña queda siempre a la vista.
  const [heroNameVisible, setHeroNameVisible] = useState(
    mode === "list" && typeof IntersectionObserver !== "undefined",
  );
  useEffect(() => {
    const name = document.getElementById("hero-title");
    if (mode !== "list" || !name || typeof IntersectionObserver === "undefined")
      return;
    const observer = new IntersectionObserver(
      ([e]) => setHeroNameVisible(e.isIntersecting),
      { rootMargin: "-90px 0px 0px 0px" },
    );
    observer.observe(name);
    return () => observer.disconnect();
  }, [mode]);

  // Esc cierra el menú y no llega a la escena (ahí Esc retrocede un nivel).
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !menuOpen) return;
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    setMenuOpen(false);
    menuButton.current?.focus();
  };

  const toggle: { route: Route; label: string } | null =
    mode === "gallery"
      ? { route: { name: "list" }, label: "Ver como lista" }
      : canShowGallery
        ? { route: { name: "intro" }, label: "Ver galería 3D" }
        : null;

  // "Sobre mí": en la galería lleva a la zona 3D; en la lista, a su sección.
  const aboutHref =
    mode === "gallery"
      ? routeToPath(
          { name: "about", section: "laboral" },
          import.meta.env.BASE_URL,
        )
      : "#sobre-mi";
  const inAbout =
    mode === "gallery" &&
    (route.name === "about" || route.name === "aboutEntry");
  // Sin la pestaña donde el nombre ya está grande: la placa de la intro y el hero de la lista.
  const nameElsewhere =
    mode === "gallery" ? route.name === "intro" : heroNameVisible;
  const onAbout = (e: MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false);
    if (
      mode !== "gallery" ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.button !== 0
    )
      return;
    e.preventDefault();
    navigate({ name: "about", section: "laboral" });
  };

  const onToggle = (e: MouseEvent<HTMLAnchorElement>) => {
    setMenuOpen(false);
    if (!toggle || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
      return;
    e.preventDefault();
    navigate(toggle.route);
    window.scrollTo(0, 0);
  };

  return (
    <header
      className={`site-header ${mode === "gallery" ? "site-header--overlay" : "site-header--list"} ${mode === "list" && !heroNameVisible ? "site-header--scrolled" : ""}`}
    >
      {mode === "list" && (
        <a className="skip-link" href="#proyectos">
          Saltar a los proyectos
        </a>
      )}
      <div className="site-header__inner">
        {/* Pestaña en la esquina, del color del marco de la galería: el rol arriba, chico, y el nombre. No está
            mientras el nombre se ve grande (la placa de la intro, el hero de la lista): baja desde arriba después. */}
        <p
          className={`site-header__id ${nameElsewhere ? "site-header__id--away" : ""}`}
          aria-hidden={nameElsewhere || undefined}
        >
          <span className="site-header__name">{profile.name}</span>
          <span className="site-header__role">{profile.role}</span>
        </p>
        <div className="site-header__end">
          <nav
            ref={nav}
            className="site-nav"
            aria-label="Principal"
            onKeyDown={onKeyDown}
          >
            <div
              id={menuId}
              className={`site-nav__links ${menuOpen ? "site-nav__links--open" : ""}`}
            >
              <a
                className="site-nav__link"
                href={aboutHref}
                onClick={onAbout}
                aria-current={inAbout ? "page" : undefined}
              >
                Sobre mí
              </a>
              {/* En la lista, las secciones de la página (la galería 3D se abre desde la portada). */}
              {mode === "list" &&
                LIST_LINKS.map((l) => (
                  <a
                    key={l.href}
                    className="site-nav__link"
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {l.label}
                  </a>
                ))}
              {mode === "gallery" && toggle && (
                <a
                  className="site-nav__link"
                  href={routeToPath(toggle.route, import.meta.env.BASE_URL)}
                  onClick={onToggle}
                >
                  {toggle.label}
                </a>
              )}
            </div>
            <ContactMenu mode={mode} />
            {mode === "gallery" && (
              <ul className="site-nav__social">
                {SOCIAL.map((c) => (
                  <li key={c.id}>
                    <a
                      className="site-nav__icon"
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${c.label} (se abre en una pestaña nueva)`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        aria-hidden="true"
                      >
                        <path d={ICONS[c.id]} fill="currentColor" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <button
              ref={menuButton}
              type="button"
              className="site-nav__more"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              aria-label="Más opciones"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

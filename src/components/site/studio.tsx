import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { OfficeGame } from "./office/OfficeGame";
import {
  CONTACT,
  items,
  path,
  skillGroups,
  type Category,
  type ProjectItem,
  type ShelfItem,
} from "./data";

const CATEGORY_LABEL: Record<Category, string> = {
  ai: "AI and automation",
  web: "Web app",
  devops: "DevOps",
  game: "Games and desktop",
  me: "About me",
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ----------------------------------------------------------------- nav */

export function SiteNav() {
  return (
    <header className="nav">
      <a className="nav__brand" href="#office">
        <span aria-hidden="true" className="nav__dot" />
        Houssame Mehrach
      </a>
      <nav aria-label="Sections" className="nav__links">
        <a href="#office">Office</a>
        <a href="#index">Index</a>
        <a href="#talk">Contact</a>
      </nav>
      <a className="nav__cta" href={`mailto:${CONTACT.email}`}>
        Email me
      </a>
    </header>
  );
}

/* --------------------------------------------------------------- shelf */

interface OpenState {
  id: string;
  from: DOMRect | null;
}

export function Studio() {
  const [open, setOpen] = useState<OpenState | null>(null);
  return (
    <>
      <OfficeGame onOpen={(id) => setOpen({ id, from: null })} paused={open !== null} />
      <IndexSection onOpen={(id) => setOpen({ id, from: null })} />
      <Talk />
      {open ? (
        <Drawer
          from={open.from}
          id={open.id}
          onClose={() => setOpen(null)}
          onNavigate={(id) => setOpen({ id, from: null })}
        />
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------- drawer */

function Drawer({
  id,
  from,
  onClose,
  onNavigate,
}: {
  id: string;
  from: DOMRect | null;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const index = Math.max(
    0,
    items.findIndex((i) => i.id === id),
  );
  const item = items[index];
  const heroRef = useRef<HTMLImageElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const prevId = items[(index - 1 + items.length) % items.length].id;
  const nextId = items[(index + 1) % items.length].id;

  // Fly the object from its cubby into the drawer (FLIP), or pop it in when browsing.
  useLayoutEffect(() => {
    const hero = heroRef.current;
    if (!hero || prefersReducedMotion() || typeof hero.animate !== "function") return;
    const to = hero.getBoundingClientRect();
    if (from && to.width > 0) {
      const scale = from.width / to.width;
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      hero.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
          { transform: "translate(0, 0) scale(1.06) rotate(-2deg)", offset: 0.75 },
          { transform: "translate(0, 0) scale(1) rotate(0deg)" },
        ],
        { duration: 760, easing: "cubic-bezier(0.2, 0.85, 0.25, 1)" },
      );
    } else {
      hero.animate(
        [
          { transform: "translateY(24px) scale(0.92)", opacity: 0 },
          { transform: "translateY(0) scale(1)", opacity: 1 },
        ],
        { duration: 420, easing: "cubic-bezier(0.2, 0.85, 0.25, 1)" },
      );
    }
  }, [id, from]);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, [id]);

  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate(nextId);
      if (e.key === "ArrowLeft") onNavigate(prevId);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onNavigate, nextId, prevId]);

  return (
    <div aria-labelledby="drawer-title" aria-modal="true" className="drawer" role="dialog">
      <div aria-hidden="true" className="drawer__backdrop" onClick={onClose} />
      <div className="drawer__sheet">
        <div className="drawer__stage">
          <img alt={item.objectAlt} className="drawer__object" key={item.id} ref={heroRef} src={item.object} />
          <div className="drawer__browse">
            <button className="round-btn" onClick={() => onNavigate(prevId)} type="button">
              <span aria-hidden="true">‹</span>
              <span className="sr-only">Previous item</span>
            </button>
            <span>
              {index + 1} of {items.length}
            </span>
            <button className="round-btn" onClick={() => onNavigate(nextId)} type="button">
              <span aria-hidden="true">›</span>
              <span className="sr-only">Next item</span>
            </button>
          </div>
        </div>
        <div className="drawer__panel" key={item.id}>
          <button className="drawer__close" onClick={onClose} ref={closeRef} type="button">
            Close
          </button>
          <DrawerContent item={item} />
        </div>
      </div>
    </div>
  );
}

function DrawerContent({ item }: { item: ShelfItem }) {
  if (item.kind === "project") return <ProjectContent item={item} />;
  return (
    <>
      <p className="meta">{CATEGORY_LABEL.me}</p>
      <h2 className="drawer__title" id="drawer-title">
        {item.label}
      </h2>
      <p className="drawer__tagline">{item.tagline}</p>
      {item.kind === "skills" ? <SkillsContent /> : null}
      {item.kind === "about" ? <AboutContent /> : null}
      {item.kind === "path" ? <PathContent /> : null}
      {item.kind === "contact" ? <ContactContent /> : null}
    </>
  );
}

function ProjectContent({ item }: { item: ProjectItem }) {
  return (
    <>
      <p className="meta">
        {item.year}, {CATEGORY_LABEL[item.categories[0]]}
      </p>
      <h2 className="drawer__title" id="drawer-title">
        {item.label}
      </h2>
      <p className="drawer__tagline">{item.tagline}</p>
      <div className="drawer__links">
        {item.links.map((link, i) => (
          <a
            className={i === 0 ? "link-primary" : "link-secondary"}
            href={link.href}
            key={link.href}
            rel="noreferrer"
            target="_blank"
          >
            {link.label}
          </a>
        ))}
      </div>
      <p className="drawer__text">{item.detail}</p>
      {item.points ? (
        <ul className="points">
          {item.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}
      <ul aria-label="Stack" className="chips">
        {item.stack.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      {item.diagram ? <TraveloDiagram /> : null}
      {item.shots.length ? (
        <div className="shots" data-count={item.shots.length}>
          {item.shots.map((shot) => (
            <figure className="shot" data-tall={shot.tall || undefined} key={shot.src}>
              <img alt={shot.alt} decoding="async" loading="lazy" src={shot.src} />
            </figure>
          ))}
        </div>
      ) : null}
    </>
  );
}

function TraveloDiagram() {
  return (
    <figure
      aria-label="Travelo cluster: an Ingress routes to two frontend and two backend replicas; the backend talks to a MySQL StatefulSet. Helm, Skaffold and the MySQL Operator sit around the namespace."
      className="k8s"
    >
      <div className="k8s__ns">
        <span className="k8s__ns-label">namespace travelo</span>
        <div className="k8s__box k8s__ingress">Ingress</div>
        <div className="k8s__row">
          <div className="k8s__box">
            <span>frontend</span>
            <span className="k8s__pods">
              <i />
              <i />
            </span>
            <small>React, Nginx</small>
          </div>
          <div className="k8s__box">
            <span>backend</span>
            <span className="k8s__pods">
              <i />
              <i />
            </span>
            <small>Spring Boot</small>
          </div>
        </div>
        <div className="k8s__box">
          <span>MySQL StatefulSet</span>
          <small>headless Service, seed Job</small>
        </div>
        <ul className="k8s__tags">
          <li>ResourceQuota</li>
          <li>RBAC</li>
          <li>PodDisruptionBudget</li>
          <li>Probes</li>
        </ul>
      </div>
      <ul className="k8s__tags k8s__tags--tools">
        <li>Helm chart</li>
        <li>Skaffold</li>
        <li>InnoDB Cluster Operator</li>
      </ul>
    </figure>
  );
}

function SkillsContent() {
  return (
    <div className="skills">
      {skillGroups.map((g) => (
        <div className="skills__group" key={g.name}>
          <h3>{g.name}</h3>
          <dl>
            {g.skills.map((s) => (
              <div key={s.name}>
                <dt>{s.name}</dt>
                <dd>
                  {s.where.map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function AboutContent() {
  return (
    <div className="about">
      <p className="drawer__text">
        I came to software through two years of preparatory maths and physics, then joined INPT's software engineering track in 2025. I like work that needs a clean model underneath and a product people can actually use on top.
      </p>
      <p className="drawer__text">
        Lately I've been building AI agents that run real workflows, and learning how to ship them properly: containers, Kubernetes and automated tests.
      </p>
      <dl className="facts">
        <div>
          <dt>Languages</dt>
          <dd>Arabic (native), French and English (fluent)</dd>
        </div>
        <div>
          <dt>Outside class</dt>
          <dd>INPT clubs, football and volleyball</dd>
        </div>
        <div>
          <dt>Based in</dt>
          <dd>Rabat, Morocco</dd>
        </div>
      </dl>
    </div>
  );
}

function PathContent() {
  return (
    <ol className="path">
      {path.map((step) => (
        <li key={step.when}>
          <span className="path__when">{step.when}</span>
          <span className="path__what">{step.what}</span>
          <span className="path__where">{step.where}</span>
        </li>
      ))}
    </ol>
  );
}

function CopyEmail() {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      setState("done");
    } catch {
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2400);
  };
  return (
    <button className="copy" onClick={copy} type="button">
      {state === "done" ? "Address copied" : state === "failed" ? "Copy failed, select the address" : "Copy address"}
    </button>
  );
}

function ContactContent() {
  return (
    <div className="contact">
      <a className="contact__email" href={`mailto:${CONTACT.email}`}>
        {CONTACT.email}
      </a>
      <div className="contact__row">
        <CopyEmail />
        <a className="link-secondary" href={CONTACT.github} rel="noreferrer" target="_blank">
          GitHub
        </a>
        <a className="link-secondary" href={CONTACT.linkedin} rel="noreferrer" target="_blank">
          LinkedIn
        </a>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- index */

function IndexSection({ onOpen }: { onOpen: (id: string) => void }) {
  const projects = items.filter((i): i is ProjectItem => i.kind === "project");
  return (
    <section aria-labelledby="index-title" className="index" id="index">
      <h2 className="index__title" id="index-title">
        Index
      </h2>
      <p className="index__lede">The same shelf as a list, if you'd rather read than browse.</p>
      <ol className="index__list">
        {projects.map((p) => (
          <li key={p.id}>
            <button className="index__row" onClick={() => onOpen(p.id)} type="button">
              <img alt="" className="index__thumb" loading="lazy" src={p.object} />
              <span className="index__name">{p.label}</span>
              <span className="index__tagline">{p.tagline}</span>
              <span className="index__year">{p.year}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------------------------------------------------------- talk */

function Talk() {
  return (
    <section aria-labelledby="talk-title" className="talk" id="talk">
      <h2 className="talk__title" id="talk-title">
        Have an internship in mind?
      </h2>
      <ContactContent />
      <footer className="foot">
        <span>Houssame Mehrach, Rabat</span>
        <span>The studio, the film and the objects were made with AI for this site.</span>
      </footer>
    </section>
  );
}

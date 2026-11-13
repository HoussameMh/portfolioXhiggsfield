export const CONTACT = {
  email: "mehrachhoussam111@gmail.com",
  github: "https://github.com/HoussameMh",
  linkedin: "https://www.linkedin.com/in/houssame-mehrach",
};

export type Category = "ai" | "web" | "devops" | "game" | "me";

export const FILTERS: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "ai", label: "AI and automation" },
  { id: "web", label: "Web apps" },
  { id: "devops", label: "DevOps" },
  { id: "game", label: "Games and desktop" },
  { id: "me", label: "About me" },
];

export interface Link {
  label: string;
  href: string;
}

export interface Shot {
  src: string;
  alt: string;
  tall?: boolean;
}

interface Base {
  id: string;
  label: string;
  object: string;
  objectAlt: string;
  row: 0 | 1 | 2;
  col: 0 | 1 | 2 | 3;
  categories: Category[];
}

export interface ProjectItem extends Base {
  kind: "project";
  year: string;
  tagline: string;
  detail: string;
  points?: string[];
  stack: string[];
  links: Link[];
  shots: Shot[];
  diagram?: boolean;
}

export interface InfoItem extends Base {
  kind: "skills" | "about" | "path" | "contact";
  tagline: string;
}

export type ShelfItem = ProjectItem | InfoItem;

const obj = (name: string) => `/assets/studio/${name}.webp`;

export const items: ShelfItem[] = [
  {
    kind: "project",
    id: "nova-os",
    label: "Nova OS",
    object: obj("nova-os"),
    objectAlt: "A white assistant sphere with a glowing blue ring",
    row: 0,
    col: 0,
    categories: ["ai", "web"],
    year: "2026",
    tagline: "An AI workspace that works inside your Gmail, Drive and Trello.",
    detail:
      "Connect Gmail and talk to Nova in plain language. It sorts incoming mail, opens Trello tasks, watches ERP indicators and turns a meeting recording into structured minutes. Built in a team of two at INPT, with a web app and a mobile app on the same backend.",
    points: [
      "Automation backend in n8n, hosted on Azure, connected to Gmail, Drive and Trello through OAuth",
      "Meeting minutes: Deepgram transcription with speaker mapping, then GPT summaries you can edit",
      "React 19 web app with Tailwind and Framer Motion, plus an Expo and React Native mobile client",
    ],
    stack: ["React 19", "n8n", "OpenAI", "LangChain", "Deepgram", "Azure", "Expo"],
    links: [
      { label: "Web source", href: "https://github.com/HoussameMh/nova-os" },
      { label: "Mobile source", href: "https://github.com/HoussameMh/Nova-OS-mobile" },
    ],
    shots: [
      { src: "/assets/work/novaos-dash.webp", alt: "Nova OS dashboard with the AI assistant, quick actions and live ERP status" },
      { src: "/assets/work/novaos-pv.webp", alt: "Nova OS meeting minutes generator: upload a recording, set date, type, participants and language" },
    ],
  },
  {
    kind: "project",
    id: "travelo",
    label: "Travelo on Kubernetes",
    object: obj("travelo"),
    objectAlt: "A white and blue ship's helm wheel beside small shipping containers",
    row: 0,
    col: 1,
    categories: ["devops", "web"],
    year: "2026",
    tagline: "A flight booking app, deployed the way production teams deploy.",
    detail:
      "React, Spring Boot and MySQL running in their own namespace with quotas, RBAC, health probes, a disruption budget and an Ingress. Packaged as a Helm chart served from the repo, with Skaffold for the dev loop and a three-node MySQL InnoDB Cluster managed by an Operator.",
    stack: ["Kubernetes", "Helm", "Docker", "Skaffold", "Spring Boot", "MySQL"],
    links: [{ label: "Source", href: "https://github.com/HoussameMh/travelo-k8s" }],
    shots: [],
    diagram: true,
  },
  {
    kind: "project",
    id: "tock",
    label: "Tock's Wind-Up Workshop",
    object: obj("tock"),
    objectAlt: "A cream and blue wind-up toy robot with a brass key",
    row: 0,
    col: 2,
    categories: ["game"],
    year: "2026",
    tagline: "A 3D platformer about a clockwork toy racing across a workbench.",
    detail:
      "Five levels, a three-phase boss and 195 automated tests, including bots that finish every level. Made in Godot 4 with Claude Code's agent studio, then tuned to hold 60 FPS on an Intel HD 520.",
    stack: ["Godot 4", "GDScript", "Automated tests"],
    links: [{ label: "Source", href: "https://github.com/HoussameMh/tocks-wind-up-workshop" }],
    shots: [
      { src: "/assets/work/tock-baron.webp", alt: "Tock facing Baron Rust, a bench vise boss, in the final arena" },
      { src: "/assets/work/tock-start.webp", alt: "Tock at the start of the Workbench Run course" },
    ],
  },
  {
    kind: "project",
    id: "atlas",
    label: "Atlas Tamghrabit",
    object: obj("atlas"),
    objectAlt: "A blue and white tabletop globe with a brass compass on a map",
    row: 0,
    col: 3,
    categories: ["web"],
    year: "2026",
    tagline: "A pocket guide to Moroccan heritage, in French and Arabic.",
    detail:
      "Cities, monuments and crafts with an interactive Leaflet map and a quiz. Installable as a PWA, with a service worker so it keeps working offline.",
    stack: ["JavaScript", "Leaflet", "PWA", "Service worker"],
    links: [{ label: "Source", href: "https://github.com/HoussameMh/atlas-tamghrabit" }],
    shots: [{ src: "/assets/work/atlas.webp", alt: "Atlas Tamghrabit home screen featuring Jemaa el-Fna, Marrakech and Fès", tall: true }],
  },
  {
    kind: "project",
    id: "nova-market",
    label: "Nova Market",
    object: obj("nova-market"),
    objectAlt: "A white shopping bag with blue handles and a gift box",
    row: 1,
    col: 0,
    categories: ["web"],
    year: "2025",
    tagline: "A full-stack store with accounts, cart, orders and reviews.",
    detail:
      "React and Vite on the front, an Express 5 REST API with JWT and bcrypt behind it, and MongoDB for products and orders. Prices in MAD, filters by price and rating.",
    stack: ["React", "Vite", "Express", "MongoDB", "JWT"],
    links: [
      { label: "Live site", href: "https://nova-market-web.vercel.app" },
      { label: "Source", href: "https://github.com/HoussameMh/Ecommerce-Project" },
    ],
    shots: [{ src: "/assets/work/nova-market.webp", alt: "Nova Market shop page with category filters and product cards" }],
  },
  {
    kind: "project",
    id: "nova-fund",
    label: "Nova Fund",
    object: obj("nova-fund"),
    objectAlt: "A glass donation jar of gold coins with a blue heart tag",
    row: 1,
    col: 1,
    categories: ["web"],
    year: "2025",
    tagline: "A crowdfunding platform for community projects.",
    detail:
      "Create a campaign, donate to others, and follow your projects and donations from your own dashboard. MVC Express API with JWT auth, and a vanilla JavaScript front end served from the same deployment.",
    stack: ["Node.js", "Express", "MongoDB", "Vanilla JS"],
    links: [
      { label: "Live site", href: "https://backend-project-plum-beta.vercel.app" },
      { label: "Source", href: "https://github.com/HoussameMh/CrowdFunding-Project" },
    ],
    shots: [{ src: "/assets/work/nova-fund.webp", alt: "Nova Fund home page with search, hero illustration and featured projects" }],
  },
  {
    kind: "project",
    id: "aeroport",
    label: "Gestion Aéroport",
    object: obj("aeroport"),
    objectAlt: "A white model airliner with a blue stripe on a stand",
    row: 1,
    col: 2,
    categories: ["game"],
    year: "2024",
    tagline: "A desktop app to run an airport: flights, passengers, aircraft and runways.",
    detail:
      "JavaFX tabs on top of an object model with inheritance and custom exceptions (unavailable aircraft, overweight baggage, full flights). Data goes through JDBC to MySQL or H2, with a singleton connection manager.",
    stack: ["Java", "JavaFX", "JDBC", "MySQL", "Maven"],
    links: [{ label: "Source", href: "https://github.com/HoussameMh/gestionaeroport-java" }],
    shots: [],
  },
  {
    kind: "project",
    id: "burger",
    label: "Hou's Burger",
    object: obj("burger"),
    objectAlt: "A glossy toy cheeseburger on a blue plate",
    row: 1,
    col: 3,
    categories: ["web", "game"],
    year: "2024",
    tagline: "A restaurant site where you build your own burger, plus a mini game.",
    detail:
      "Plain HTML, CSS and JavaScript: a landing page and menu, a layer-by-layer burger builder, and a small browser game with win and lose states.",
    stack: ["HTML", "CSS", "JavaScript"],
    links: [
      { label: "Live site", href: "https://hou-s-burger.vercel.app" },
      { label: "Source", href: "https://github.com/HoussameMh/Hou-s-Burger" },
    ],
    shots: [{ src: "/assets/work/hous-burger.webp", alt: "Hou's Burger landing page with the hero burger and menu cards" }],
  },
  {
    kind: "skills",
    id: "skills",
    label: "Skills",
    object: obj("skills"),
    objectAlt: "A stack of blue, white and grey books with a small succulent",
    row: 2,
    col: 0,
    categories: ["me"],
    tagline: "What I use, and the projects where I used it.",
  },
  {
    kind: "about",
    id: "about",
    label: "About me",
    object: obj("about"),
    objectAlt: "A framed portrait of Houssame Mehrach",
    row: 2,
    col: 1,
    categories: ["me"],
    tagline: "Software engineering student at INPT Rabat, now in my second year.",
  },
  {
    kind: "path",
    id: "path",
    label: "Education",
    object: obj("path"),
    objectAlt: "A graduation cap with a blue tassel on a rolled diploma",
    row: 2,
    col: 2,
    categories: ["me"],
    tagline: "From a maths baccalaureate to INPT's software engineering track.",
  },
  {
    kind: "contact",
    id: "contact",
    label: "Contact",
    object: obj("contact"),
    objectAlt: "A blue retro rotary telephone",
    row: 2,
    col: 3,
    categories: ["me"],
    tagline: "Open to software engineering, AI automation and DevOps internships.",
  },
];

export const skillGroups: { name: string; skills: { name: string; where: string[] }[] }[] = [
  {
    name: "Languages",
    skills: [
      { name: "JavaScript", where: ["Nova OS", "Atlas", "Nova Market", "Nova Fund", "Hou's Burger"] },
      { name: "TypeScript", where: ["Nova OS mobile"] },
      { name: "Java", where: ["Travelo", "Gestion Aéroport", "Coursework"] },
      { name: "Python", where: ["Coursework"] },
      { name: "C", where: ["Coursework"] },
      { name: "SQL", where: ["Travelo", "Gestion Aéroport", "Coursework"] },
      { name: "GDScript", where: ["Tock"] },
    ],
  },
  {
    name: "Interfaces",
    skills: [
      { name: "React", where: ["Nova OS", "Travelo", "Nova Market"] },
      { name: "React Native, Expo", where: ["Nova OS mobile"] },
      { name: "Tailwind, Framer Motion", where: ["Nova OS"] },
      { name: "HTML, CSS", where: ["Atlas", "Nova Fund", "Hou's Burger"] },
      { name: "JavaFX", where: ["Gestion Aéroport"] },
    ],
  },
  {
    name: "Back end and data",
    skills: [
      { name: "Node.js, Express", where: ["Nova Market", "Nova Fund"] },
      { name: "Spring Boot", where: ["Travelo"] },
      { name: "MongoDB", where: ["Nova Market", "Nova Fund"] },
      { name: "MySQL, JDBC", where: ["Travelo", "Gestion Aéroport"] },
      { name: "JWT, bcrypt", where: ["Nova Market", "Nova Fund"] },
    ],
  },
  {
    name: "AI and automation",
    skills: [
      { name: "n8n", where: ["Nova OS"] },
      { name: "OpenAI GPT, LangChain", where: ["Nova OS"] },
      { name: "Deepgram", where: ["Nova OS"] },
      { name: "Prompt engineering", where: ["Nova OS", "Tock"] },
    ],
  },
  {
    name: "Shipping",
    skills: [
      { name: "Docker, Kubernetes, Helm", where: ["Travelo", "Coursework"] },
      { name: "Vercel, Azure", where: ["Nova OS", "Nova Market", "Nova Fund"] },
      { name: "Automated tests", where: ["Tock"] },
      { name: "Git, GitHub", where: ["Every project"] },
    ],
  },
];

export const path = [
  { when: "2023", what: "Baccalauréat, Sciences Maths A", where: "Lycée Lalla Amina, Mention Très Bien" },
  { when: "2023 to 2025", what: "CPGE, MPSI then MP", where: "Maths, physics and engineering science. Ranked 237 of 3,000" },
  { when: "2025", what: "INPT engineering cycle", where: "Advanced Software Engineering for Digital Services (ASEDS)" },
  { when: "2026", what: "Second year at INPT", where: "Now in INE2. Coursework includes containerizing and orchestrating applications" },
];

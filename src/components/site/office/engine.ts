/**
 * The walkable office: a three.js scene built from Poly Haven models,
 * real project screenshots on the monitors, and a Higgsfield view of Rabat
 * through the windows. Client-only: imported lazily from an effect.
 */
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export interface OfficeCallbacks {
  onProgress: (ratio: number) => void;
  onReady: () => void;
  onOpen: (id: string) => void;
  onPrompt: (id: string | null) => void;
}

export interface OfficeHandle {
  setActive: (active: boolean) => void;
  goTo: (id: string) => void;
  setStick: (x: number, y: number) => void;
  dispose: () => void;
}

export interface OfficeStation {
  id: string;
  label: string;
}

type V3 = [number, number, number];

interface StationDef {
  id: string;
  anchor: V3; // label + look target
  stand: V3; // where the camera goes to view it
  hit: { center: V3; size: V3 };
}

const MODELS = "/assets/office/models/";
const TEX = "/assets/office/tex/";
const WORK = "/assets/work/";

const ROOM = { minX: -9, maxX: 9, minZ: -7, maxZ: 7, h: 3.4 };
const EYE = 1.6;
const START: V3 = [0, EYE, 5.4];

const deskRow1 = -2.4;
const deskRow2 = 1.6;
const deskX = [-5.4, -1.8, 1.8];

const deskStation = (id: string, x: number, z: number): StationDef => ({
  id,
  anchor: [x, 1.12, z - 0.25],
  stand: [x, 1.52, z + 1.45],
  hit: { center: [x, 0.8, z], size: [1.7, 1.6, 1.2] },
});

const STATIONS: StationDef[] = [
  deskStation("nova-os", deskX[0], deskRow1),
  deskStation("nova-market", deskX[1], deskRow1),
  deskStation("nova-fund", deskX[2], deskRow1),
  deskStation("atlas", deskX[0], deskRow2),
  deskStation("burger", deskX[1], deskRow2),
  deskStation("aeroport", deskX[2], deskRow2),
  {
    id: "tock",
    anchor: [6.9, 1.35, -4.8],
    stand: [5.2, 1.55, -4.8],
    hit: { center: [6.9, 1.0, -4.8], size: [1.0, 2.0, 1.0] },
  },
  {
    id: "travelo",
    anchor: [8.05, 1.3, -1.6],
    stand: [5.6, 1.6, -1.3],
    hit: { center: [8.05, 1.0, -1.6], size: [1.0, 2.1, 2.2] },
  },
  {
    id: "skills",
    anchor: [-5.2, 1.25, 6.55],
    stand: [-5.2, 1.6, 4.4],
    hit: { center: [-5.2, 1.0, 6.55], size: [2.2, 2.2, 0.8] },
  },
  {
    id: "about",
    anchor: [-1.9, 1.7, 6.95],
    stand: [-1.9, 1.62, 5.1],
    hit: { center: [-1.9, 1.7, 6.9], size: [1.0, 1.25, 0.3] },
  },
  {
    id: "path",
    anchor: [0.4, 1.7, 6.95],
    stand: [0.4, 1.62, 5.1],
    hit: { center: [0.4, 1.7, 6.9], size: [1.0, 1.3, 0.3] },
  },
  {
    id: "contact",
    anchor: [2.9, 1.55, 6.9],
    stand: [2.9, 1.6, 5.1],
    hit: { center: [2.9, 1.5, 6.85], size: [1.2, 1.4, 0.4] },
  },
];

/* Real code from the repos, shown on two monitors. */
const JAVA = `package com.example.javafx2.logic;
import java.util.Date;

public class Passager extends Personne {
    private Vol vol;
    private double masse_bag;

    public Passager(String num_passeport, String nom,
            String prenom, String genre, Date date_naissance,
            Vol vol, double masse_bag) throws VolCompletException {
        // Vérifie la disponibilité des sièges
        vol.seatDispo();
        this.vol = vol;
        this.setNum_passeport(num_passeport);
        this.setNom(nom);
        this.masse_bag = masse_bag;
        vol.ajouter_passager(this);
    }

    public boolean verifier_bag() throws BagageTropLourdException {
        if (this.masse_bag < this.vol.getAvion().getMasse_supportee()) {
            return true;
        }
        throw new BagageTropLourdException(this.masse_bag,
            this.vol.getAvion().getMasse_supportee());
    }
}`;

const YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: travelo-backend
  namespace: travelo
spec:
  replicas: 2
  revisionHistoryLimit: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: travelo-backend

$ kubectl get pods -n travelo
NAME                         READY   STATUS
travelo-backend-7c9f-2xkq    1/1     Running
travelo-backend-7c9f-9tdl    1/1     Running
travelo-frontend-5b8d-hq4m   1/1     Running
travelo-frontend-5b8d-wz7c   1/1     Running
mysql-0                      1/1     Running`;

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (ctx) draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function codeTexture(code: string, kind: "java" | "yaml") {
  return canvasTexture(1280, 760, (ctx) => {
    ctx.fillStyle = "#0f1426";
    ctx.fillRect(0, 0, 1280, 760);
    ctx.fillStyle = "#181f3a";
    ctx.fillRect(0, 0, 1280, 44);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(26 + i * 24, 22, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#8b93c4";
    ctx.font = "500 20px Menlo, Consolas, monospace";
    ctx.fillText(kind === "java" ? "Passager.java" : "05-backend.yaml  +  terminal", 110, 29);
    ctx.font = "21px Menlo, Consolas, monospace";
    code.split("\n").forEach((line, i) => {
      const y = 80 + i * 25.5;
      ctx.fillStyle = "#4b5384";
      ctx.fillText(String(i + 1).padStart(2, " "), 18, y);
      let color = "#d7dcf5";
      const t = line.trim();
      if (kind === "java") {
        if (t.startsWith("//")) color = "#6c7aa8";
        else if (/^(package|import|public|private|throw|return|if)\b/.test(t)) color = "#7aa2ff";
      } else {
        if (t.startsWith("$")) color = "#5ee6a8";
        else if (/Running$/.test(t)) color = "#bfe8d4";
        else if (/^[a-zA-Z]+:/.test(t)) color = "#7aa2ff";
      }
      ctx.fillStyle = color;
      ctx.fillText(line, 64, y);
    });
  });
}

function posterTexture(title: string, lines: [string, string][], accent: string) {
  return canvasTexture(900, 1200, (ctx) => {
    ctx.fillStyle = "#fbfbfd";
    ctx.fillRect(0, 0, 900, 1200);
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 900, 16);
    ctx.fillStyle = "#0a0f2c";
    ctx.font = "800 76px 'Syne', 'Arial Black', sans-serif";
    ctx.fillText(title, 64, 150);
    let y = 260;
    lines.forEach(([a, b]) => {
      ctx.fillStyle = accent;
      ctx.font = "600 34px 'Geist', Arial, sans-serif";
      ctx.fillText(a, 64, y);
      ctx.fillStyle = "#0a0f2c";
      ctx.font = "500 38px 'Geist', Arial, sans-serif";
      const words = b.split(" ");
      let line = "";
      let yy = y + 52;
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > 770) {
          ctx.fillText(line, 64, yy);
          line = w;
          yy += 48;
        } else line = test;
      }
      ctx.fillText(line, 64, yy);
      y = yy + 96;
    });
  });
}

function signTexture(lines: { text: string; font: string; color: string; y: number }[], bg: string, w = 1024, h = 512) {
  return canvasTexture(w, h, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = "center";
    lines.forEach((l) => {
      ctx.font = l.font;
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, w / 2, l.y);
    });
  });
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function createOffice(
  canvas: HTMLCanvasElement,
  labelLayer: HTMLElement,
  stations: OfficeStation[],
  cb: OfficeCallbacks,
): OfficeHandle {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#eef0f6");
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.42;

  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 80);
  camera.rotation.order = "YXZ";
  const state = {
    pos: new THREE.Vector3(...START),
    yaw: 0,
    pitch: -0.06,
    active: false,
    disposed: false,
  };

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_u, loaded, total) => cb.onProgress(total ? loaded / total : 0);
  const gltfLoader = new GLTFLoader(manager);
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  const texLoader = new THREE.TextureLoader(manager);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const loadTex = (url: string, srgb = true) => {
    const t = texLoader.load(url);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, maxAniso);
    return t;
  };

  /* ---------------------------------------------------------- room shell */
  const wallMat = new THREE.MeshStandardMaterial({ color: "#f2f1ee", roughness: 0.94 });
  const accentMat = new THREE.MeshStandardMaterial({ color: "#2f4ae8", roughness: 0.88 });
  const trimMat = new THREE.MeshStandardMaterial({ color: "#e4e2dc", roughness: 0.7 });
  const frameMat = new THREE.MeshStandardMaterial({ color: "#2a2d33", roughness: 0.45, metalness: 0.6 });

  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, cast = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };

  // floor
  const floorTex = {
    map: loadTex(`${TEX}wood_floor_diff.webp`),
    normalMap: loadTex(`${TEX}wood_floor_nor_gl.webp`, false),
    roughnessMap: loadTex(`${TEX}wood_floor_rough.webp`, false),
  };
  Object.values(floorTex).forEach((t) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(6, 5);
  });
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.maxX - ROOM.minX, ROOM.maxZ - ROOM.minZ),
    new THREE.MeshStandardMaterial({ ...floorTex, color: "#e9dccb", roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM.maxX - ROOM.minX, ROOM.maxZ - ROOM.minZ),
    new THREE.MeshStandardMaterial({ color: "#fbfbfa", roughness: 1 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM.h;
  scene.add(ceiling);

  const W = ROOM.maxX - ROOM.minX;
  const D = ROOM.maxZ - ROOM.minZ;
  // south, west, east walls
  box(W, ROOM.h, 0.2, wallMat, 0, ROOM.h / 2, ROOM.maxZ + 0.1);
  box(0.2, ROOM.h, D, wallMat, ROOM.minX - 0.1, ROOM.h / 2, 0);
  box(0.2, ROOM.h, D, accentMat, ROOM.maxX + 0.1, ROOM.h / 2, 0);
  // baseboards
  box(W, 0.1, 0.03, trimMat, 0, 0.05, ROOM.maxZ - 0.015, false);
  box(0.03, 0.1, D, trimMat, ROOM.minX + 0.015, 0.05, 0, false);

  // north wall with four tall windows
  const sill = 0.55;
  const head = 2.95;
  box(W, sill, 0.25, wallMat, 0, sill / 2, ROOM.minZ - 0.12);
  box(W, ROOM.h - head, 0.25, wallMat, 0, (ROOM.h + head) / 2, ROOM.minZ - 0.12);
  const pillar = 0.7;
  const mull = 0.22;
  const span = W - pillar * 2;
  const winW = (span - mull * 3) / 4;
  box(pillar, head - sill, 0.25, wallMat, ROOM.minX + pillar / 2, (head + sill) / 2, ROOM.minZ - 0.12);
  box(pillar, head - sill, 0.25, wallMat, ROOM.maxX - pillar / 2, (head + sill) / 2, ROOM.minZ - 0.12);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: "#dfe8f2",
    roughness: 0.05,
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  for (let i = 0; i < 4; i++) {
    const x0 = ROOM.minX + pillar + i * (winW + mull);
    if (i > 0) box(mull, head - sill, 0.25, wallMat, x0 - mull / 2, (head + sill) / 2, ROOM.minZ - 0.12);
    const cx = x0 + winW / 2;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(winW, head - sill), glassMat);
    g.position.set(cx, (head + sill) / 2, ROOM.minZ - 0.1);
    scene.add(g);
    // slim black frames + one transom bar
    box(winW, 0.04, 0.06, frameMat, cx, sill + 0.02, ROOM.minZ - 0.02, false);
    box(winW, 0.04, 0.06, frameMat, cx, head - 0.02, ROOM.minZ - 0.02, false);
    box(winW, 0.03, 0.05, frameMat, cx, 2.15, ROOM.minZ - 0.02, false);
    box(0.03, head - sill, 0.05, frameMat, cx, (head + sill) / 2, ROOM.minZ - 0.02, false);
  }
  // window sill ledge
  box(W - pillar * 2, 0.04, 0.32, trimMat, 0, sill + 0.02, ROOM.minZ + 0.1, false);

  // Rabat outside
  const city = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 17),
    new THREE.MeshBasicMaterial({ map: loadTex(`${TEX}rabat.webp`), toneMapped: false }),
  );
  city.position.set(0, 1.2, ROOM.minZ - 13);
  scene.add(city);

  /* -------------------------------------------------------------- light */
  scene.add(new THREE.HemisphereLight("#ffffff", "#cbbfae", 0.75));
  const sun = new THREE.DirectionalLight("#fff3e0", 3.2);
  sun.position.set(-5, 9, -17);
  sun.target.position.set(1, 0, 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -14;
  sun.shadow.camera.right = 14;
  sun.shadow.camera.top = 14;
  sun.shadow.camera.bottom = -14;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 50;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight("#dfe6ff", 0.55);
  fill.position.set(6, 5, 8);
  scene.add(fill);

  /* ---------------------------------------------------------- obstacles */
  const obstacles: THREE.Box2[] = [];
  const block = (cx: number, cz: number, w: number, d: number) =>
    obstacles.push(new THREE.Box2(new THREE.Vector2(cx - w / 2, cz - d / 2), new THREE.Vector2(cx + w / 2, cz + d / 2)));

  /* ------------------------------------------------------------- models */
  const cache = new Map<string, Promise<GLTF>>();
  const loadModel = (name: string) => {
    let p = cache.get(name);
    if (!p) {
      p = gltfLoader.loadAsync(`${MODELS}${name}.glb`);
      cache.set(name, p);
    }
    return p;
  };

  interface Place {
    pos: V3;
    rotY?: number;
    height?: number;
    width?: number;
    depth?: number;
  }

  const placed: Promise<void>[] = [];
  const place = (name: string, opts: Place) => {
    placed.push(
      loadModel(name).then((gltf) => {
        const obj = gltf.scene.clone(true);
        obj.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        const b = new THREE.Box3().setFromObject(obj);
        const size = b.getSize(new THREE.Vector3());
        let s = 1;
        if (opts.height) s = opts.height / size.y;
        else if (opts.width) s = opts.width / size.x;
        else if (opts.depth) s = opts.depth / size.z;
        obj.scale.setScalar(s);
        const b2 = new THREE.Box3().setFromObject(obj);
        const c = b2.getCenter(new THREE.Vector3());
        obj.position.set(-c.x, -b2.min.y, -c.z);
        const g = new THREE.Group();
        g.add(obj);
        g.position.set(...opts.pos);
        g.rotation.y = opts.rotY ?? 0;
        scene.add(g);
      }),
    );
  };

  /* ----------------------------------------------------------- monitors */
  const bezelMat = new THREE.MeshStandardMaterial({ color: "#15171c", roughness: 0.35, metalness: 0.3 });
  const standMat = new THREE.MeshStandardMaterial({ color: "#b9bcc4", roughness: 0.3, metalness: 0.85 });
  const screens: THREE.MeshBasicMaterial[] = [];

  const monitor = (tex: THREE.Texture, x: number, y: number, z: number, w = 0.66, h = 0.39, rotY = 0) => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.018, 0.17), standMat);
    base.position.y = 0.009;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.045, h / 2 + 0.14, 0.03), standMat);
    neck.position.set(0, (h / 2 + 0.14) / 2, -0.05);
    const bez = new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, h + 0.03, 0.028), bezelMat);
    bez.position.set(0, h / 2 + 0.16, -0.02);
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
    screens.push(mat);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    scr.position.set(0, h / 2 + 0.16, -0.005);
    [base, neck, bez].forEach((m) => {
      m.castShadow = true;
      m.receiveShadow = true;
    });
    g.add(base, neck, bez, scr);
    g.position.set(x, y, z);
    g.rotation.y = rotY;
    scene.add(g);
    return g;
  };

  const DESK_TOP = 0.74;
  const oakMat = new THREE.MeshStandardMaterial({ color: "#d8c1a0", roughness: 0.55 });
  const edgeMat = new THREE.MeshStandardMaterial({ color: "#c4a982", roughness: 0.5 });
  const steelMat = new THREE.MeshStandardMaterial({ color: "#1e2026", roughness: 0.38, metalness: 0.7 });
  const keyMat = new THREE.MeshStandardMaterial({ color: "#eceef3", roughness: 0.45 });
  const deskGeo = {
    top: new THREE.BoxGeometry(1.6, 0.035, 0.78),
    edge: new THREE.BoxGeometry(1.6, 0.012, 0.78),
    leg: new THREE.BoxGeometry(0.05, DESK_TOP - 0.035, 0.05),
    rail: new THREE.BoxGeometry(0.05, 0.05, 0.66),
    beam: new THREE.BoxGeometry(1.4, 0.05, 0.04),
    kb: new THREE.BoxGeometry(0.42, 0.018, 0.13),
    mouse: new THREE.BoxGeometry(0.06, 0.02, 0.1),
  };
  const desk = (x: number, z: number) => {
    const g = new THREE.Group();
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, px: number, py: number, pz: number) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(px, py, pz);
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
    };
    add(deskGeo.top, oakMat, 0, DESK_TOP - 0.0175, 0);
    add(deskGeo.edge, edgeMat, 0, DESK_TOP - 0.041, 0);
    for (const sx of [-0.74, 0.74]) {
      for (const sz of [-0.33, 0.33]) add(deskGeo.leg, steelMat, sx, (DESK_TOP - 0.035) / 2, sz);
      add(deskGeo.rail, steelMat, sx, 0.025, 0);
      add(deskGeo.rail, steelMat, sx, DESK_TOP - 0.06, 0);
    }
    add(deskGeo.beam, steelMat, 0, DESK_TOP - 0.11, -0.3);
    add(deskGeo.kb, keyMat, -0.05, DESK_TOP + 0.009, 0.14);
    add(deskGeo.mouse, keyMat, 0.26, DESK_TOP + 0.01, 0.15);
    g.position.set(x, 0, z);
    scene.add(g);
    place("mid_century_lounge_chair", { pos: [x - 0.05, 0, z + 0.78], height: 0.92, rotY: Math.PI + 0.25 });
    block(x, z, 1.7, 0.9);
  };

  deskX.forEach((x) => {
    desk(x, deskRow1);
    desk(x, deskRow2);
  });

  // Nova OS: two screens
  monitor(loadTex(`${WORK}novaos-dash.webp`), deskX[0] - 0.36, DESK_TOP, deskRow1 - 0.18, 0.62, 0.39, 0.12);
  monitor(loadTex(`${WORK}novaos-pv.webp`), deskX[0] + 0.36, DESK_TOP, deskRow1 - 0.18, 0.62, 0.39, -0.12);
  monitor(loadTex(`${WORK}nova-market.webp`), deskX[1], DESK_TOP, deskRow1 - 0.18);
  monitor(loadTex(`${WORK}nova-fund.webp`), deskX[2], DESK_TOP, deskRow1 - 0.18);
  monitor(loadTex(`${WORK}atlas.webp`), deskX[0], DESK_TOP, deskRow2 - 0.18, 0.3, 0.62);
  monitor(loadTex(`${WORK}hous-burger.webp`), deskX[1], DESK_TOP, deskRow2 - 0.18);
  monitor(codeTexture(JAVA, "java"), deskX[2] - 0.12, DESK_TOP, deskRow2 - 0.18);
  place("classic_laptop", { pos: [deskX[2] + 0.52, DESK_TOP, deskRow2 + 0.08], width: 0.36, rotY: -0.4 });
  place("desk_lamp_arm_01", { pos: [deskX[0] - 0.68, DESK_TOP, deskRow1 + 0.1], height: 0.5, rotY: 0.6 });
  place("desk_lamp_arm_01", { pos: [deskX[2] - 0.66, DESK_TOP, deskRow2 + 0.05], height: 0.5, rotY: 0.6 });
  place("ceramic_vase_01", { pos: [deskX[1] + 0.6, DESK_TOP, deskRow1 + 0.15], height: 0.2 });

  /* ------------------------------------------------------- tock arcade */
  {
    const g = new THREE.Group();
    const blue = new THREE.MeshPhysicalMaterial({ color: "#2b4bff", roughness: 0.32, clearcoat: 0.6 });
    const dark = new THREE.MeshStandardMaterial({ color: "#11131a", roughness: 0.5 });
    const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.rotation.x = rx;
      m.castShadow = true;
      m.receiveShadow = true;
      g.add(m);
      return m;
    };
    add(new THREE.BoxGeometry(0.78, 1.0, 0.72), blue, 0, 0.5, 0);
    add(new THREE.BoxGeometry(0.78, 0.18, 0.5), dark, 0, 1.04, 0.14, -0.35);
    add(new THREE.BoxGeometry(0.78, 0.82, 0.48), blue, 0, 1.5, -0.12);
    add(new THREE.BoxGeometry(0.66, 0.5, 0.02), dark, 0, 1.5, 0.125, -0.12);
    const scr = new THREE.MeshBasicMaterial({ map: loadTex(`${WORK}tock-baron.webp`), toneMapped: false });
    screens.push(scr);
    add(new THREE.PlaneGeometry(0.6, 0.34), scr, 0, 1.5, 0.137, -0.12);
    const marquee = new THREE.MeshBasicMaterial({
      map: signTexture(
        [
          { text: "TOCK'S", font: "800 150px 'Syne', 'Arial Black', sans-serif", color: "#ffffff", y: 220 },
          { text: "WIND-UP WORKSHOP", font: "700 82px 'Syne', 'Arial Black', sans-serif", color: "#cfd7ff", y: 350 },
        ],
        "#0d1650",
      ),
      toneMapped: false,
    });
    add(new THREE.BoxGeometry(0.8, 0.26, 0.5), blue, 0, 2.05, -0.12);
    add(new THREE.PlaneGeometry(0.74, 0.2), marquee, 0, 2.05, 0.131);
    const red = new THREE.MeshStandardMaterial({ color: "#e23b3b", roughness: 0.3 });
    const yellow = new THREE.MeshStandardMaterial({ color: "#f2c230", roughness: 0.3 });
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.09), dark, -0.18, 1.12, 0.2, -0.35);
    add(new THREE.SphereGeometry(0.03), red, -0.18, 1.17, 0.22);
    [0.05, 0.13, 0.21].forEach((x, i) =>
      add(new THREE.CylinderGeometry(0.025, 0.025, 0.02), i === 1 ? yellow : red, x, 1.1, 0.2, -0.35),
    );
    g.position.set(6.9, 0, -4.8);
    g.rotation.y = -Math.PI / 2;
    scene.add(g);
    block(6.9, -4.8, 0.9, 1.0);
  }

  /* ------------------------------------------------------- server racks */
  const leds: { mat: THREE.MeshStandardMaterial; phase: number; speed: number }[] = [];
  {
    const rackMat = new THREE.MeshStandardMaterial({ color: "#1b1e26", roughness: 0.45, metalness: 0.55 });
    const faceTex = canvasTexture(512, 1024, (ctx) => {
      ctx.fillStyle = "#14161c";
      ctx.fillRect(0, 0, 512, 1024);
      for (let u = 0; u < 22; u++) {
        const y = 30 + u * 44;
        ctx.fillStyle = u % 5 === 0 ? "#2a2e38" : "#22252e";
        ctx.fillRect(28, y, 456, 38);
        ctx.fillStyle = "#0c0d11";
        for (let v = 0; v < 18; v++) ctx.fillRect(150 + v * 17, y + 12, 9, 14);
        ctx.fillStyle = "#3a3f4c";
        ctx.fillRect(40, y + 14, 70, 10);
      }
    });
    const faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5, metalness: 0.4 });
    [-2.05, -1.15].forEach((z, r) => {
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.05, 0.66), rackMat);
      rack.position.set(8.4, 1.025, z);
      rack.castShadow = true;
      rack.receiveShadow = true;
      scene.add(rack);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.9), faceMat);
      face.position.set(7.94, 1.025, z);
      face.rotation.y = -Math.PI / 2;
      scene.add(face);
      for (let u = 0; u < 22; u++) {
        for (let k = 0; k < 2; k++) {
          const mat = new THREE.MeshStandardMaterial({
            color: "#0b1a12",
            emissive: (u + k + r) % 7 === 0 ? "#ffb020" : (u + r) % 3 === 0 ? "#3b6bff" : "#2cff8f",
            emissiveIntensity: 1,
          });
          const led = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.012, 0.012), mat);
          led.position.set(7.935, 0.11 + (21 - u) * 0.0838 + 0.04, z - 0.22 + k * 0.03);
          scene.add(led);
          leds.push({ mat, phase: Math.random() * 6, speed: 1 + Math.random() * 5 });
        }
      }
    });
    block(8.4, -1.6, 1.0, 1.6);
    // wall-mounted terminal with the real manifests
    const term = monitor(codeTexture(YAML, "yaml"), 8.93, 1.0, 0.2, 0.9, 0.53, -Math.PI / 2);
    term.children[0].visible = false;
    term.children[1].visible = false;
  }

  /* ------------------------------------------------------ south wall */
  place("wooden_bookshelf_worn", { pos: [-5.2, 0, 6.62], width: 2.0, rotY: Math.PI });
  place("book_encyclopedia_set_01", { pos: [-5.6, 1.02, 6.55], width: 0.5, rotY: Math.PI });
  place("book_encyclopedia_set_01", { pos: [-4.7, 0.55, 6.55], width: 0.5, rotY: Math.PI });
  block(-5.2, 6.6, 2.2, 0.8);

  const framed = (tex: THREE.Texture, x: number, y: number, w: number, h: number, oak = true) => {
    const fr = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.04),
      new THREE.MeshStandardMaterial({ color: oak ? "#c9a77c" : "#1d2030", roughness: 0.6 }),
    );
    fr.position.set(x, y, ROOM.maxZ - 0.025);
    fr.castShadow = true;
    scene.add(fr);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    pic.position.set(x, y, ROOM.maxZ - 0.048);
    pic.rotation.y = Math.PI;
    scene.add(pic);
  };
  framed(loadTex(`${TEX}portrait.webp`), -1.9, 1.7, 0.72, 0.9);
  framed(
    posterTexture("Education", [
      ["2023", "Baccalauréat Sciences Maths A, Mention Très Bien"],
      ["2023 to 2025", "CPGE MPSI then MP, ranked 237 of 3,000"],
      ["2025", "INPT, Advanced Software Engineering for Digital Services"],
      ["2026", "Second year at INPT (INE2)"],
    ], "#2b4bff"),
    0.4,
    1.7,
    0.75,
    1.0,
    false,
  );
  place("vintage_telephone_wall_clock", { pos: [2.9, 1.15, ROOM.maxZ - 0.18], height: 0.7, rotY: Math.PI });
  {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.5),
      new THREE.MeshBasicMaterial({
        map: signTexture(
          [
            { text: "Contact", font: "800 120px 'Syne', 'Arial Black', sans-serif", color: "#0a0f2c", y: 200 },
            { text: "mehrachhoussam111@gmail.com", font: "500 52px 'Geist', Arial, sans-serif", color: "#2b4bff", y: 330 },
          ],
          "#f7f8fc",
        ),
        toneMapped: false,
      }),
    );
    sign.position.set(2.9, 2.35, ROOM.maxZ - 0.03);
    sign.rotation.y = Math.PI;
    scene.add(sign);
  }

  /* ------------------------------------------------------------ lounge */
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.6),
    new THREE.MeshStandardMaterial({ color: "#dfe4fb", roughness: 1 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(6.6, 0.005, 4.2);
  rug.receiveShadow = true;
  scene.add(rug);
  place("sofa_02", { pos: [8.0, 0, 4.2], width: 2.2, rotY: -Math.PI / 2 });
  place("modern_coffee_table_01", { pos: [6.5, 0, 4.2], width: 1.0 });
  place("modern_arm_chair_01", { pos: [5.2, 0, 3.6], height: 0.85, rotY: Math.PI / 2 + 0.35 });
  place("modern_arm_chair_01", { pos: [5.2, 0, 4.9], height: 0.85, rotY: Math.PI / 2 - 0.35 });
  block(5.2, 4.25, 0.9, 2.0);
  block(8.0, 4.2, 1.2, 2.4);
  block(6.5, 4.2, 1.1, 0.8);

  // plants
  place("potted_plant_02", { pos: [-8.3, 0, -6.2], height: 1.5 });
  place("potted_plant_04", { pos: [8.2, 0, -6.2], height: 1.0 });
  place("potted_plant_02", { pos: [8.3, 0, 6.3], height: 1.4 });
  place("potted_plant_04", { pos: [-8.3, 0, 2.5], height: 1.0 });
  block(-8.3, -6.2, 0.8, 0.8);
  block(8.2, -6.2, 0.8, 0.8);
  block(8.3, 6.3, 0.8, 0.8);
  block(-8.3, 2.5, 0.8, 0.8);

  // ceiling lamps over the desks
  deskX.forEach((x) => {
    [deskRow1, deskRow2].forEach((z) => {
      place("modern_ceiling_lamp_01", { pos: [x, ROOM.h - 0.55, z], height: 0.55 });
    });
  });
  const lampLight = new THREE.PointLight("#fff1dc", 3.2, 6, 2);
  lampLight.position.set(-1.8, 2.6, -0.4);
  scene.add(lampLight);

  /* ------------------------------------------------- stations + labels */
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hits: THREE.Mesh[] = [];
  const labelEls = new Map<string, HTMLElement>();
  const labelOf = new Map(stations.map((s) => [s.id, s.label]));
  for (const st of STATIONS) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...st.hit.size), hitMat);
    m.position.set(...st.hit.center);
    m.userData.id = st.id;
    scene.add(m);
    hits.push(m);
    const el = document.createElement("button");
    el.type = "button";
    el.className = "office-label";
    el.textContent = labelOf.get(st.id) ?? st.id;
    el.tabIndex = -1;
    el.addEventListener("click", () => goTo(st.id));
    labelLayer.appendChild(el);
    labelEls.set(st.id, el);
  }

  /* ------------------------------------------------------------- input */
  const keys = new Set<string>();
  const stick = new THREE.Vector2();
  let hovered: string | null = null;
  let prompt: string | null = null;
  let tween: {
    from: THREE.Vector3;
    to: THREE.Vector3;
    yaw0: number;
    yaw1: number;
    pitch0: number;
    pitch1: number;
    t: number;
    dur: number;
    open: string;
  } | null = null;

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pickAt = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(hits, false)[0];
    return hit && hit.distance < 14 ? (hit.object.userData.id as string) : null;
  };

  function goTo(id: string) {
    const st = STATIONS.find((s) => s.id === id);
    if (!st) return;
    const to = new THREE.Vector3(...st.stand);
    const dir = new THREE.Vector3(...st.anchor).sub(to);
    const yaw1 = Math.atan2(-dir.x, -dir.z);
    const pitch1 = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));
    let dy = yaw1 - state.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    if (reduced) {
      state.pos.copy(to);
      state.yaw += dy;
      state.pitch = pitch1;
      cb.onOpen(id);
      return;
    }
    const dist = state.pos.distanceTo(to);
    tween = {
      from: state.pos.clone(),
      to,
      yaw0: state.yaw,
      yaw1: state.yaw + dy,
      pitch0: state.pitch,
      pitch1,
      t: 0,
      dur: Math.min(1.6, 0.55 + dist * 0.12),
      open: id,
    };
  }

  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  const onPointerDown = (e: PointerEvent) => {
    if (!state.active) return;
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (!state.active) return;
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX;
      lastY = e.clientY;
      const k = e.pointerType === "mouse" ? 0.0042 : 0.006;
      state.yaw -= dx * k;
      state.pitch = THREE.MathUtils.clamp(state.pitch - dy * k, -0.7, 0.55);
      tween = null;
    } else if (e.pointerType === "mouse") {
      hovered = pickAt(e.clientX, e.clientY);
      canvas.style.cursor = hovered ? "pointer" : "grab";
    }
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (moved < 7) {
      const id = pickAt(e.clientX, e.clientY);
      if (id) goTo(id);
    }
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (!state.active) return;
    const k = e.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(k)) {
      keys.add(k);
      if (k.startsWith("arrow")) e.preventDefault();
      tween = null;
    }
    if ((k === "e" || k === "enter") && prompt) {
      e.preventDefault();
      goTo(prompt);
    }
  };
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  /* ------------------------------------------------------------ resize */
  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 700 ? 74 : 62;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  if (canvas.parentElement) ro.observe(canvas.parentElement);
  resize();

  /* -------------------------------------------------------------- loop */
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const R = 0.32;
  const collides = (x: number, z: number) => {
    if (x < ROOM.minX + 0.45 || x > ROOM.maxX - 0.45 || z < ROOM.minZ + 0.45 || z > ROOM.maxZ - 0.45) return true;
    return obstacles.some((b) => x > b.min.x - R && x < b.max.x + R && z > b.min.y - R && z < b.max.y + R);
  };

  const updateLabels = () => {
    const w = labelLayer.clientWidth;
    const h = labelLayer.clientHeight;
    let best: string | null = null;
    let bestD = 2.6;
    camera.getWorldDirection(fwd);
    for (const st of STATIONS) {
      const el = labelEls.get(st.id);
      if (!el) continue;
      tmp.set(...st.anchor);
      const d = tmp.distanceTo(camera.position);
      const toSt = tmp.clone().sub(camera.position).normalize();
      const facing = toSt.dot(fwd);
      tmp.y += 0.45;
      tmp.project(camera);
      const visible = facing > 0.2 && d < 11 && tmp.z < 1;
      if (!visible) {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      } else {
        const x = (tmp.x * 0.5 + 0.5) * w;
        const y = (-tmp.y * 0.5 + 0.5) * h;
        el.style.transform = `translate(-50%, -100%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        el.style.opacity = String(THREE.MathUtils.clamp(1.25 - d / 9, 0.25, 1));
        el.style.pointerEvents = "auto";
      }
      el.classList.toggle("is-hover", hovered === st.id || prompt === st.id);
      const flat = Math.hypot(st.anchor[0] - state.pos.x, st.anchor[2] - state.pos.z);
      if (flat < bestD && facing > 0.45) {
        bestD = flat;
        best = st.id;
      }
    }
    if (best !== prompt) {
      prompt = best;
      cb.onPrompt(prompt);
    }
  };

  const tick = () => {
    if (state.disposed) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (tween) {
      tween.t += dt / tween.dur;
      const e = easeInOut(Math.min(tween.t, 1));
      state.pos.lerpVectors(tween.from, tween.to, e);
      state.yaw = tween.yaw0 + (tween.yaw1 - tween.yaw0) * e;
      state.pitch = tween.pitch0 + (tween.pitch1 - tween.pitch0) * e;
      if (tween.t >= 1) {
        const id = tween.open;
        tween = null;
        cb.onOpen(id);
      }
    } else if (state.active) {
      let mx = stick.x;
      let mz = -stick.y;
      if (keys.has("w") || keys.has("arrowup")) mz -= 1;
      if (keys.has("s") || keys.has("arrowdown")) mz += 1;
      if (keys.has("a")) mx -= 1;
      if (keys.has("d")) mx += 1;
      if (keys.has("arrowleft")) state.yaw += 1.8 * dt;
      if (keys.has("arrowright")) state.yaw -= 1.8 * dt;
      const len = Math.hypot(mx, mz);
      if (len > 0.01) {
        const speed = (keys.has("shift") ? 5.2 : 3.0) * dt * Math.min(len, 1);
        fwd.set(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
        right.set(Math.cos(state.yaw), 0, -Math.sin(state.yaw));
        const vx = ((fwd.x * -mz + right.x * mx) / len) * speed;
        const vz = ((fwd.z * -mz + right.z * mx) / len) * speed;
        if (!collides(state.pos.x + vx, state.pos.z)) state.pos.x += vx;
        if (!collides(state.pos.x, state.pos.z + vz)) state.pos.z += vz;
      }
    }

    const bob = state.active && !tween && (keys.size > 0 || stick.lengthSq() > 0.01) && !reduced ? Math.sin(t * 9) * 0.012 : 0;
    camera.position.set(state.pos.x, state.pos.y + bob, state.pos.z);
    camera.rotation.set(state.pitch, state.yaw, 0);

    for (const l of leds) l.mat.emissiveIntensity = Math.sin(t * l.speed + l.phase) > 0.2 ? 2.2 : 0.25;

    updateLabels();
    renderer.render(scene, camera);
  };

  Promise.all(placed)
    .catch(() => undefined)
    .then(() => {
      // the shadow map only needs to follow the static scene once
      renderer.shadowMap.autoUpdate = false;
      renderer.shadowMap.needsUpdate = true;
      cb.onProgress(1);
      cb.onReady();
    });

  renderer.setAnimationLoop(tick);

  return {
    setActive(active) {
      state.active = active;
      if (!active) keys.clear();
      renderer.setAnimationLoop(active || tween ? tick : null);
      if (!active) tick();
    },
    goTo,
    setStick(x, y) {
      stick.set(x, y);
    },
    dispose() {
      state.disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      labelEls.forEach((el) => el.remove());
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => {
            Object.values(mat).forEach((v) => {
              if (v instanceof THREE.Texture) v.dispose();
            });
            mat.dispose();
          });
        }
      });
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

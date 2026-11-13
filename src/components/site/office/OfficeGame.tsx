import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { items } from "../data";
import type { OfficeHandle } from "./engine";

const labelOf = (id: string | null) => items.find((i) => i.id === id)?.label ?? "";

export function OfficeGame({ onOpen, paused }: { onOpen: (id: string) => void; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<OfficeHandle | null>(null);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [touch, setTouch] = useState(false);

  useEffect(() => {
    setTouch(window.matchMedia("(pointer: coarse)").matches);
    let cancelled = false;
    const canvas = canvasRef.current;
    const layer = layerRef.current;
    if (!canvas || !layer) return;
    import("./engine")
      .then(({ createOffice }) => {
        if (cancelled) return;
        handleRef.current = createOffice(
          canvas,
          layer,
          items.map((i) => ({ id: i.id, label: i.label })),
          {
            onProgress: (r) => setProgress(r),
            onReady: () => setReady(true),
            onOpen: (id) => openRef.current(id),
            onPrompt: (id) => setPrompt(id),
          },
        );
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  useEffect(() => {
    handleRef.current?.setActive(started && !paused);
  }, [started, paused, ready]);

  const enter = () => {
    setStarted(true);
    canvasRef.current?.focus({ preventScroll: true });
  };

  /* on-screen joystick for touch screens */
  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const onStick = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = stickRef.current;
    if (!el) return;
    if (e.type === "pointerdown") el.setPointerCapture(e.pointerId);
    if (e.type === "pointerup" || e.type === "pointercancel") {
      handleRef.current?.setStick(0, 0);
      if (knobRef.current) knobRef.current.style.transform = "";
      return;
    }
    if (e.type === "pointermove" && !(e.buttons & 1)) return;
    const r = el.getBoundingClientRect();
    let x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    let y = -(e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    handleRef.current?.setStick(x, y);
    if (knobRef.current) knobRef.current.style.transform = `translate(${x * 34}px, ${-y * 34}px)`;
  };

  return (
    <section aria-label="Walk through Houssame's office" className="office" id="office">
      <canvas aria-hidden="true" className="office__canvas" ref={canvasRef} tabIndex={-1} />
      <div className="office__labels" ref={layerRef} />

      {started ? (
        <>
          <div className="office__dock" role="group" aria-label="Go to">
            {items.map((i) => (
              <button
                className="dock-item"
                key={i.id}
                onClick={() => handleRef.current?.goTo(i.id)}
                title={i.label}
                type="button"
              >
                <img alt="" src={i.object} />
                <span className="sr-only">Go to {i.label}</span>
              </button>
            ))}
          </div>
          {prompt ? (
            <button className="office__prompt" onClick={() => handleRef.current?.goTo(prompt)} type="button">
              {touch ? "Tap" : "Press E"} to open <strong>{labelOf(prompt)}</strong>
            </button>
          ) : (
            <p className="office__hint">
              {touch ? "Drag to look, use the stick to walk, tap anything to open it." : "WASD to walk, drag to look, click anything to open it."}
            </p>
          )}
          {touch ? (
            <div
              aria-hidden="true"
              className="stick"
              onPointerCancel={onStick}
              onPointerDown={onStick}
              onPointerMove={onStick}
              onPointerUp={onStick}
              ref={stickRef}
            >
              <span ref={knobRef} />
            </div>
          ) : null}
        </>
      ) : (
        <div className="office__intro">
          <div className="office__card">
            <p className="office__kicker">Portfolio of</p>
            <h1 className="office__title">Houssame Mehrach</h1>
            <p className="office__lede">
              Software engineering student at INPT Rabat. This is my office: every desk, screen and shelf is a project. Walk in and open anything.
            </p>
            <div className="office__actions">
              <button className="btn-enter" disabled={!ready} onClick={enter} type="button">
                {ready ? "Enter the office" : failed ? "3D isn't available here" : `Loading ${Math.round(progress * 100)}%`}
              </button>
              <a className="btn-line" href="#index">
                See the list instead
              </a>
            </div>
            <div aria-hidden="true" className="office__bar">
              <span style={{ transform: `scaleX(${ready ? 1 : progress})` }} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

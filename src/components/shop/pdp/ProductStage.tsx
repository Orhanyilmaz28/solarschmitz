"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Product } from "@/lib/catalog/types";
import { hotspotsFor, type Hotspot } from "@/lib/catalog/facts";
import { Icon } from "@/components/ui/Icon";
import { ProductSchematic, getSchematicAnchors } from "../ProductSchematic";
import { SchematicCaption } from "../ProductMedia";
import { DataStatusChip } from "../DataStatus";

const ease = "transform 1.1s var(--ease-out-expo)";

/** Punkte, die zu dicht beieinander liegen, entfallen (der wichtigere bleibt). Abstand im 4:3-Format gemessen. */
function spaced(spots: Hotspot[], anchors: Partial<Record<Hotspot["anchor"], { left: number; top: number }>>): Hotspot[] {
  const kept: Hotspot[] = [];
  for (const s of spots) {
    const a = anchors[s.anchor];
    if (!a) continue;
    const near = kept.some((k) => {
      const b = anchors[k.anchor]!;
      return Math.hypot((a.left - b.left) * 4, (a.top - b.top) * 3) < 40;
    });
    if (!near) kept.push(s);
  }
  return kept;
}

/** Ebene, die der Maus leicht folgt (Tiefe in px, Neigung in Grad) */
function layer(depth: number, tilt = 0): CSSProperties {
  const rot = tilt ? ` rotateX(calc(var(--py, 0) * ${-tilt}deg)) rotateY(calc(var(--px, 0) * ${tilt}deg))` : "";
  return { transform: `translate3d(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth * 0.8}px), 0)${rot}`, transition: ease };
}

/**
 * Produktbühne: echtes Foto (mit Zoom), sonst die beschriftete Schemazeichnung
 * mit Hotspots aus den Produktdaten. Leichte Maus-Parallaxe nur bei feinem Zeiger.
 */
export function ProductStage({ product }: { product: Product }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Hotspot["anchor"] | null>(null);
  const [pinned, setPinned] = useState(false);
  const hasImages = product.images.length > 0;
  const anchors = getSchematicAnchors(product.visual);
  const spots = hasImages ? [] : spaced(hotspotsFor(product).filter((h) => anchors[h.anchor]), anchors);
  const activeSpot = spots.find((s) => s.anchor === active);
  const activeIndex = activeSpot ? spots.indexOf(activeSpot) : -1;

  // Variante gewechselt: offene Hinweise schließen
  useEffect(() => {
    setActive(null);
    setPinned(false);
  }, [product.id]);

  // Maus-Parallaxe über CSS-Variablen
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches || document.documentElement.dataset.motion !== "on") return;
    let raf = 0;
    let nx = 0;
    let ny = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--px", nx.toFixed(3));
      el.style.setProperty("--py", ny.toFixed(3));
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const r = el.getBoundingClientRect();
      nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      nx = 0;
      ny = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [hasImages]);

  // Escape und Klick außerhalb schließen den Hinweis
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
        setPinned(false);
      }
    };
    const onDown = (e: PointerEvent) => {
      if (stageRef.current && !stageRef.current.contains(e.target as Node)) {
        setActive(null);
        setPinned(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [active]);

  if (hasImages) return <ImageStage product={product} />;

  return (
    <div
      ref={stageRef}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-media)] bg-stone"
      style={{ perspective: "1400px" }}
    >
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_62%_at_30%_22%,rgb(255_255_255/0.95),transparent_72%)]" />
      <div
        aria-hidden
        className="absolute inset-[-3%] [background-image:radial-gradient(rgb(16_24_32/0.14)_0.8px,transparent_0.9px)] [background-size:18px_18px]"
        style={layer(-5)}
      />
      <div className="absolute inset-0" style={layer(12, 2.5)}>
        <ProductSchematic visual={product.visual} title={product.name} label="none" grid={false} className="h-full w-full" />
        {spots.map((s, i) => {
          const pos = anchors[s.anchor]!;
          const open = active === s.anchor;
          return (
            <HotspotPin
              key={s.anchor}
              spot={s}
              index={i}
              left={pos.left}
              top={pos.top}
              open={open}
              onEnter={() => setActive(s.anchor)}
              onLeave={() => {
                if (!pinned) setActive(null);
              }}
              onToggle={() => {
                if (open && pinned) {
                  setActive(null);
                  setPinned(false);
                } else {
                  setActive(s.anchor);
                  setPinned(true);
                }
              }}
            />
          );
        })}
      </div>

      <div className="absolute left-4 top-4 z-[3] md:left-5 md:top-5">
        <DataStatusChip product={product} />
      </div>
      <SchematicCaption label="full" className={activeSpot ? "max-md:opacity-0" : ""} />
      {spots.length > 0 && (
        <p aria-hidden className="pointer-events-none absolute bottom-3.5 right-4 z-[1] hidden font-mono text-[10px] uppercase leading-none tracking-[0.14em] text-muted sm:block md:right-5">
          {spots.length} Details
        </p>
      )}

      {/* Kleine Bildschirme: Hinweis als Leiste unten statt Sprechblase */}
      {activeSpot && (
        <div className="absolute inset-x-3 bottom-3 z-[4] flex items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-paper shadow-[var(--shadow-lift)] md:hidden">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sun-1">
              {String(activeIndex + 1).padStart(2, "0")} · {activeSpot.title}
            </p>
            <p className="mt-1 text-[14px] leading-snug">{activeSpot.text}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActive(null);
              setPinned(false);
            }}
            aria-label="Hinweis schließen"
            className="-mr-1 -mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-paper/10"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function HotspotPin({
  spot,
  index,
  left,
  top,
  open,
  onEnter,
  onLeave,
  onToggle,
}: {
  spot: Hotspot;
  index: number;
  left: number;
  top: number;
  open: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onToggle: () => void;
}) {
  const toLeft = left > 56;
  const vertical = top < 22 ? "top-0" : top > 70 ? "bottom-0" : "top-1/2 -translate-y-1/2";
  return (
    <div className="absolute z-[2]" style={{ left: `${left}%`, top: `${top}%` }}>
      <button
        type="button"
        onClick={onToggle}
        onPointerEnter={(e) => e.pointerType === "mouse" && onEnter()}
        onPointerLeave={(e) => e.pointerType === "mouse" && onLeave()}
        onFocus={onEnter}
        onBlur={onLeave}
        className="group/pin relative -ml-[15px] -mt-[15px] grid h-[30px] w-[30px] place-items-center rounded-full md:-ml-[18px] md:-mt-[18px] md:h-9 md:w-9"
      >
        <span
          aria-hidden
          className={`absolute inset-0 rounded-full bg-white/95 shadow-[0_8px_18px_-8px_rgb(16_24_32/0.45)] ring-1 transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover/pin:scale-110 ${
            open ? "scale-110 ring-ink" : "ring-ink/15"
          }`}
        />
        <span aria-hidden className="relative h-2 w-2 rounded-full" style={{ background: "var(--sun-gradient)" }} />
        <span className="sr-only">
          Detail {index + 1}: {spot.title}. {spot.text}
        </span>
      </button>
      <div
        aria-hidden
        className={`pointer-events-none absolute hidden w-[min(250px,40vw)] rounded-2xl bg-ink px-4 py-3 text-paper shadow-[var(--shadow-lift)] transition-[opacity,transform] duration-300 ease-[var(--ease-out-expo)] md:block ${vertical} ${
          toLeft ? "right-[calc(100%+12px)]" : "left-[calc(100%+12px)]"
        } ${open ? "opacity-100" : "translate-y-1 opacity-0"}`}
        style={{ visibility: open ? "visible" : "hidden" }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-sun-1">
          {String(index + 1).padStart(2, "0")} · {spot.title}
        </p>
        <p className="mt-1 text-[14px] leading-snug">{spot.text}</p>
      </div>
    </div>
  );
}

/** Echte Produktfotos mit Vorschaubildern und Zoom (nur wenn Fotos vorliegen) */
function ImageStage({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const img = product.images[index] ?? product.images[0]!;

  useEffect(() => setIndex(0), [product.id]);
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (zoom && !d.open) d.showModal();
    if (!zoom && d.open) d.close();
  }, [zoom]);

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-media)] bg-stone">
        <Image src={img.src} alt={img.alt} fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-contain p-[6%]" />
        <div className="absolute left-4 top-4 z-[2] md:left-5 md:top-5">
          <DataStatusChip product={product} />
        </div>
        <button
          type="button"
          onClick={() => setZoom(true)}
          className="absolute bottom-4 right-4 z-[2] inline-flex h-10 items-center gap-2 rounded-full bg-paper/90 px-4 text-[13px] font-semibold shadow-[0_0_0_1px_rgb(16_24_32/0.08)] backdrop-blur hover:bg-ink hover:text-paper"
        >
          <Icon name="search" size={15} />
          Vergrößern
        </button>
        {img.credit && <p className="absolute bottom-4 left-5 z-[2] text-[11px] text-muted">Foto: {img.credit}</p>}
      </div>
      {product.images.length > 1 && (
        <ul className="mt-3 flex gap-2" aria-label="Weitere Bilder">
          {product.images.map((im, i) => (
            <li key={im.src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Bild ${i + 1} anzeigen`}
                aria-current={i === index ? "true" : undefined}
                className={`relative block h-16 w-20 overflow-hidden rounded-xl bg-stone ring-1 transition ${i === index ? "ring-ink" : "ring-transparent hover:ring-ink/30"}`}
              >
                <Image src={im.src} alt="" fill sizes="80px" className="object-contain p-1.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <dialog
        ref={dialogRef}
        onClose={() => setZoom(false)}
        onClick={(e) => e.target === e.currentTarget && setZoom(false)}
        aria-label={img.alt}
        className="m-auto h-[min(90svh,900px)] w-[min(94vw,1200px)] max-w-none rounded-[var(--radius-media)] border-0 bg-paper p-0 backdrop:bg-night/70"
      >
        <div className="relative h-full w-full">
          <Image src={img.src} alt={img.alt} fill sizes="94vw" className="object-contain p-6" />
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Schließen"
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-ink text-paper hover:bg-ink-3"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </dialog>
    </div>
  );
}

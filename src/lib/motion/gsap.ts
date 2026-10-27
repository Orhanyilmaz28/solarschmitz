import type { gsap as GsapType } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";

/**
 * GSAP und ScrollTrigger werden erst nach dem ersten Rendern nachgeladen.
 * So gehören sie nicht zum JavaScript, das vor dem ersten sichtbaren Bild ankommen muss.
 */
export type GsapModules = { gsap: typeof GsapType; ScrollTrigger: typeof ScrollTriggerType };

let mods: GsapModules | null = null;
let pending: Promise<GsapModules> | null = null;

export function loadGsap(): Promise<GsapModules> {
  if (mods) return Promise.resolve(mods);
  if (!pending) {
    pending = Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([g, s]) => {
      g.gsap.registerPlugin(s.ScrollTrigger);
      mods = { gsap: g.gsap, ScrollTrigger: s.ScrollTrigger };
      return mods;
    });
  }
  return pending;
}

/** Bereits geladene Module (oder null) */
export function gsapIfLoaded(): GsapModules | null {
  return mods;
}

/**
 * Führt `setup` aus, sobald GSAP geladen ist. Gibt eine Aufräumfunktion für useEffect zurück,
 * die auch greift, wenn die Komponente vor dem Laden schon wieder verschwindet.
 */
export function withGsap(setup: (m: GsapModules) => void | (() => void)): () => void {
  let cancelled = false;
  let cleanup: void | (() => void);
  loadGsap().then((m) => {
    if (!cancelled) cleanup = setup(m);
  });
  return () => {
    cancelled = true;
    if (typeof cleanup === "function") cleanup();
  };
}

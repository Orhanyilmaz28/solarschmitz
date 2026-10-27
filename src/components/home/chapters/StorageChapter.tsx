import Link from "next/link";
import { exampleConfig, SEASONS, simulateDay, type DayResult } from "@/lib/energy-sim";
import { getProductById } from "@/lib/catalog";
import { ButtonLink } from "@/components/ui/Button";
import { renderStorageArt } from "./storageArt";
import { fmtClock, fmtKWh, fmtPct, visualsAt, type StageData, type StageSeries } from "./storageModel";
import { StorageStage, type Beat } from "./StorageStage";

/**
 * Kapitel 3 – Speicher und Energiefluss.
 * Ein durchschnittlicher Junitag aus der Beispielsimulation (880 Wp, 1,6 kWh Speicher,
 * 2.500 kWh Jahresverbrauch), beim Scrollen von 10 Uhr bis 10 Uhr am nächsten Morgen.
 * Alle Zahlen stammen aus src/lib/energy-sim und sind als Beispielrechnung gekennzeichnet.
 */
const STEP_MIN = 15;
/** Uhrzeit für den Ausgangszustand und die Darstellung ohne Bewegung: Abend, Speicher gibt ab */
const EVENING_MIN = 18 * 60 + 30;

function downsample(day: DayResult): StageSeries {
  const per = Math.max(1, Math.round(STEP_MIN / day.stepMinutes));
  const out: StageSeries = { pv: [], load: [], direct: [], charge: [], discharge: [], imp: [], exp: [], soc: [] };
  for (let i = 0; i < day.steps.length; i += per) {
    const chunk = day.steps.slice(i, i + per);
    const avg = (pick: (s: (typeof chunk)[number]) => number) => chunk.reduce((a, s) => a + pick(s), 0) / chunk.length;
    out.pv.push(Math.round(avg((s) => s.pvW)));
    out.load.push(Math.round(avg((s) => s.loadW)));
    out.direct.push(Math.round(avg((s) => s.directW)));
    out.charge.push(Math.round(avg((s) => s.chargeW)));
    out.discharge.push(Math.round(avg((s) => s.dischargeW)));
    out.imp.push(Math.round(avg((s) => s.importW)));
    out.exp.push(Math.round(avg((s) => s.exportW)));
    out.soc.push(Math.round(avg((s) => s.socPct ?? 0) * 10) / 10);
  }
  return out;
}

export function StorageChapter({ id = "kapitel-speicher", label = "Kapitel 3" }: { id?: string; label?: string }) {
  const month = SEASONS.sommer.monthIndex;
  const withStorage = simulateDay(month, exampleConfig);
  const withoutStorage = simulateDay(month, { ...exampleConfig, storage: null });
  const storage = exampleConfig.storage!;

  const series = downsample(withStorage);
  const data: StageData = {
    stepMin: STEP_MIN,
    series,
    sunrise: withStorage.sunrise * 60,
    sunset: withStorage.sunset * 60,
    minSoc: storage.minSocPct,
    pvMax: Math.max(...series.pv),
    // 10 Uhr → 17 Uhr → (Abend langsamer) 20:15 → (Nacht schneller) 5:30 → 10 Uhr
    timeline: [
      [0, 600],
      [0.36, 1020],
      [0.7, 1215],
      [0.86, 1770],
      [1, 2040],
    ],
    beatRanges: [
      [0, 0.36],
      [0.36, 0.7],
      [0.7, 1],
    ],
  };

  // Kennzahlen für die Texte, alle aus der Simulation
  const steps = withStorage.steps;
  const dtH = withStorage.stepMinutes / 60;
  const charged = withStorage.totals.chargeKWh;
  const peakSoc = Math.max(...steps.map((s) => s.socPct ?? 0));
  const eveningKWh = steps.filter((s) => s.minute >= 16 * 60).reduce((a, s) => a + (s.dischargeW * dtH) / 1000, 0);
  const emptyStep = steps.find((s) => s.minute >= 16 * 60 && s.dischargeW < 1 && (s.socPct ?? 100) <= storage.minSocPct + 0.5);
  const emptyAt = emptyStep ? fmtClock(emptyStep.minute) : null;
  const autarkyWith = withStorage.totals.autarkyRate * 100;
  const autarkyWithout = withoutStorage.totals.autarkyRate * 100;

  const beats: Beat[] = [
    {
      kicker: "10 bis 17 Uhr · Mittag",
      title: "Überschuss lädt den Speicher.",
      body: `Mittags liefern die Module mehr, als dein Haushalt gerade braucht. Ohne Speicher ginge dieser Überschuss ins Netz. Mit Speicher bleibt er im Haus – an diesem Beispieltag ${fmtKWh(charged)}.`,
      facts: [
        { text: `${fmtKWh(charged)} geladen`, tone: "sun" },
        { text: `Ladestand bis ${fmtPct(peakSoc)}`, tone: "lime" },
      ],
    },
    {
      kicker: "17 bis 20 Uhr · Abend",
      title: "Abends gibt er zurück.",
      body: `Die Sonne sinkt, Herd, Licht und Fernseher laufen. Jetzt übernimmt der Speicher und liefert ${emptyAt ? `bis etwa ${emptyAt} Uhr ` : ""}${fmtKWh(eveningKWh)}, die du sonst aus dem Netz beziehen würdest.`,
      facts: [
        { text: `${fmtKWh(eveningKWh)} aus dem Speicher`, tone: "lime" },
        ...(emptyAt ? [{ text: `bis ${emptyAt} Uhr`, tone: "mist" as const }] : []),
      ],
    },
    {
      kicker: "Nacht und Morgen",
      title: "Morgens ist er leer – und die Sonne füllt ihn wieder.",
      body: `Nachts deckt das Netz die Grundlast, der Speicher hält seine Reserve von ${fmtPct(storage.minSocPct)}. Über den ganzen Tag gerechnet deckst du so ${fmtPct(autarkyWith)} deines Verbrauchs selbst – ohne Speicher wären es ${fmtPct(autarkyWithout)}.`,
      facts: [{ text: `Selbst gedeckt: ${fmtPct(autarkyWith)} statt ${fmtPct(autarkyWithout)}`, tone: "sun" }],
    },
  ];

  const initial = visualsAt(data, EVENING_MIN);
  const { art, anchors } = renderStorageArt(initial);
  const product = getProductById("p-anker-sb2-e1600ac");
  const footnote = `Beispielrechnung: durchschnittlicher Junitag, ${new Intl.NumberFormat("de-DE").format(exampleConfig.peakWp)} Wp, ${new Intl.NumberFormat("de-DE").format(storage.capacityKWh)} kWh Speicher, ${new Intl.NumberFormat("de-DE").format(exampleConfig.householdKWhPerYear)} kWh Jahresverbrauch. Keine Messwerte.`;

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="on-dark relative isolate scroll-mt-20 bg-night text-paper">
      <StorageStage id={id} label={label} art={art} anchors={anchors} data={data} beats={beats} initial={initial} initialBeat={1} footnote={footnote} />

      <div className="container-x relative pb-[var(--space-section)]">
        <div className="flex flex-col gap-6 border-t border-ink-line pt-8 md:flex-row md:items-center md:justify-between md:gap-10">
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-paper/70">
            {product ? (
              <>
                Zum Beispiel die{" "}
                <Link href={`/produkt/${product.slug}`} className="font-semibold text-paper underline decoration-paper/30 underline-offset-4 hover:decoration-paper">
                  Anker SOLIX Solarbank 2 E1600 AC
                </Link>{" "}
                mit 1,6 kWh (Angabe des Lieferanten).
              </>
            ) : (
              "Speicher gibt es in verschiedenen Größen, passend zu deinem Verbrauch."
            )}
          </p>
          <ButtonLink href="/kategorie/batteriespeicher" variant="outline-light" arrow className="shrink-0 self-start md:self-auto">
            Alle Speicher
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { DebugState } from "@/lib/types";

const EMPTY: DebugState = {
  enabled: false,
  overrides: {
    hasData: true,
    skatingAllowed: true,
    warnings: false,
    statusOverride: "ready",
    seasonOverride: "auto",
    measurementDate: null,
    thicknessRange: null,
    detailsCzLines: [],
  },
};

export default function DebugPage() {
  const [state, setState] = useState<DebugState>(EMPTY);
  const [available, setAvailable] = useState(true);
  const [initial, setInitial] = useState<DebugState | null>(null);

  useEffect(() => {
    const load = async () => {
      const debugRes = await fetch("/api/debug");
      if (!debugRes.ok) {
        setAvailable(false);
        return;
      }
      const debugJson = await debugRes.json();

      const next = debugJson as DebugState;
      setState(next);
      setInitial(next);
    };
    load();
  }, []);

  if (!available) {
    return (
      <div style={{ padding: 32, fontFamily: "Helvetica, Arial, sans-serif" }}>
        Debug mode is disabled. Start the server with DEBUG_MODE=1.
      </div>
    );
  }

  const isDirty = useMemo(() => {
    if (!initial) return false;
    return JSON.stringify(state) !== JSON.stringify(initial);
  }, [state, initial]);
  const detailsText = state.overrides.detailsCzLines.join("\n");

  const inputClass =
    "mt-2 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/30";
  const labelClass = "text-xs uppercase tracking-[0.2em] text-slate-400";
  const buttonClass =
    "rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/60 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40";
  const statusExamples = {
    ready: {
      measurementDate: "26. 1. 2026",
      thicknessRange: "12-15",
      detailsCzLines: [
        "Data z měření ledu městskou policií dne: 26. 1. 2026",
        "Tloušťka ledu: 12-15 cm",
        "přístav Bystrc: 13 cm",
        "Kozí horka: 12 cm",
        "Sokol: 14 cm",
      ],
    },
    caution: {
      measurementDate: "26. 1. 2026",
      thicknessRange: "10-11",
      detailsCzLines: [
        "Data z měření ledu městskou policií dne: 26. 1. 2026",
        "Tloušťka ledu: 10-11 cm",
        "Pozor: led je na hraně bezpečnosti. Vstup jen na vlastní nebezpečí.",
      ],
    },
    not_ready: {
      measurementDate: "26. 1. 2026",
      thicknessRange: "6-8",
      detailsCzLines: [
        "Data z měření ledu městskou policií dne: 26. 1. 2026",
        "Tloušťka ledu: 6-8 cm",
        "Led je příliš tenký, vstup se nedoporučuje.",
      ],
    },
    off_season_spring: {
      measurementDate: null,
      thicknessRange: null,
      detailsCzLines: [
        "Data z měření ledu městskou policií dne: —",
        "Tloušťka ledu: —",
        "Mimo sezonu (jaro). Měření se neprovádí.",
      ],
    },
    off_season_summer: {
      measurementDate: null,
      thicknessRange: null,
      detailsCzLines: [
        "Data z měření ledu městskou policií dne: —",
        "Tloušťka ledu: —",
        "Mimo sezonu (léto). Měření se neprovádí.",
      ],
    },
    off_season_autumn: {
      measurementDate: null,
      thicknessRange: null,
      detailsCzLines: [
        "Data z měření ledu městskou policií dne: —",
        "Tloušťka ledu: —",
        "Mimo sezonu (podzim). Měření se neprovádí.",
      ],
    },
    no_data: {
      measurementDate: null,
      thicknessRange: null,
      detailsCzLines: [
        "Data z měření ledu městskou policií dne: —",
        "Tloušťka ledu: —",
        "Data nejsou momentálně dostupná.",
      ],
    },
    unknown_thickness: {
      measurementDate: "1. 2. 2026",
      thicknessRange: null,
      detailsCzLines: [
        "Data z měření ledu městskou policií dne: 1. 2. 2026",
        "Tloušťka ledu: ? cm",
        "Podrobnější info: Na webu je tloušťka uvedena jen jako otazník.",
      ],
    },
  } as const;

  type DebugPatch = Omit<Partial<DebugState>, "overrides"> & {
    overrides?: Partial<DebugState["overrides"]>;
  };

  const update = (patch: DebugPatch) => {
    setState((prev) => ({
      ...prev,
      ...patch,
      overrides: { ...prev.overrides, ...(patch.overrides || {}) },
    }));
  };

  type StatusSelection =
    | DebugState["overrides"]["statusOverride"]
    | "off_season_spring"
    | "off_season_summer"
    | "off_season_autumn";

  const resolveStatusSelection = (): StatusSelection => {
    if (state.overrides.statusOverride !== "off_season") return state.overrides.statusOverride;
    if (state.overrides.seasonOverride === "summer") return "off_season_summer";
    if (state.overrides.seasonOverride === "autumn") return "off_season_autumn";
    return "off_season_spring";
  };

  const isOffSeasonSelection = (
    value: StatusSelection
  ): value is "off_season_spring" | "off_season_summer" | "off_season_autumn" => value.startsWith("off_season_");

  const setStatusOverride = (value: StatusSelection) => {
    const isOffSeasonVariant = isOffSeasonSelection(value);
    const statusOverride: DebugState["overrides"]["statusOverride"] = isOffSeasonVariant ? "off_season" : value;
    const seasonOverride = isOffSeasonVariant
      ? (value.replace("off_season_", "") as DebugState["overrides"]["seasonOverride"])
      : "auto";

    const overrides: Partial<DebugState["overrides"]> = {
      statusOverride,
      seasonOverride,
      hasData: statusOverride !== "off_season" && statusOverride !== "no_data",
      skatingAllowed: statusOverride === "ready" || statusOverride === "caution",
      warnings: statusOverride === "caution",
    };

    if (value in statusExamples) {
      const example = statusExamples[value as keyof typeof statusExamples];
      overrides.measurementDate = example.measurementDate;
      overrides.thicknessRange = example.thicknessRange;
      overrides.detailsCzLines = [...example.detailsCzLines];
    }
    update({ overrides });
  };

  const apply = async () => {
    const res = await fetch("/api/debug", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (res.ok) setInitial(state);
  };

  const reset = async () => {
    const res = await fetch("/api/debug/reset", { method: "POST" });
    if (res.ok) {
      const json = await res.json();
      const next = (json.debugState || EMPTY) as DebugState;
      setState(next);
      setInitial(next);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Debug Dashboard</h1>
          <p className="text-sm text-slate-400">Override the live scraper with mock data and force UI states.</p>
        </header>

        <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Debug mode</label>
            <select
              className={inputClass}
              value={String(state.enabled)}
              onChange={(e) => update({ enabled: e.target.value === "true" })}
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Status override</label>
            <select
              className={inputClass}
              value={resolveStatusSelection()}
              onChange={(e) => setStatusOverride(e.target.value as StatusSelection)}
            >
              {state.overrides.statusOverride === "auto" ? (
                <option value="auto">Auto (from data)</option>
              ) : null}
              <option value="ready">Ready (green)</option>
              <option value="caution">Warning / Risky (yellow)</option>
              <option value="not_ready">Not Ready (red)</option>
              <option value="off_season_spring">Off season (spring)</option>
              <option value="off_season_summer">Off season (summer)</option>
              <option value="off_season_autumn">Off season (autumn)</option>
              <option value="unknown_thickness">No data (unknown thickness)</option>
              <option value="no_data">No data</option>
            </select>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Measurement date (free text)</label>
            <input
              className={inputClass}
              value={state.overrides.measurementDate || ""}
              onChange={(e) => update({ overrides: { measurementDate: e.target.value } })}
              placeholder="15. 1. 2026"
            />
          </div>
          <div>
            <label className={labelClass}>Thickness range (cm)</label>
            <input
              className={inputClass}
              value={state.overrides.thicknessRange || ""}
              onChange={(e) => update({ overrides: { thicknessRange: e.target.value } })}
              placeholder="12-15"
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <label className={labelClass}>Details (Czech, one line per row)</label>
          <textarea
            className={`${inputClass} min-h-[180px]`}
            value={detailsText}
            onChange={(e) =>
              update({
                overrides: { detailsCzLines: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean) },
              })
            }
          />
        </section>

        <section className="flex flex-wrap gap-3">
          <button className={buttonClass} onClick={apply} disabled={!isDirty}>
            Apply overrides
          </button>
          <button className={buttonClass} onClick={reset}>
            Reset
          </button>
          <button className={buttonClass} onClick={() => window.open("/", "_blank")}>
            Open status page
          </button>
        </section>
        <p className="text-xs text-slate-500">Requires DEBUG_MODE=1.</p>
      </div>
    </div>
  );
}

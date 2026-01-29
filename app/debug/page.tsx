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

  const update = (patch: Partial<DebugState>) => {
    setState((prev) => ({
      ...prev,
      ...patch,
      overrides: { ...prev.overrides, ...(patch.overrides || {}) },
    }));
  };

  const setStatusOverride = (value: DebugState["overrides"]["statusOverride"]) => {
    const overrides: Partial<DebugState["overrides"]> = {
      statusOverride: value,
      hasData: value !== "off_season" && value !== "no_data",
      skatingAllowed: value === "ready" || value === "caution",
      warnings: value === "caution",
    };
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
              value={state.overrides.statusOverride}
              onChange={(e) => setStatusOverride(e.target.value as DebugState["overrides"]["statusOverride"])}
            >
              {state.overrides.statusOverride === "auto" ? (
                <option value="auto">Auto (from data)</option>
              ) : null}
              <option value="ready">Ready (green)</option>
              <option value="caution">Warning / Risky (yellow)</option>
              <option value="not_ready">Not allowed (red)</option>
              <option value="off_season">Off season (neutral)</option>
              <option value="no_data">No data / Error</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Season override</label>
            <select
              className={inputClass}
              value={state.overrides.seasonOverride}
              onChange={(e) => update({ overrides: { seasonOverride: e.target.value as DebugState["overrides"]["seasonOverride"] } })}
            >
              <option value="auto">Auto (current season)</option>
              <option value="winter">Winter</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="autumn">Autumn</option>
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

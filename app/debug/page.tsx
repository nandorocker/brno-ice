"use client";

import { useEffect, useMemo, useState } from "react";
import type { DebugState, StatusData } from "@/lib/types";

const EMPTY: DebugState = {
  enabled: false,
  overrides: {
    hasData: true,
    skatingAllowed: true,
    warnings: false,
    statusOverride: "ready",
    measurementDate: null,
    thicknessRange: null,
    detailsCzLines: [],
  },
};

export default function DebugPage() {
  const [state, setState] = useState<DebugState>(EMPTY);
  const [available, setAvailable] = useState(true);
  const [initial, setInitial] = useState<DebugState | null>(null);
  const [liveStatus, setLiveStatus] = useState<StatusData | null>(null);

  useEffect(() => {
    const load = async () => {
      const debugRes = await fetch("/api/debug");
      if (!debugRes.ok) {
        setAvailable(false);
        return;
      }
      const debugJson = await debugRes.json();

      let statusJson: StatusData | null = null;
      const statusRes = await fetch("/api/status", { cache: "no-store" }).catch(() => null);
      if (statusRes && statusRes.ok) {
        statusJson = await statusRes.json();
        setLiveStatus(statusJson);
      }

      let next = debugJson as DebugState;
      if (statusJson) {
        const details = Array.isArray(next.overrides.detailsCzLines) ? next.overrides.detailsCzLines : [];
        if (!details.length && Array.isArray(statusJson.detailsCzLines) && statusJson.detailsCzLines.length) {
          next = {
            ...next,
            overrides: {
              ...next.overrides,
              detailsCzLines: statusJson.detailsCzLines,
              measurementDate: next.overrides.measurementDate ?? statusJson.measurementDate ?? null,
              thicknessRange: next.overrides.thicknessRange ?? statusJson.thicknessRange ?? null,
            },
          };
        }
      }

      const initialState = next;
      const displayState = initialState.enabled ? initialState : { ...initialState, enabled: true };
      setState(displayState);
      setInitial(initialState);
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
      hasData: value !== "off_season",
      skatingAllowed: value === "ready" || value === "caution",
      warnings: value === "caution",
    };
    update({ enabled: true, overrides });
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
      let next = (json.debugState || EMPTY) as DebugState;
      if (liveStatus) {
        const details = Array.isArray(next.overrides.detailsCzLines) ? next.overrides.detailsCzLines : [];
        if (!details.length && Array.isArray(liveStatus.detailsCzLines) && liveStatus.detailsCzLines.length) {
          next = {
            ...next,
            overrides: {
              ...next.overrides,
              detailsCzLines: liveStatus.detailsCzLines,
              measurementDate: next.overrides.measurementDate ?? liveStatus.measurementDate ?? null,
              thicknessRange: next.overrides.thicknessRange ?? liveStatus.thicknessRange ?? null,
            },
          };
        }
      }
      const initialState = next;
      const displayState = initialState.enabled ? initialState : { ...initialState, enabled: true };
      setState(displayState);
      setInitial(initialState);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Debug Dashboard</h1>
          <p className="text-sm text-slate-400">Override the live scraper with mock data and force UI states.</p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <label className={labelClass}>Status override</label>
          <select
            className={inputClass}
            value={state.overrides.statusOverride}
            onChange={(e) => setStatusOverride(e.target.value as DebugState["overrides"]["statusOverride"])}
          >
            <option value="ready">Ready (green)</option>
            <option value="caution">Warning / Risky (yellow)</option>
            <option value="not_ready">Not allowed (red)</option>
            <option value="off_season">Off season (neutral)</option>
          </select>
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

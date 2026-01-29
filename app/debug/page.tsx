"use client";

import { useEffect, useState } from "react";
import type { DebugState } from "@/lib/types";

const EMPTY: DebugState = {
  enabled: false,
  overrides: {
    hasData: true,
    skatingAllowed: true,
    warnings: false,
    measurementDate: null,
    thicknessRange: null,
    detailsCzLines: [],
  },
};

export default function DebugPage() {
  const [state, setState] = useState<DebugState>(EMPTY);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/debug");
      if (!res.ok) {
        setAvailable(false);
        return;
      }
      const json = await res.json();
      setState(json);
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

  const detailsText = state.overrides.detailsCzLines.join("\n");

  const update = (patch: Partial<DebugState>) => {
    setState((prev) => ({
      ...prev,
      ...patch,
      overrides: { ...prev.overrides, ...(patch.overrides || {}) },
    }));
  };

  const apply = async () => {
    await fetch("/api/debug", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
  };

  const reset = async () => {
    const res = await fetch("/api/debug/reset", { method: "POST" });
    if (res.ok) {
      const json = await res.json();
      setState(json.debugState || EMPTY);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", padding: 24, fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", background: "#111827", borderRadius: 16, padding: 24 }}>
        <h1 style={{ marginTop: 0 }}>Debug Dashboard</h1>
        <p>Override the live scraper with mock data.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          <div>
            <label>Debug mode</label>
            <select value={String(state.enabled)} onChange={(e) => update({ enabled: e.target.value === "true" })}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
          <div>
            <label>Data available</label>
            <select
              value={String(state.overrides.hasData)}
              onChange={(e) => update({ overrides: { hasData: e.target.value === "true" } })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label>Skating allowed</label>
            <select
              value={String(state.overrides.skatingAllowed)}
              onChange={(e) => update({ overrides: { skatingAllowed: e.target.value === "true" } })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div>
            <label>Warnings present</label>
            <select
              value={String(state.overrides.warnings)}
              onChange={(e) => update({ overrides: { warnings: e.target.value === "true" } })}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
          <div>
            <label>Measurement date (free text)</label>
            <input
              value={state.overrides.measurementDate || ""}
              onChange={(e) => update({ overrides: { measurementDate: e.target.value } })}
              placeholder="15. 1. 2026"
            />
          </div>
          <div>
            <label>Thickness range (cm)</label>
            <input
              value={state.overrides.thicknessRange || ""}
              onChange={(e) => update({ overrides: { thicknessRange: e.target.value } })}
              placeholder="12-15"
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label>Details (Czech, one line per row)</label>
          <textarea
            style={{ width: "100%", minHeight: 160 }}
            value={detailsText}
            onChange={(e) => update({ overrides: { detailsCzLines: e.target.value.split("\n").map((line) => line.trim()).filter(Boolean) } })}
          />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
          <button onClick={apply}>Apply overrides</button>
          <button onClick={reset}>Reset</button>
          <button onClick={() => window.open("/", "_blank")}>Open status page</button>
        </div>
        <p style={{ opacity: 0.7, fontSize: 12, marginTop: 12 }}>Requires DEBUG_MODE=1.</p>
      </div>
    </div>
  );
}

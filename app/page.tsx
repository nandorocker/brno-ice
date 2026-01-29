"use client";

import { useEffect, useMemo, useState } from "react";
import type { StatusData, StatusKind } from "@/lib/types";
import { pickMessage } from "@/lib/messages";

const EMPTY_DATA: StatusData = {
  fetchedAt: null,
  measurementDate: null,
  thicknessRange: null,
  detailsCzLines: [],
  detailsEnLines: [],
  warnings: false,
  status: "off_season",
  reason: "no_data",
};

type Lang = "cs" | "en";

const TEXT = {
  cs: {
    title: "Brněnská přehrada – stav ledu",
    detailsTitle: "Detaily měření",
    thicknessLabel: "Tloušťka ledu",
    dateLabel: "Datum měření",
    updatedLabel: "Aktualizováno:",
  },
  en: {
    title: "Brno Reservoir Skating Conditions",
    detailsTitle: "Measurement details",
    thicknessLabel: "Ice thickness",
    dateLabel: "Report date",
    updatedLabel: "Last updated:",
  },
};

function formatDate(value: string | null) {
  return value || "—";
}

function formatThickness(value: string | null) {
  return value ? value + " cm" : "—";
}

export default function Home() {
  const [data, setData] = useState<StatusData>(EMPTY_DATA);
  const [lang, setLang] = useState<Lang>("cs");
  const [message, setMessage] = useState("");

  const status: StatusKind = data.status || "off_season";

  const content = useMemo(() => TEXT[lang], [lang]);

  useEffect(() => {
    const saved = window.localStorage.getItem("lang");
    if (saved === "cs" || saved === "en") {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    let alive = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (!alive) return;
        setData({
          fetchedAt: json.cachedAt || null,
          measurementDate: json.measurementDate || null,
          thicknessRange: json.thicknessRange || null,
          detailsCzLines: json.detailsCzLines || [],
          detailsEnLines: json.detailsEnLines || [],
          warnings: Boolean(json.warnings),
          status: json.status || "off_season",
          reason: json.reason || "unknown",
        });
      } catch {
        // ignore
      }
    };

    fetchStatus();
    const id = window.setInterval(fetchStatus, 10 * 60 * 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    setMessage(pickMessage(status, lang));
  }, [status, lang]);

  const detailsText = (lang === "cs" ? data.detailsCzLines : data.detailsEnLines).join("\n") ||
    (lang === "cs" ? "—" : "Not available");

  const lastUpdated = data.fetchedAt
    ? new Date(data.fetchedAt).toLocaleString("cs-CZ", { timeZone: "Europe/Prague" })
    : "—";

  return (
    <div className={`page status-${status}`}>
      <div className="lang-toggle" role="group" aria-label="Language">
        <button type="button" className={lang === "cs" ? "active" : ""} onClick={() => setLang("cs")}>CS</button>
        <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
      </div>

      <main>
        <div className="title">{content.title}</div>
        <div className="status-message">{message}</div>

        <div className="data-points" aria-label="Key data">
          <div>
            <span>{content.thicknessLabel}</span>
            <div>{formatThickness(data.thicknessRange)}</div>
          </div>
          <div>
            <span>{content.dateLabel}</span>
            <div>{formatDate(data.measurementDate)}</div>
          </div>
        </div>

        <section className="details" aria-live="polite">
          <h2>{content.detailsTitle}</h2>
          <p className="details-text">{detailsText}</p>
          <div className="meta">{content.updatedLabel} {lastUpdated}</div>
        </section>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
    title: "Můžu bruslit na Prýglu?",
    detailsTitle: "Detaily měření a varování",
    thicknessLabel: "Tloušťka ledu",
    dateLabel: "Datum měření",
    updatedLabel: "Aktualizováno:",
    footer: "Vstup na zamrzlou hladinu je vždy na vlastní nebezpečí.",
    madeBy: "Vyrobeno nandorockerem se skates & láskou.",
  },
  en: {
    title: "Can I skate the Prygl?",
    detailsTitle: "Measurement details & warnings",
    thicknessLabel: "Ice thickness",
    dateLabel: "Report date",
    updatedLabel: "Last updated:",
    footer: "Skating is always at your own risk.",
    madeBy: "Made by nandorocker with skates & love.",
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
  const [ready, setReady] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsBodyRef = useRef<HTMLDivElement | null>(null);

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
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

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
    setMessage(pickMessage(status, lang, data.reason));
  }, [status, lang, data.reason]);

  const lines = lang === "cs" ? data.detailsCzLines : data.detailsEnLines;
  const filteredLines = lines.filter((line) => {
    if (lang === "cs") {
      return !/^\s*(Data z měření ledu|Tloušťka ledu)/i.test(line);
    }
    return !/^\s*(Ice measurements by city police on|Ice thickness)/i.test(line);
  });
  const warningRegex =
    /metan|bublin|prask|nebezpe|zákaz|zakaz|pozor|varov|vstup|nedoporu|změna hladiny|zmena hladiny|methane|crack|danger|warning|do not enter|not recommended|water level/i;
  const warningsLines = (lang === "cs" ? data.detailsCzLines : data.detailsEnLines).filter((line) =>
    warningRegex.test(line)
  );
  const detailsLines = filteredLines.filter((line) => !warningRegex.test(line));
  const detailsText = detailsLines.join("\n") || (lang === "cs" ? "—" : "Not available");
  const warningsText = warningsLines.join("\n");

  useEffect(() => {
    const body = detailsBodyRef.current;
    if (!body) return;
    if (detailsOpen) {
      body.style.maxHeight = body.scrollHeight + "px";
      body.style.opacity = "1";
    } else {
      body.style.maxHeight = "0px";
      body.style.opacity = "0";
    }
  }, [detailsOpen, detailsText, warningsText]);

  const lastUpdated = data.fetchedAt
    ? new Date(data.fetchedAt).toLocaleString("cs-CZ", { timeZone: "Europe/Prague" })
    : "—";

  return (
    <div
      className={[
        "min-h-screen flex items-center justify-center px-6 pb-12 pt-8",
        "page-enter",
        ready ? "is-ready" : "",
        status === "ready" ? "bg-statusGreen text-black" : "",
        status === "not_ready" ? "bg-statusRed text-white" : "",
        status === "caution" ? "bg-slate-900 text-statusYellow" : "",
        status === "off_season" ? "bg-statusNeutral text-white" : "",
      ].join(" ")}
    >
      <div className="fixed right-5 top-5 inline-flex gap-2" role="group" aria-label="Language">
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-sm ${lang === "cs" ? "font-bold opacity-100" : "opacity-80"}`}
          onClick={() => setLang("cs")}
        >
          CS
        </button>
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-sm ${lang === "en" ? "font-bold opacity-100" : "opacity-80"}`}
          onClick={() => setLang("en")}
        >
          EN
        </button>
      </div>

      <main className="w-full text-left lg:max-w-[1200px]">
        <div className="fade-in delay-1 text-[16px] tracking-[0.08em] uppercase opacity-80 font-title font-extrabold">
          {content.title}
        </div>
        <div className="fade-in delay-2 mt-2 text-[clamp(44px,9vw,112px)] leading-[0.9] uppercase font-title font-extrabold lg:max-w-[18ch]">
          {message}
        </div>

        <div className="fade-in delay-3 mt-2 flex flex-wrap items-start gap-10 text-[40px] font-extrabold">
          <div>
            <span className="block text-[14px] tracking-[0.08em] uppercase opacity-85">
              {content.thicknessLabel}
            </span>
            <div>{formatThickness(data.thicknessRange)}</div>
          </div>
          <div>
            <span className="block text-[14px] tracking-[0.08em] uppercase opacity-85">
              {content.dateLabel}
            </span>
            <div>{formatDate(data.measurementDate)}</div>
          </div>
        </div>

        <section className="fade-in delay-4 mt-6" aria-live="polite">
          <div>
            <button
              type="button"
              className="font-bold text-left"
              aria-expanded={detailsOpen}
              aria-controls="details-body"
              onClick={() => setDetailsOpen((prev) => !prev)}
            >
              ⚠️ {content.detailsTitle} {detailsOpen ? "▴" : "▾"}
            </button>
            <div
              id="details-body"
              ref={detailsBodyRef}
              className="overflow-hidden transition-all duration-300 ease-out"
              style={{ maxHeight: 0, opacity: 0 }}
            >
              <p className="whitespace-pre-line text-[15px] leading-relaxed max-w-reading">
                {detailsText}
              </p>
              {warningsText ? (
                <div className="mt-4 text-[14px] leading-relaxed max-w-reading">
                  {warningsText}
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-3 text-[12px] opacity-70 lg:flex lg:items-center lg:justify-between">
            <div className="lg:flex-1 lg:text-left">
              {content.updatedLabel} {lastUpdated} — Source:{" "}
              <a className="underline" href="https://www.prygl.net/" target="_blank" rel="noreferrer">
                prygl.net
              </a>
            </div>
            <div className="lg:flex-1 lg:text-center">
              {content.madeBy}{" "}
              <a className="underline" href="https://nan.do" target="_blank" rel="noreferrer">
                nan.do
              </a>
            </div>
            <div className="lg:flex-1 lg:text-right">
              {content.footer}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

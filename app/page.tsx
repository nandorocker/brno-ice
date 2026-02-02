"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { StatusData, StatusKind } from "@/lib/types";
import { getMessagePool } from "@/lib/messages";

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
type SeasonKey = "winter" | "spring" | "summer" | "autumn";

const TEXT = {
  cs: {
    title: "Můžu bruslit na Prýglu?",
    detailsTitle: "Detaily měření a varování",
    thicknessLabel: "Tloušťka ledu",
    dateLabel: "Datum měření",
    updatedLabel: "Aktualizováno:",
    sourceLabel: "Zdroj:",
    footer: "Vstup na zamrzlou hladinu je vždy na vlastní nebezpečí.",
    madeBy: "©2026 by",
    madeBySuffix: "No affiliation to prygl.net",
  },
  en: {
    title: "Can I skate the Prygl?",
    detailsTitle: "Measurement details & warnings",
    thicknessLabel: "Ice thickness",
    dateLabel: "Report date",
    updatedLabel: "Last updated:",
    sourceLabel: "Source:",
    footer: "Skating is always at your own risk.",
    madeBy: "©2026 by",
    madeBySuffix: "No affiliation to prygl.net",
  },
};

const PARTICLES_CONFIG = {
  particles: {
    number: { value: 75, density: { enable: true, value_area: 1000 } },
    color: { value: "#ffffff" },
    shape: { type: "circle" },
    opacity: { value: 0.6, random: true, anim: { enable: true, speed: 0.35, opacity_min: 0.2, sync: false } },
    size: { value: 6, random: true, anim: { enable: false, speed: 2, size_min: 2, sync: false } },
    line_linked: { enable: false },
    move: {
      enable: true,
      speed: 0.9,
      direction: "bottom",
      straight: false,
      random: false,
      out_mode: "out",
      bounce: false,
    },
  },
  interactivity: {
    detect_on: "canvas",
    events: { onhover: { enable: false }, onclick: { enable: false }, resize: true },
  },
  retina_detect: true,
};

function formatDate(value: string | null) {
  return value || "—";
}

function formatThickness(value: string | null) {
  return value ? value + " cm" : "—";
}

function getSeasonKey(): SeasonKey {
  const now = new Date();
  const month = now.getMonth() + 1;
  if (month >= 12 || month <= 3) return "winter";
  if (month >= 4 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  return "autumn";
}

type DebugStatusOverride = "auto" | "ready" | "caution" | "not_ready" | "off_season" | "no_data" | "unknown_thickness";
type DebugSeasonOverride = "auto" | "spring" | "summer" | "autumn" | "winter";
type DebugStatusSelection =
  | "ready"
  | "caution"
  | "not_ready"
  | "off_season_spring"
  | "off_season_summer"
  | "off_season_autumn"
  | "no_data"
  | "unknown_thickness";

type DebugState = {
  enabled: boolean;
  overrides: {
    statusOverride: DebugStatusOverride;
    seasonOverride?: DebugSeasonOverride;
  };
};

function DebugFloater({ onRefresh, onNextMessage }: { onRefresh: () => void; onNextMessage: () => void }) {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [state, setState] = useState<DebugState | null>(null);
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/debug");
        if (!res.ok) {
          if (alive) setAvailable(false);
          return;
        }
        const json = await res.json();
        if (!alive) return;
        const next = (json.debugState || json) as DebugState;
        setState(next);
        setAvailable(true);
      } catch {
        if (alive) setAvailable(false);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const update = async (next: DebugState) => {
    setState(next);
    try {
      await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
      refreshTimerRef.current = window.setTimeout(() => {
        onRefresh();
        refreshTimerRef.current = null;
      }, 300);
    } catch {
      // ignore
    }
  };

  if (loading || !available || !state) return null;

  const resolveStatusSelection = (): DebugStatusSelection => {
    if (state.overrides.statusOverride !== "off_season") return state.overrides.statusOverride as DebugStatusSelection;
    if (state.overrides.seasonOverride === "summer") return "off_season_summer";
    if (state.overrides.seasonOverride === "autumn") return "off_season_autumn";
    return "off_season_spring";
  };

  const applyStatusSelection = (value: DebugStatusSelection) => {
    const isOffSeason = value.startsWith("off_season_");
    const seasonOverride = isOffSeason
      ? (value.replace("off_season_", "") as DebugSeasonOverride)
      : "auto";
    update({
      ...state,
      overrides: {
        ...state.overrides,
        statusOverride: isOffSeason ? "off_season" : (value as DebugStatusOverride),
        seasonOverride,
      },
    });
  };

  if (collapsed) {
    return (
      <button
        type="button"
        aria-label="Expand debug controls"
        className="fixed right-5 bottom-5 z-50 h-12 w-12 rounded-full border border-white/20 bg-black/70 text-white shadow-lg backdrop-blur"
        onClick={() => setCollapsed(false)}
      >
        🐛
      </button>
    );
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 w-fit max-w-[90vw] rounded-2xl border border-white/15 bg-black/70 p-3 text-white shadow-lg backdrop-blur">
      <div className="grid items-start gap-3 sm:grid-cols-[max-content_max-content_max-content_max-content]">
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] opacity-70">Debug mode</label>
          <label className="mt-1.5 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={state.enabled}
              onChange={(e) => update({ ...state, enabled: e.target.checked })}
            />
            Enabled
          </label>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-[0.2em] opacity-70">Status</label>
          <select
            className="mt-1.5 w-full rounded-md border border-white/15 bg-black/60 px-2 py-1 text-sm"
            value={resolveStatusSelection()}
            onChange={(e) => applyStatusSelection(e.target.value as DebugStatusSelection)}
          >
            <option value="ready">Ready (green)</option>
            <option value="caution">Warning / Risky (yellow)</option>
            <option value="not_ready">Not allowed (red)</option>
            <option value="off_season_spring">Off season (spring)</option>
            <option value="off_season_summer">Off season (summer)</option>
            <option value="off_season_autumn">Off season (autumn)</option>
            <option value="no_data">No data / Error</option>
            <option value="unknown_thickness">Unknown thickness</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="mt-[18px] h-7 w-7 rounded-full border border-white/15 text-xs"
            onClick={onNextMessage}
            aria-label="Shuffle message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m18 14 4 4-4 4" />
              <path d="m18 2 4 4-4 4" />
              <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" />
              <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" />
              <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
            </svg>
          </button>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            className="mt-[18px] h-7 w-7 rounded-full border border-white/15 text-xs"
            onClick={() => setCollapsed(true)}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<StatusData>(EMPTY_DATA);
  const [lang, setLang] = useState<Lang>("cs");
  const [messageIndex, setMessageIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsBodyRef = useRef<HTMLDivElement | null>(null);
  const [seasonOverride, setSeasonOverride] = useState<"auto" | "winter" | "spring" | "summer" | "autumn">("auto");
  const hasLoadedRef = useRef(false);
  const particlesActiveRef = useRef(false);

  const status: StatusKind = data.status || "off_season";
  const seasonKey = seasonOverride !== "auto" ? seasonOverride : getSeasonKey();
  const displayStatus: StatusKind =
    status === "off_season" && data.reason === "no_data" && seasonKey === "winter" ? "not_ready" : status;

  const content = useMemo(() => TEXT[lang], [lang]);

  useEffect(() => {
    const saved = window.localStorage.getItem("lang");
    if (saved === "cs" || saved === "en") {
      setLang(saved);
      return;
    }
    const sysLang = (navigator.language || "").toLowerCase();
    if (sysLang.startsWith("cs")) {
      setLang("cs");
    } else if (sysLang.startsWith("en")) {
      setLang("en");
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    document.title = TEXT[lang].title;
  }, [lang]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
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
      setSeasonOverride(json?.debug?.enabled ? (json?.debug?.seasonOverride || "auto") : "auto");
    } catch {
      // ignore
    } finally {
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!alive) return;
      await fetchStatus();
    };

    load();
    const id = window.setInterval(load, 10 * 60 * 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const messagePool = useMemo(
    () => getMessagePool(displayStatus, lang, data.reason, seasonOverride),
    [displayStatus, lang, data.reason, seasonOverride]
  );

  useEffect(() => {
    if (!messagePool.length) {
      setMessageIndex(0);
      return;
    }
    const nextIndex = Math.floor(Math.random() * messagePool.length);
    setMessageIndex(nextIndex);
  }, [displayStatus, lang, data.reason, seasonOverride, messagePool.length]);

  const message =
    messagePool.length > 0 ? messagePool[messageIndex % messagePool.length] : "";

  useEffect(() => {
    if (displayStatus !== "ready") {
      if (particlesActiveRef.current) {
        const w = window as typeof window & { pJSDom?: Array<{ pJS?: { fn?: { vendors?: { destroypJS?: () => void } } } }> };
        w.pJSDom?.forEach((instance) => instance.pJS?.fn?.vendors?.destroypJS?.());
        w.pJSDom = [];
        const canvas = document.querySelector("#particles-js > canvas");
        if (canvas) canvas.remove();
        particlesActiveRef.current = false;
      }
      return;
    }

    let cancelled = false;
    const initParticles = () => {
      if (cancelled) return;
      const w = window as typeof window & { particlesJS?: (tagId: string, params: typeof PARTICLES_CONFIG) => void };
      if (!w.particlesJS) return;
      w.particlesJS("particles-js", PARTICLES_CONFIG);
      particlesActiveRef.current = true;
    };

    const existingScript = document.getElementById("particles-js-script") as HTMLScriptElement | null;
    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        initParticles();
      } else {
        existingScript.addEventListener("load", initParticles, { once: true });
      }
    } else {
      const script = document.createElement("script");
      script.id = "particles-js-script";
      script.src = "https://cdn.jsdelivr.net/npm/particles.js@2.0.0/particles.min.js";
      script.async = true;
      script.addEventListener("load", () => {
        script.dataset.loaded = "true";
        initParticles();
      });
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [displayStatus]);

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

  const isNoData = data.reason === "no_data" || data.reason === "unknown_thickness";
  const statusClasses = isLoading
    ? "bg-slate-950 text-white"
    : {
        ready: "bg-statusGreen text-black",
        not_ready: "bg-statusRed text-white",
        caution: "bg-statusYellow text-black",
        no_data: "bg-statusNeutral text-white",
        off_season: {
          winter: "bg-season-winter text-white",
          spring: "bg-season-spring text-white",
          summer: "bg-season-summer text-white",
          autumn: "bg-season-autumn text-white",
        },
      };

  const containerStatusClass =
    typeof statusClasses === "string"
      ? statusClasses
      : isNoData
        ? statusClasses.no_data
        : displayStatus === "off_season"
          ? statusClasses.off_season[seasonKey]
          : statusClasses[displayStatus];

  const footerTextClass =
    typeof statusClasses === "string"
      ? ""
      : isNoData
        ? "text-white"
        : displayStatus === "ready"
          ? "text-black"
          : displayStatus === "caution"
            ? "text-black"
            : "text-white";

  return (
    <div
      className={[
        "relative min-h-screen flex flex-col px-6 pb-6 pt-8",
        "page-enter",
        ready ? "is-ready" : "",
        containerStatusClass,
      ].join(" ")}
      >
      <DebugFloater
        onRefresh={fetchStatus}
        onNextMessage={() => setMessageIndex((prev) => prev + 1)}
      />
      {displayStatus === "ready" ? (
        <div id="particles-js" className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
      ) : null}
      <div className="fixed right-5 top-5 z-20 inline-flex gap-1" role="group" aria-label="Language">
        <button
          type="button"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm ${lang === "cs" ? "font-bold opacity-100" : "opacity-80"}`}
          onClick={() => setLang("cs")}
        >
          CS
        </button>
        <button
          type="button"
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm ${lang === "en" ? "font-bold opacity-100" : "opacity-80"}`}
          onClick={() => setLang("en")}
        >
          EN
        </button>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center">
        <main className="w-full text-left lg:max-w-screen-xl">
        <div className="fade-in delay-1 text-[clamp(26px,3.4vw,38px)] tracking-[0.08em] uppercase font-title font-extrabold">
          <span className="opacity-65">{content.title}</span>
        </div>
        <div
          className={[
            "fade-in delay-2 mt-2 text-[clamp(44px,8vw,100px)] md:text-[clamp(52px,7.8vw,102px)] lg:text-[clamp(38px,5.5vw,76px)] leading-[0.9] uppercase font-title font-extrabold lg:max-w-[25ch] whitespace-pre-line",
            displayStatus === "off_season" ? "text-white" : "",
          ].join(" ")}
        >
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-[1.1em] w-[12ch] rounded-full bg-white/25 animate-pulse" />
              <div className="h-[1.1em] w-[18ch] rounded-full bg-white/20 animate-pulse" />
            </div>
          ) : (
            message
          )}
        </div>

        <div className="fade-in delay-3 mt-12 md:mt-14 lg:mt-16 flex flex-wrap items-start gap-10 text-[40px] font-extrabold">
          <div>
            <span className="block text-[14px] tracking-[0.08em] uppercase opacity-65">
              {content.thicknessLabel}
            </span>
            {isLoading ? (
              <div className="mt-3 h-[1em] w-[7ch] rounded-full bg-white/25 animate-pulse" />
            ) : (
              <div>
                {displayStatus === "off_season"
                  ? "0 cm"
                  : data.reason === "unknown_thickness"
                    ? "? cm"
                    : formatThickness(data.thicknessRange)}
              </div>
            )}
          </div>
          {!isLoading && displayStatus !== "off_season" ? (
            <div>
              <span className="block text-[14px] tracking-[0.08em] uppercase opacity-65">
                {content.dateLabel}
              </span>
              <div>{formatDate(data.measurementDate)}</div>
            </div>
          ) : null}
        </div>

        <section className="fade-in delay-4 mt-10" aria-live="polite">
          {!isLoading && status !== "off_season" && data.reason !== "no_data" ? (
            <div>
              <button
                type="button"
                className="font-bold text-left"
                aria-expanded={detailsOpen}
                aria-controls="details-body"
                onClick={() => setDetailsOpen((prev) => !prev)}
              >
                {content.detailsTitle} {detailsOpen ? "▴" : "▾"}
              </button>
              <div
                id="details-body"
                ref={detailsBodyRef}
                className="overflow-hidden transition-all duration-300 ease-out max-h-0 opacity-0"
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
          ) : null}
        </section>
        </main>
      </div>

      <footer
        className={[
          "mt-auto w-full text-[12px] opacity-65",
          footerTextClass,
        ].join(" ")}
      >
        <div className="mx-auto w-full lg:max-w-screen-xl lg:grid lg:grid-cols-2 lg:items-end lg:gap-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 lg:text-left">
            <span>
              {content.updatedLabel} {lastUpdated} — {content.sourceLabel}{" "}
              <a className="underline" href="https://www.prygl.net/" target="_blank" rel="noreferrer">
                prygl.net
              </a>
            </span>
            <span>·</span>
            <span>{content.footer}</span>
          </div>
          <div className="mt-3 lg:mt-0 lg:text-right">
            {content.madeBy}{" "}
            <a className="underline" href="https://nan.do" target="_blank" rel="noreferrer">
              nan.do
            </a>
            . {content.madeBySuffix}
          </div>
        </div>
      </footer>
    </div>
  );
}

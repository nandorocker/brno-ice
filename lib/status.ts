import axios from "axios";
import * as cheerio from "cheerio";
import iconv from "iconv-lite";
import { DebugOverrides, DebugState, StatusData, StatusKind } from "@/lib/types";

const SOURCE_URL = "https://www.prygl.net/";
const STALE_DAYS = Number(process.env.STALE_DAYS || 7);
const MIN_SAFE_CM = Number(process.env.MIN_SAFE_CM || 12);
const DEBUG_MODE = process.env.DEBUG_MODE === "1";
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 12 * 60 * 60 * 1000);

const DEFAULT_DEBUG_OVERRIDES: DebugOverrides = {
  hasData: true,
  skatingAllowed: true,
  warnings: false,
  measurementDate: null,
  thicknessRange: "12-15",
  detailsCzLines: [
    "Data z měření ledu městskou policií dne: 15. 1. 2026",
    "Tloušťka ledu: 12-15 cm",
    "přístav Bystrc: 13 cm",
    "Kozí horka: 12 cm",
    "Sokol: 14 cm",
    "Rokle: 12 cm",
    "Vstup na zamrzlou hladinu přehrady je vždy jen na vlastní nebezpečí!",
  ],
};

let cached: StatusData | null = null;
let lastFetchMs = 0;

let debugState: DebugState = {
  enabled: false,
  overrides: { ...DEFAULT_DEBUG_OVERRIDES },
};

function normalizeLine(line: string) {
  return line.replace(/\s+/g, " ").trim();
}

function extractSectionLines($: cheerio.CheerioAPI) {
  const heading = $("h1,h2,h3,h4")
    .filter((_, el) => $(el).text().toLowerCase().includes("stav ledu na přehradě"))
    .first();

  if (!heading.length) return [];

  const lines: string[] = [];
  let node = heading.next();
  while (node && node.length) {
    if (node.is("h1,h2,h3,h4")) break;

    const html = node.html();
    if (html) {
      const withBreaks = html.replace(/<br\s*\/?\s*>/gi, "\n");
      const text = cheerio.load(`<div>${withBreaks}</div>`)("div").text();
      text
        .split("\n")
        .map(normalizeLine)
        .filter(Boolean)
        .forEach((line) => lines.push(line));
    }
    node = node.next();
  }

  if (!lines.length) {
    const fallback = heading.parent().text();
    fallback
      .split("\n")
      .map(normalizeLine)
      .filter(Boolean)
      .forEach((line) => lines.push(line));
  }

  return lines.filter((line) => !line.toLowerCase().includes("stav ledu na přehradě"));
}

function parseMeasurementDate(text: string) {
  const match = text.match(/dne\s*:?\s*([0-9]{1,2}\.\s*[0-9]{1,2}\.\s*[0-9]{4})/i);
  if (match) return match[1].replace(/\s+/g, " ").trim();
  const fallback = text.match(/([0-9]{1,2}\.\s*[0-9]{1,2}\.\s*[0-9]{4})/);
  return fallback ? fallback[1].replace(/\s+/g, " ").trim() : null;
}

function parseThicknessRange(text: string) {
  const match = text.match(/Tloušťka ledu\s*[:\-]?\s*([0-9]{1,2}(?:\s*-\s*[0-9]{1,2})?)\s*cm/i);
  if (match) return match[1].replace(/\s+/g, " ").trim();
  const fallback = text.match(/([0-9]{1,2}(?:\s*-\s*[0-9]{1,2})?)\s*cm/i);
  return fallback ? fallback[1].replace(/\s+/g, " ").trim() : null;
}

function parseMinThickness(range: string | null) {
  if (!range) return null;
  const parts = range.split("-").map((p) => parseInt(p.trim(), 10));
  if (parts.some((p) => Number.isNaN(p))) return null;
  return Math.min(...parts);
}

function hasWarnings(text: string) {
  const lower = text.toLowerCase();
  const warningTokens = [
    "metan",
    "bublin",
    "prask",
    "nebezpe",
    "zákaz",
    "zakaz",
    "pozor",
    "varování",
    "varovani",
    "vstup",
    "nedoporu",
    "změna hladiny",
    "zmena hladiny",
  ];
  return warningTokens.some((token) => lower.includes(token));
}

function parseMeasurementDateToDate(value: string | null) {
  if (!value) return null;
  const match = value.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!day || !month || !year) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function isStale(measurementDate: string | null) {
  const parsed = parseMeasurementDateToDate(measurementDate);
  if (!parsed) return true;
  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > STALE_DAYS;
}

function translateLine(line: string) {
  const replacements: Array<[RegExp, string]> = [
    [/Data z měření ledu městskou policií dne\s*:?/i, "Ice measurements by city police on:"],
    [/Tloušťka ledu\s*:?/i, "Ice thickness:"],
    [/Vstup na zamrzlou hladinu přehrady je vždy jen na vlastní nebezpečí!/i, "Entering the frozen reservoir surface is always at your own risk!"],
    [/přístav/gi, "harbor"],
    [/rybník/gi, "pond"],
    [/přehrada/gi, "reservoir"],
    [/metanové bubliny/gi, "methane bubbles"],
    [/bubliny metanu/gi, "methane bubbles"],
    [/praskání ledu/gi, "ice cracking"],
    [/praská/gi, "is cracking"],
    [/pozor/gi, "warning"],
    [/nebezpečné/gi, "dangerous"],
    [/nedoporučuje se/gi, "not recommended"],
    [/změna hladiny/gi, "water level changes"],
    [/zákaz vstupu/gi, "do not enter"],
  ];

  let translated = line;
  for (const [pattern, replacement] of replacements) {
    translated = translated.replace(pattern, replacement);
  }
  return translated;
}

function translateLines(lines: string[]) {
  if (!lines || !lines.length) return [];
  return lines.map((line) => translateLine(line));
}

function determineStatus(input: {
  measurementDate: string | null;
  thicknessRange: string | null;
  warnings: boolean;
}): { status: StatusKind; reason: string } {
  if (!input.measurementDate && !input.thicknessRange) {
    return { status: "off_season", reason: "no_data" };
  }

  if (isStale(input.measurementDate)) {
    return { status: "off_season", reason: "stale" };
  }

  if (input.warnings) {
    return { status: "not_ready", reason: "warnings" };
  }

  const minThickness = parseMinThickness(input.thicknessRange);
  if (minThickness === null) {
    return { status: "not_ready", reason: "unknown_thickness" };
  }

  if (minThickness >= MIN_SAFE_CM) {
    return { status: "ready", reason: "safe_thickness" };
  }

  return { status: "not_ready", reason: "too_thin" };
}

async function scrapePrygl(): Promise<StatusData> {
  const response = await axios.get(SOURCE_URL, {
    responseType: "arraybuffer",
    timeout: 15000,
  });

  const html = iconv.decode(Buffer.from(response.data), "windows-1250");
  const $ = cheerio.load(html);

  const lines = extractSectionLines($);
  const fullText = lines.join("\n");

  const measurementDate = parseMeasurementDate(fullText);
  const thicknessRange = parseThicknessRange(fullText);
  const warnings = hasWarnings(fullText);

  const { status, reason } = determineStatus({
    measurementDate,
    thicknessRange,
    warnings,
  });

  return {
    fetchedAt: new Date().toISOString(),
    measurementDate,
    thicknessRange,
    detailsCzLines: lines,
    detailsEnLines: translateLines(lines),
    warnings,
    status,
    reason,
  };
}

function buildDebugData(): StatusData {
  const o = debugState.overrides;
  const detailsCzLines = Array.isArray(o.detailsCzLines) ? o.detailsCzLines : [];
  const fullText = detailsCzLines.join("\n");
  const measurementDate = o.measurementDate || parseMeasurementDate(fullText);
  const thicknessRange = o.thicknessRange || parseThicknessRange(fullText);
  const warnings = Boolean(o.warnings);
  const hasData = Boolean(o.hasData);

  let status: StatusKind = "off_season";
  let reason = "no_data";
  if (hasData) {
    status = o.skatingAllowed ? "ready" : "not_ready";
    reason = o.skatingAllowed ? "debug_allowed" : "debug_not_allowed";
    if (warnings) {
      status = "not_ready";
      reason = "warnings";
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    measurementDate: measurementDate || null,
    thicknessRange: thicknessRange || null,
    detailsCzLines,
    detailsEnLines: translateLines(detailsCzLines),
    warnings,
    status,
    reason,
  };
}

export function sanitizeDebugOverrides(input: Partial<DebugOverrides> | null) {
  if (!input || typeof input !== "object") return {};
  const out: Partial<DebugOverrides> = {};
  if (typeof input.hasData === "boolean") out.hasData = input.hasData;
  if (typeof input.skatingAllowed === "boolean") out.skatingAllowed = input.skatingAllowed;
  if (typeof input.warnings === "boolean") out.warnings = input.warnings;
  if (typeof input.measurementDate === "string") out.measurementDate = input.measurementDate.trim() || null;
  if (typeof input.thicknessRange === "string") out.thicknessRange = input.thicknessRange.trim() || null;
  if (Array.isArray(input.detailsCzLines)) {
    out.detailsCzLines = input.detailsCzLines.map((line) => String(line)).filter(Boolean);
  }
  return out;
}

export function getDebugState() {
  return debugState;
}

export function setDebugState(input: Partial<DebugState>) {
  if (typeof input.enabled === "boolean") debugState.enabled = input.enabled;
  if (input.overrides) {
    debugState.overrides = { ...debugState.overrides, ...sanitizeDebugOverrides(input.overrides) } as DebugOverrides;
  }
}

export function resetDebugState() {
  debugState = { enabled: false, overrides: { ...DEFAULT_DEBUG_OVERRIDES } };
}

export async function getStatus(force = false): Promise<StatusData> {
  if (DEBUG_MODE && debugState.enabled) {
    return buildDebugData();
  }

  const now = Date.now();
  if (!force && cached && now - lastFetchMs < CACHE_TTL_MS) {
    return cached;
  }

  const data = await scrapePrygl();
  cached = data;
  lastFetchMs = now;
  return data;
}

export { DEBUG_MODE, SOURCE_URL };

export type StatusKind = "ready" | "not_ready" | "caution" | "off_season";

export type StatusData = {
  fetchedAt: string | null;
  measurementDate: string | null;
  thicknessRange: string | null;
  detailsCzLines: string[];
  detailsEnLines: string[];
  warnings: boolean;
  status: StatusKind;
  reason: string;
};

export type DebugOverrides = {
  hasData: boolean;
  skatingAllowed: boolean;
  warnings: boolean;
  statusOverride: StatusKind | "auto" | "no_data";
  seasonOverride: "auto" | "winter" | "spring" | "summer" | "autumn";
  measurementDate: string | null;
  thicknessRange: string | null;
  detailsCzLines: string[];
};

export type DebugState = {
  enabled: boolean;
  overrides: DebugOverrides;
};

export type StatusKind = "ready" | "not_ready" | "off_season";

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
  measurementDate: string | null;
  thicknessRange: string | null;
  detailsCzLines: string[];
};

export type DebugState = {
  enabled: boolean;
  overrides: DebugOverrides;
};

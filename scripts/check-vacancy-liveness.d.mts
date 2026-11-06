export type Uitkomst = "levend" | "verlopen-kandidaat" | "onbekend";

export interface LivenessResult {
  index: number;
  url: string;
  titel?: string;
  bedrijf?: string;
  uitkomst: Uitkomst;
  reden: string;
}

export interface ClassifyInput {
  url: string;
  titel?: string;
  status?: number;
  finalUrl?: string;
  body?: string;
  error?: unknown;
}

export const GONE_MARKERS: string[];
export function isLoginHost(url: string): boolean;
export function classifyResponse(r: ClassifyInput): { uitkomst: Uitkomst; reden: string };
export function checkLiveness(
  items: Record<string, any>[],
  options?: { fetchFn?: typeof fetch; concurrency?: number; timeoutMs?: number }
): Promise<LivenessResult[]>;
export function applyChecked(
  items: Record<string, any>[],
  results: LivenessResult[],
  today?: string
): Record<string, any>[];

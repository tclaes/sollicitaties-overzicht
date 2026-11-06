export interface SyncInputIssue {
  code: string;
  message: string;
}

export interface CheckSyncInputResult {
  errors: SyncInputIssue[];
  warnings: SyncInputIssue[];
  summary: { total: number; actief: number };
}

export interface CheckSyncInputOptions {
  today?: string;
  maxAgeDays?: number;
  verplichtVanaf?: string;
}

export const MAX_AGE_DAYS: number;
export const GECONTROLEERD_VERPLICHT_VANAF: string;
export function checkSyncInput(items: unknown, options?: CheckSyncInputOptions): CheckSyncInputResult;

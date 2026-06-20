export function formatDatumSidebar(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-BE", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

export function vandaagIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-BE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function datumUitBestandsnaam(bestandsnaam: string): string | null {
  // vacatures_frontend_limburg_20_06_2026.pdf → 2026-06-20
  const match = bestandsnaam.match(/(\d{2})_(\d{2})_(\d{4})/);
  if (!match) return null;
  const [, dag, maand, jaar] = match;
  return `${jaar}-${maand}-${dag}`;
}

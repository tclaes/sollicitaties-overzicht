export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-BE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

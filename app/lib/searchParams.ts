export function buildSearchUrl(
  basePath: string,
  currentSearch: Record<string, unknown>,
  params: Record<string, unknown>,
): string {
  const merged = {...currentSearch, ...params};
  const search = new URLSearchParams(
    Object.fromEntries(
      Object.entries(merged).filter(([, v]) => v !== undefined) as [string, string][]
    )
  );
  return `${basePath}${search.size ? `?${search}` : ""}`;
}
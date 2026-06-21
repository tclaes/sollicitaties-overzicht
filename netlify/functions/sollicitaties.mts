import { getStore } from "@netlify/blobs";

const STORE_KEY = "data";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Seed data from existing sollicitaties.json
const SEED = [
  { id: "kpd-2026-04-16", bedrijf: "KPD", rol: "Frontend Developer", gesolliceerdOp: "2026-04-16", status: "geen_reactie", notitie: "CV + motivatiebrief verstuurd" },
  { id: "acagroup-2026-04-17", bedrijf: "ACA Group", rol: "Frontend Developer", gesolliceerdOp: "2026-04-17", status: "geen_reactie", notitie: "CV + motivatiebrief verstuurd" },
  { id: "climapulse-2026-05-01", bedrijf: "Climapulse", rol: "Senior Frontend Developer", gesolliceerdOp: "2026-05-01", status: "afgewezen", notitie: "Niet weerhouden door bedrijf op 10-06-2026" },
  { id: "appeel-2026-05-28", bedrijf: "Appeel", rol: "Frontend Developer", gesolliceerdOp: "2026-05-28", status: "geen_reactie" },
  { id: "micro1-2026-05-31", bedrijf: "Micro1", rol: "Frontend Developer", gesolliceerdOp: "2026-05-31", status: "geen_reactie" },
  { id: "xplore-frontend-2026-06-02", bedrijf: "Xplore Group", rol: "Front-end Developer", gesolliceerdOp: "2026-06-02", status: "afgewezen", notitie: "Niet weerhouden door bedrijf op 20-06-2026" },
  { id: "xplore-martech-2026-06-02", bedrijf: "Xplore Group", rol: "Technical Martech Developer", gesolliceerdOp: "2026-06-02", status: "afgewezen", notitie: "Niet weerhouden door bedrijf op 20-06-2026" },
  { id: "xplore-webdev-2026-06-02", bedrijf: "Xplore Group", rol: "Web Developers", gesolliceerdOp: "2026-06-02", status: "afgewezen", notitie: "Niet weerhouden door bedrijf op 20-06-2026" },
  { id: "imengine-2026-06-08", bedrijf: "Imengine", rol: "Angular Developer", gesolliceerdOp: "2026-06-08", status: "gesolliciteerd" },
  { id: "alpine-digital-2026-06-11", bedrijf: "Alpine Digital", rol: "Full-stack Developer", gesolliceerdOp: "2026-06-11", status: "niet_wervend", notitie: "Bedrijf zoekt voorlopig niemand voor deze rol" },
  { id: "vanroey-2026-06-20", bedrijf: "VanRoey", rol: "Front-End / Full-Stack Developer", gesolliceerdOp: "2026-06-20", status: "gesolliciteerd", notitie: "The Collective" },
];

async function getData(store: ReturnType<typeof getStore>) {
  const data = await store.get(STORE_KEY, { type: "json" });
  if (data === null) {
    await store.set(STORE_KEY, JSON.stringify(SEED));
    return SEED;
  }
  return data as typeof SEED;
}

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const store = getStore("sollicitaties");

  if (req.method === "GET") {
    const data = await getData(store);
    return Response.json(data, { headers: CORS });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const current = await getData(store);
    const existing = current.findIndex((s: any) => s.id === body.id);
    if (existing !== -1) {
      current[existing] = { ...current[existing], ...body };
    } else {
      current.unshift(body);
    }
    await store.set(STORE_KEY, JSON.stringify(current));
    return Response.json(body, { status: 201, headers: CORS });
  }

  if (req.method === "PATCH") {
    const { id, ...updates } = await req.json();
    const current = await getData(store);
    const idx = current.findIndex((s: any) => s.id === id);
    if (idx === -1) {
      return Response.json({ error: "not found" }, { status: 404, headers: CORS });
    }
    (current as any)[idx] = { ...(current as any)[idx], ...updates };
    await store.set(STORE_KEY, JSON.stringify(current));
    return Response.json((current as any)[idx], { headers: CORS });
  }

  return Response.json({ error: "method not allowed" }, { status: 405, headers: CORS });
};

export const config = { path: "/api/sollicitaties" };

import { describe, expect, it } from "vite-plus/test";
import { applyChecked, checkLiveness, classifyResponse } from "./check-vacancy-liveness.mjs";

const URL_ = "https://www.vdab.be/vindeenjob/vacatures/1/full-stack-developer";
const TITEL = "Full Stack Developer (.NET / Angular)";
const LEVENDE_BODY = "<h1>Full-stack developer (.NET / Angular)</h1><p>Solliciteer nu</p>";

describe("classifyResponse", () => {
  it("meldt HTTP 404 als kandidaat-verlopen", () => {
    expect(classifyResponse({ url: URL_, titel: TITEL, status: 404 })).toMatchObject({ uitkomst: "verlopen-kandidaat" });
    expect(classifyResponse({ url: URL_, titel: TITEL, status: 410 })).toMatchObject({ uitkomst: "verlopen-kandidaat" });
  });

  it("meldt een pagina met 'niet meer gepubliceerd' als kandidaat-verlopen", () => {
    const r = classifyResponse({
      url: URL_,
      titel: TITEL,
      status: 200,
      finalUrl: URL_,
      body: "<p>Deze vacature is niet meer gepubliceerd</p>",
    });
    expect(r.uitkomst).toBe("verlopen-kandidaat");
    expect(r.reden).toContain("niet meer gepubliceerd");
  });

  it("is accentongevoelig bij de markers", () => {
    const r = classifyResponse({ url: URL_, titel: TITEL, status: 200, finalUrl: URL_, body: "Positie NIET MEER BESCHIKBAAR" });
    expect(r.uitkomst).toBe("verlopen-kandidaat");
  });

  it("negeert een melding die enkel in een script van een SPA-shell staat (VDAB)", () => {
    const shell =
      '<title>Vind een job | VDAB</title><app-root></app-root>' +
      '<script>window.__msgs=[{"message_content":"Het evenement is niet meer beschikbaar, onze excuses."}]</script>';
    const r = classifyResponse({ url: URL_, titel: TITEL, status: 200, finalUrl: URL_, body: shell });
    expect(r.uitkomst).toBe("onbekend");
  });

  it("telt een melding in zichtbare tekst wel mee", () => {
    const r = classifyResponse({
      url: URL_,
      titel: TITEL,
      status: 200,
      finalUrl: URL_,
      body: "<main><h1>Oeps</h1><p>Deze vacature is&nbsp;niet meer beschikbaar</p></main><script>var a=1</script>",
    });
    expect(r.uitkomst).toBe("verlopen-kandidaat");
  });

  it("meldt een bron achter login als onbekend, zonder pagina", () => {
    for (const url of ["https://www.linkedin.com/jobs/view/1/", "https://be.indeed.com/viewjob?jk=a"]) {
      expect(classifyResponse({ url, titel: TITEL, status: 200, body: LEVENDE_BODY }).uitkomst).toBe("onbekend");
      expect(classifyResponse({ url, titel: TITEL, status: 404 }).uitkomst).toBe("onbekend");
    }
  });

  it("meldt een netwerkfout of time-out als onbekend", () => {
    const r = classifyResponse({ url: URL_, titel: TITEL, error: new Error("time-out na 10000 ms") });
    expect(r.uitkomst).toBe("onbekend");
    expect(r.reden).toContain("time-out");
  });

  it("meldt andere statuscodes (403, 429, 503) als onbekend", () => {
    for (const status of [403, 429, 503]) {
      expect(classifyResponse({ url: URL_, titel: TITEL, status }).uitkomst).toBe("onbekend");
    }
  });

  it("meldt een bot-controle als onbekend", () => {
    const r = classifyResponse({ url: URL_, titel: TITEL, status: 200, finalUrl: URL_, body: "<title>Just a moment...</title>" });
    expect(r.uitkomst).toBe("onbekend");
  });

  it("meldt een redirect naar een andere pagina als onbekend", () => {
    const r = classifyResponse({
      url: URL_,
      titel: TITEL,
      status: 200,
      finalUrl: "https://www.vdab.be/vindeenjob/zoeken",
      body: LEVENDE_BODY,
    });
    expect(r.uitkomst).toBe("onbekend");
  });

  it("meldt een SPA-shell zonder de vacaturetitel als onbekend, niet als levend", () => {
    const r = classifyResponse({ url: URL_, titel: TITEL, status: 200, finalUrl: URL_, body: "<app-root></app-root>" });
    expect(r.uitkomst).toBe("onbekend");
  });

  it("meldt een pagina die de vacature toont als levend, ook met trailing slash of http->https", () => {
    const r = classifyResponse({ url: URL_, titel: TITEL, status: 200, finalUrl: `${URL_}/`, body: LEVENDE_BODY });
    expect(r).toMatchObject({ uitkomst: "levend" });
  });
});

describe("checkLiveness", () => {
  const items = [
    { titel: "Full Stack Developer", bedrijf: "A", url: "https://a.example/vacature/1", gecontroleerdOp: "2026-10-01" },
    { titel: "Front-end Developer", bedrijf: "B", url: "https://b.example/vacature/2" },
    { titel: "Dev", bedrijf: "C", url: "https://www.linkedin.com/jobs/view/3/" },
    { titel: "Weg", bedrijf: "D", url: "https://d.example/4", verlopen: true },
    { titel: "Archief", bedrijf: "E", url: "https://e.example/5", nietInteressant: true },
    { titel: "Time-out", bedrijf: "F", url: "https://f.example/6" },
  ];

  const calls: string[] = [];
  const fetchFn = (async (url: string) => {
    calls.push(url);
    if (url.includes("a.example")) return new Response("<h1>Full Stack Developer</h1>", { status: 200 });
    if (url.includes("b.example")) return new Response("nope", { status: 404 });
    throw new Error("boem");
  }) as unknown as typeof fetch;

  it("controleert enkel actieve items en haalt login-bronnen niet op", async () => {
    const results = await checkLiveness(items, { fetchFn });
    expect(results.map((r) => [r.index, r.uitkomst])).toEqual([
      [0, "levend"],
      [1, "verlopen-kandidaat"],
      [2, "onbekend"],
      [5, "onbekend"],
    ]);
    expect(calls.some((u) => u.includes("linkedin"))).toBe(false);
    expect(calls.some((u) => u.includes("d.example") || u.includes("e.example"))).toBe(false);
  });

  it("zet met applyChecked enkel gecontroleerdOp bij levende items en raakt de rest niet aan", async () => {
    const results = await checkLiveness(items, { fetchFn });
    const out = applyChecked(items, results, "2026-11-06");
    expect(out[0].gecontroleerdOp).toBe("2026-11-06");
    expect(out[1]).toEqual(items[1]); // kandidaat-verlopen: geen datum, en NIET verlopen: true
    expect(out[1].verlopen).toBeUndefined();
    expect(out[2]).toEqual(items[2]); // onbekend: datum niet aangepast
    expect(out[3]).toEqual(items[3]);
    expect(out[5]).toEqual(items[5]);
  });
});

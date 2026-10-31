import "@testing-library/jest-dom";

// jsdom heeft geen matchMedia. Standaard: desktop (min-width matcht), geen touch.
// Tests die een andere weergave nodig hebben, stubben `window.matchMedia` zelf.
if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes("min-width"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    }) as MediaQueryList;
}

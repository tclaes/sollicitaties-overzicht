export const path = typeof window !== "undefined" ? window.location.pathname : "/";

export const capitalize = ([firstLetter, ...restOfString]) => firstLetter.toUpperCase() + restOfString.join("");

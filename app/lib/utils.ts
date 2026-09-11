export const path = typeof window !== "undefined" ? window.location.pathname : "/";

export const capitalizeFirstLetter = ([firstLetter, ...restOfString]: string[]) => firstLetter?.toUpperCase() + restOfString.join("");

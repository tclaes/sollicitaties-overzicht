export const path = typeof window !== "undefined" ? window.location.pathname : "/";

export const capitalizeFirstLetter = ([firstLetter, ...restOfString]: string[] | string) => firstLetter?.toUpperCase() + restOfString.join("");

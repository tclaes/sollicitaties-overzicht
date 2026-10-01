export const capitalizeFirstLetter = ([firstLetter, ...restOfString]: string[] | string) => firstLetter?.toUpperCase() + restOfString.join("");

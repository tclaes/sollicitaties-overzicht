import {createFileRoute, redirect} from "@tanstack/react-router";
import {DefaultSearchSchema} from "~/lib/schemas";

// Er zijn maar twee pagina's: Vacatures en Sollicitaties. De oude startpagina
// stuurt door naar het vacature-overzicht zodat bestaande links blijven werken.
export const Route = createFileRoute("/")({
  validateSearch: DefaultSearchSchema,
  beforeLoad: ({search}) => {
    throw redirect({to: "/vacatures", search});
  },
});

import {DESKTOP_QUERY} from "~/lib/breakpoints";
import {useMediaQuery} from "~/lib/useMediaQuery";
import {VacancyCardList} from "./VacancyCardList";
import {VacancyTable} from "./VacancyTable";

type Props = Parameters<typeof VacancyTable>[0];

/** Tabel op desktop, kaarten op telefoon en tablet. Nooit beide tegelijk renderen. */
export function VacancyList(props: Props) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  return isDesktop ? <VacancyTable {...props}/> : <VacancyCardList {...props}/>;
}

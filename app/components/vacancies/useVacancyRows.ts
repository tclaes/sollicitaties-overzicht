import {useState} from "react";
import {useNavigate, useRouter} from "@tanstack/react-router";
import type {Application, ApplicationStatus as ApplicationStatusValue, Vacancy} from "~/lib/schemas";

/**
 * Gedeelde rij-state voor de tabel- en kaartweergave van de vacaturelijst:
 * optimistische overrides voor solliciteren, favoriet en sollicitatiestatus.
 */
export function useVacancyRows(applicationById: Map<string, Application>) {
  const [locallyApplied, setLocallyApplied] = useState<Record<string, string>>({});
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>({});
  const [statusOverrides, setStatusOverrides] = useState<Record<string, ApplicationStatusValue>>({});
  const navigate = useNavigate();
  const router = useRouter();

  function getRow(v: Vacancy) {
    const application = applicationById.get(v.id);
    const localDate = locallyApplied[v.id];
    return {
      application,
      hasApplied: !!application || !!localDate,
      effectiveStatus: application ? statusOverrides[application.id] ?? application.status : null,
      date: application?.appliedOn ?? localDate,
      isFavorite: favoriteOverrides[v.id] ?? v.favorite ?? false,
    };
  }

  return {
    getRow,
    openVacancy: async (id: string) => {
      await navigate({to: `/vacatures/${id}`});
    },
    markApplied: (id: string, date: string) => setLocallyApplied((prev) => ({...prev, [id]: date})),
    setFavorite: (id: string, next: boolean) => setFavoriteOverrides((prev) => ({...prev, [id]: next})),
    changeStatus: (applicationId: string, next: ApplicationStatusValue) => {
      setStatusOverrides((prev) => ({...prev, [applicationId]: next}));
      if (next === "not_hired") void router.invalidate();
    },
  };
}

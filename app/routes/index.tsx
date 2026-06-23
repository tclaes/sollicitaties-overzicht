import {createFileRoute, useRouter} from "@tanstack/react-router";
import {z} from "zod";
import {createSollicitatie, getSollicitaties, getVacaturesDashboard} from "~/lib/vacatures";
import {VacatureTabel} from "~/components/vacatures/VacatureTabel";
import {StatsTeller} from "~/components/elements/StatsTeller";
import {FilterPills} from "~/components/elements/FilterPills";
import type {Sollicitatie} from "~/lib/schemas";
import {SourceSchema, StatusSchema} from "~/lib/schemas";
import styles from "./index.module.css";

const sortingScheme = z.enum(["match", "datum", "titel"]);

const searchSchema = z.object({
    status: StatusSchema.optional(),
    source: SourceSchema.optional(),
    sort: sortingScheme.default("match"),
});

export const Route = createFileRoute("/")({
    validateSearch: searchSchema,
    loader: async () => {
        const [overview, sollicitaties] = await Promise.all([
            getVacaturesDashboard(),
            getSollicitaties(),
        ]);
        return {overview, sollicitaties};
    },
    component: DashboardPage,
});

function DashboardPage() {
    const {overview, sollicitaties} = Route.useLoaderData();
    const search = Route.useSearch();
    const router = useRouter();

    const sollicitatiePerId = new Map<string, Sollicitatie>(
        sollicitaties.flatMap((s) => s.vacatureId ? [[s.vacatureId, s]] : [])
    );

    const matchVolgorde: Record<string, number> = {sterk: 0, goed: 1, matig: 2, laag: 3};

    const prefiltered = overview
        ? overview.filter((v) => {
            if (search.status && v.status !== search.status) return false;
            return !(search.source && v.bron !== search.source);

        })
        : [];

    const sorted = [...prefiltered].sort((a, b) => {
        if (search.sort === "datum") {
            return new Date(b.gevondenOp).getTime() - new Date(a.gevondenOp).getTime();
        }
        if (search.sort === "titel") {
            return a.titel.localeCompare(b.titel, "nl");
        }
        return (matchVolgorde[a.match?.score ?? "laag"] ?? 3) - (matchVolgorde[b.match?.score ?? "laag"] ?? 3);
    });

    async function handleSolliciteer(data: {
        vacatureId: string;
        bedrijf: string;
        rol: string;
        gesolliceerdOp: string
    }) {
        await createSollicitatie(data);
        await router.invalidate();
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.titel}>Vacatures</h1>
            </header>

            {overview ? (
                <>
                    <StatsTeller vacatures={overview}/>
                    <FilterPills currentSearch={search} basePad="/"/>
                    <VacatureTabel
                        vacatures={sorted}
                        sollicitatiePerId={sollicitatiePerId}
                        onSolliciteer={handleSolliciteer}
                    />
                </>
            ) : (
                <div className={styles.leeg}>
                    <p>Nog geen vacatures gevonden.</p>
                    <p className={styles.leegSub}>De dagelijkse taak loopt elke werkdag om 12:00.</p>
                </div>
            )}
        </div>
    );
}

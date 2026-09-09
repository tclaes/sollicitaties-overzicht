import styles from "./NotFoundComponent.module.css";

export const NotFoundComponent =
  () => (
    <div className={styles.notFound}>
      <h1>Vacature niet gevonden</h1>
      <a href="/vacatures">Terug naar overzicht</a>
    </div>
  )

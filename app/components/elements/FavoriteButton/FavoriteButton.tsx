import {useState} from "react";
import {toggleFavorite} from "~/lib/vacancies";
import styles from "./FavoriteButton.module.css";

interface Props {
  id: string;
  favorite: boolean;
  onToggled?: (favorite: boolean) => void;
}

export function FavoriteButton({id, favorite, onToggled}: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    const next = !favorite;
    setBusy(true);
    try {
      await toggleFavorite(id, next);
      onToggled?.(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={`${styles.favoriteBtn} ${favorite ? styles.active : ""}`}
      onClick={handleClick}
      disabled={busy}
      aria-pressed={favorite}
      aria-label={favorite ? "Verwijder favoriet" : "Markeer als favoriet"}
      title={favorite ? "Verwijder favoriet" : "Markeer als favoriet"}
    >
      ★
    </button>
  );
}

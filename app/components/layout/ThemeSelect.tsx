import {useRef} from "react";
import type {KeyboardEvent} from "react";
import type {ThemePreference} from "~/lib/theme";
import styles from "./ThemeSelect.module.css";

interface Props {
  value: ThemePreference;
  onChange: (value: ThemePreference) => void;
}

const OPTIONS: ReadonlyArray<{value: ThemePreference; label: string}> = [
  {value: "auto", label: "Auto"},
  {value: "light", label: "Licht"},
  {value: "dark", label: "Donker"},
];

export function ThemeSelect({value, onChange}: Props) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (step === 0) return;
    e.preventDefault();
    const next = (index + step + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div className={styles.group} role="radiogroup" aria-label="Weergave">
      {OPTIONS.map((option, index) => {
        const checked = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className={`${styles.option} ${checked ? styles.checked : ""}`}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => onKeyDown(e, index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

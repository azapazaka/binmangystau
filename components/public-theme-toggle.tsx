"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

type PublicThemeChoice = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "citypulse-public-theme";
const THEME_CHANGE_EVENT = "citypulse-public-theme-change";
const THEME_OPTIONS: ReadonlyArray<{ label: string; value: PublicThemeChoice }> = [
  { label: "Светлая", value: "light" },
  { label: "Тёмная", value: "dark" },
  { label: "Система", value: "system" },
];

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(choice: PublicThemeChoice): ResolvedTheme {
  return choice === "system" ? getSystemTheme() : choice;
}

function readChoiceSnapshot(): PublicThemeChoice {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedChoice = window.localStorage.getItem(STORAGE_KEY);
  return savedChoice === "light" || savedChoice === "dark" || savedChoice === "system"
    ? savedChoice
    : "light";
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback();
    }
  };
  const handleThemeChange = () => callback();
  const handleSystemChange = () => callback();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  mediaQuery.addEventListener("change", handleSystemChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    mediaQuery.removeEventListener("change", handleSystemChange);
  };
}

function setStoredChoice(nextChoice: PublicThemeChoice) {
  window.localStorage.setItem(STORAGE_KEY, nextChoice);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function PublicThemeToggle() {
  const choice = useSyncExternalStore<PublicThemeChoice>(
    subscribe,
    readChoiceSnapshot,
    () => "light",
  );

  useEffect(() => {
    document.body.dataset.publicTheme = resolveTheme(choice);
  }, [choice]);

  const options = useMemo(
    () => THEME_OPTIONS,
    [],
  );

  return (
    <div className="public-theme-toggle">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          data-active={choice === option.value}
          className="public-theme-toggle-button"
          onClick={() => setStoredChoice(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

import React from "react";
import {useTranslation} from 'react-i18next'

type Props = {
  className?: string
}

const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter"
];

export default function ThemeSwitcher({ className }: Props) {
  const { t } = useTranslation()
  const setTheme = (theme: string) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute("data-theme", theme);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem("theme", theme);
    }
  };

  React.useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem("theme");
    if (saved && themes.includes(saved)) {
      setTheme(saved);
    } else {
      setTheme("dark");
    }
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className || ''}`} aria-label={t('common.select_theme')}>
      <span className="hidden sm:inline-block" aria-hidden>🎨</span>
      <select
        onChange={e => setTheme(e.target.value)}
        defaultValue={(typeof localStorage !== 'undefined' && localStorage.getItem("theme")) || "dark"}
        className="select select-bordered select-xs sm:select-sm text-xs sm:text-sm"
        aria-label={t('common.select_theme')}
      >
        {themes.map(theme => (
          <option key={theme} value={theme}>
            {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

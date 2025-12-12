import React from "react";

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

export default function ThemeSwitcher() {
  const setTheme = (theme: string) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  };

  React.useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved && themes.includes(saved)) {
      setTheme(saved);
    }
  }, []);

  return (
    <select
      onChange={e => setTheme(e.target.value)}
      defaultValue={localStorage.getItem("theme") || themes[0]}
      className="select select-bordered"
      aria-label="Select Theme"
    >
      {themes.map(theme => (
        <option key={theme} value={theme}>
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </option>
      ))}
    </select>
  );
}


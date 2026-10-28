import { useCallback, useEffect, useState } from "react";

export function useTheme(defaultDark = false) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("gys-theme");
    const d = saved ? saved === "dark" : defaultDark;
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, [defaultDark]);
  const toggle = useCallback(() => {
    setDark((d) => {
      const n = !d;
      localStorage.setItem("gys-theme", n ? "dark" : "light");
      document.documentElement.classList.toggle("dark", n);
      return n;
    });
  }, []);
  return { dark, toggle };
}

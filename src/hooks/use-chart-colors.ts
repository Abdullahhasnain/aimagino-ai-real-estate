import * as React from "react";

const KEYS = ["--c1", "--c2", "--c3", "--c-grid", "--c-axis"] as const;
type Colors = { c1: string; c2: string; c3: string; grid: string; axis: string };

function read(): Colors {
  const cs = getComputedStyle(document.documentElement);
  const [c1, c2, c3, grid, axis] = KEYS.map((k) => cs.getPropertyValue(k).trim());
  return { c1: c1 || "#2f40da", c2: c2 || "#0a9480", c3: c3 || "#de2e21", grid: grid || "#e3e6f0", axis: axis || "#6b7190" };
}

/** Chart colors resolved from CSS tokens; updates when the theme changes. */
export function useChartColors() {
  const [c, setC] = React.useState<Colors>(read);
  React.useEffect(() => {
    const update = () => setC(read());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => {
      mq.removeEventListener("change", update);
      mo.disconnect();
    };
  }, []);
  return c;
}

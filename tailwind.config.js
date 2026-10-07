import animate from "tailwindcss-animate";
/** @type {import('tailwindcss').Config} */
const v = (name) => `hsl(var(--${name}) / <alpha-value>)`;
export default {
  darkMode: ["variant", ["@media (prefers-color-scheme: dark) { &:not([data-theme=light] *) }", "&:is([data-theme=dark] *)"]],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1200px" } },
    extend: {
      fontFamily: {
        sans: ["Geist", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Manrope", "Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'Geist Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        border: v("border"),
        input: v("input"),
        ring: v("ring"),
        background: v("background"),
        foreground: v("foreground"),
        surface: v("surface"),
        subtle: v("subtle"),
        primary: { DEFAULT: v("primary"), foreground: v("primary-foreground"), soft: v("primary-soft") },
        muted: { DEFAULT: v("muted"), foreground: v("muted-foreground") },
        accent: { DEFAULT: v("accent"), foreground: v("accent-foreground") },
        hot: { DEFAULT: v("hot"), soft: v("hot-soft") },
        warm: { DEFAULT: v("warm"), soft: v("warm-soft") },
        cold: { DEFAULT: v("cold"), soft: v("cold-soft") },
        success: { DEFAULT: v("success"), soft: v("success-soft") },
        danger: { DEFAULT: v("danger"), soft: v("danger-soft") },
        whatsapp: { DEFAULT: v("whatsapp"), bubble: v("wa-bubble"), ground: v("wa-ground") },
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.125rem" },
      boxShadow: {
        card: "0 1px 2px 0 hsl(var(--shadow) / 0.05), 0 1px 3px 0 hsl(var(--shadow) / 0.04)",
        lift: "0 12px 32px -12px hsl(var(--shadow) / 0.18), 0 2px 6px -2px hsl(var(--shadow) / 0.06)",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0.001", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        "typing": { "0%,80%,100%": { opacity: "0.25", transform: "translateY(0)" }, "40%": { opacity: "1", transform: "translateY(-2px)" } },
        "pulse-ring": { "0%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0.35)" }, "100%": { boxShadow: "0 0 0 10px hsl(var(--primary) / 0)" } },
        "slide-in-right": { from: { transform: "translateX(100%)" }, to: { transform: "none" } },
        "slide-in-left": { from: { transform: "translateX(-100%)" }, to: { transform: "none" } },
        "flash": { "0%": { backgroundColor: "hsl(var(--primary) / 0.14)" }, "100%": { backgroundColor: "transparent" } },
      },
      animation: {
        "fade-up": "fade-up .35s ease-out both",
        typing: "typing 1.2s infinite",
        "pulse-ring": "pulse-ring 1.4s ease-out infinite",
        "slide-in-right": "slide-in-right .25s ease-out",
        "slide-in-left": "slide-in-left .25s ease-out",
        flash: "flash 1.6s ease-out",
      },
    },
  },
  plugins: [animate],
};

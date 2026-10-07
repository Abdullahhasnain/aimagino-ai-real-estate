/**
 * Minimal hash router (no dependency). Works when the app is opened from disk,
 * served from any static host, or embedded in a sandboxed frame.
 */
import * as React from "react";

type RouterCtx = { path: string; navigate: (to: string) => void; back: () => void };
const Ctx = React.createContext<RouterCtx>({ path: "/", navigate: () => {}, back: () => {} });

function readHash() {
  try {
    const h = window.location.hash.replace(/^#/, "");
    if (h.startsWith("/")) return h;
    // Plain anchors like #demo / #leads deep-link into the app
    if (h === "demo" || h === "app") return "/app";
    if (h && /^[a-z-]+$/.test(h)) return `/app/${h}`;
  } catch {
    /* ignore */
  }
  return "/";
}

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = React.useState(readHash);
  const history = React.useRef<string[]>([]);

  React.useEffect(() => {
    const onHash = () => setPath(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = React.useCallback((to: string) => {
    setPath((cur) => {
      if (cur !== to) history.current.push(cur);
      return to;
    });
    try {
      window.history.replaceState(null, "", `#${to}`);
    } catch {
      /* sandboxed: in-memory routing still works */
    }
    const main = document.getElementById("main-scroll");
    if (main) main.scrollTop = 0;
    window.scrollTo({ top: 0 });
  }, []);

  const back = React.useCallback(() => {
    const prev = history.current.pop();
    navigate(prev ?? "/app");
    history.current.pop();
  }, [navigate]);

  return <Ctx.Provider value={{ path, navigate, back }}>{children}</Ctx.Provider>;
}

export function useRouter() {
  return React.useContext(Ctx);
}

/** Match "/app/leads/:id" style patterns. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split("/").filter(Boolean);
  const a = path.split("/").filter(Boolean);
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i]!.startsWith(":")) params[p[i]!.slice(1)] = decodeURIComponent(a[i]!);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}

export function Link({
  to,
  className,
  children,
  onClick,
  ...rest
}: { to: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { navigate } = useRouter();
  return (
    <a
      href={`#${to}`}
      className={className}
      onClick={(e) => {
        onClick?.(e);
        if (e.metaKey || e.ctrlKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

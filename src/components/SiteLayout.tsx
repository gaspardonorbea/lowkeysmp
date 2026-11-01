import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Copy, Check, Menu, Settings, X } from "lucide-react";
import logo from "@/assets/logo-smp.png.asset.json";
import { useServerIp } from "@/components/ServerExtras";
import { T } from "@/lib/cms";
import { AdminBar } from "@/components/AdminBar";

const SEASON_LINKS = [
  { to: "/seizoen-1/deelnemers", label: "Deelnemers" },
  { to: "/seizoen-1/deaths", label: "Deaths" },
  { to: "/seizoen-1/statistieken", label: "Statistieken" },
] as const;

const linkBase =
  "relative px-1 py-2 font-pixel text-sm uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground";
const linkActive = "text-primary";

function Logo() {
  return (
    <Link to="/" aria-label="LowkeySMP, naar de hoofdpagina" className="nav-logo shrink-0">
      <img
        src={logo.url}
        onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = "/logo-smp-local.png"; }}
        alt="LowkeySMP"
        className="h-10 w-28 object-contain"
      />
    </Link>
  );
}

function CopyIp({ className = "" }: { className?: string }) {
  const SERVER_IP = useServerIp();
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(SERVER_IP);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className={`btn-block !px-3 !py-1.5 text-xs ${className}`} title="Kopieer het server IP">
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span>{copied ? "Gekopieerd!" : SERVER_IP}</span>
    </button>
  );
}

function SeasonMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const inSeason = path.startsWith("/seizoen-1");

  useEffect(() => {
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={`${linkBase} inline-flex items-center gap-1 ${inSeason ? linkActive : ""}`}
      >
        <T k="nav.season" def="Seizoen 1" />
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 pt-2" role="menu">
          <div className="block-card min-w-48 p-1.5">
            {SEASON_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 font-pixel text-sm uppercase tracking-wider text-muted-foreground transition-colors after:hidden hover:bg-accent hover:text-foreground !transform-none"
                activeProps={{ className: "!text-primary" }}
              >
                <T k={`nav.${l.to}`} def={l.label} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [mobile, setMobile] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setMobile(false), [path]);

  return (
    <main>
      <nav className="site-header fixed inset-x-0 top-0 z-20 border-b border-border/80 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-2.5 sm:px-5">
          <Logo />
          <div className="site-nav hidden flex-1 items-center justify-center gap-7 md:flex">
            <Link to="/" className={linkBase} activeOptions={{ exact: true }} activeProps={{ className: linkActive }}>
              <T k="nav.home" def="Hoofdpagina" />
            </Link>
            <Link to="/aankondigingen" className={linkBase} activeProps={{ className: linkActive }}>
              <T k="nav.announcements" def="Aankondigingen" />
            </Link>
            <SeasonMenu />
          </div>
          <div className="ml-auto hidden md:block"><CopyIp /></div>
          <button
            type="button"
            className="ml-auto rounded border border-border p-2 text-foreground md:hidden"
            aria-label={mobile ? "Sluit menu" : "Open menu"}
            aria-expanded={mobile}
            onClick={() => setMobile((m) => !m)}
          >
            {mobile ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {mobile && (
          <div className="border-t border-border/80 bg-background/95 px-4 pb-4 pt-2 md:hidden">
            <div className="flex flex-col">
              <Link to="/" activeOptions={{ exact: true }} className={`${linkBase} py-3`} activeProps={{ className: linkActive }}><T k="nav.home" def="Hoofdpagina" /></Link>
              <Link to="/aankondigingen" className={`${linkBase} py-3`} activeProps={{ className: linkActive }}><T k="nav.announcements" def="Aankondigingen" /></Link>
              <p className="px-1 pb-1 pt-3 font-pixel text-xs uppercase tracking-widest text-muted-foreground/70"><T k="nav.season" def="Seizoen 1" /></p>
              {SEASON_LINKS.map((l) => (
                <Link key={l.to} to={l.to} className={`${linkBase} py-2.5 pl-4`} activeProps={{ className: linkActive }}><T k={`nav.${l.to}`} def={l.label} /></Link>
              ))}
              <CopyIp className="mt-4 self-start" />
            </div>
          </div>
        )}
      </nav>

      {children}

      <footer className="site-footer border-t-2 border-border px-5 py-10 text-center text-sm text-muted-foreground">
        <p className="font-pixel text-base text-foreground"><T k="footer.title" def="LowkeySMP · lowkey peak" /></p>
        <p className="mt-2"><T k="footer.sub" def="Gemaakt voor de crew, powered by chaos." /></p>
        <Link to="/beheer" className="btn-block btn-block-secondary mt-6 inline-flex"><Settings className="size-4" /> Beheer</Link>
      </footer>
      <AdminBar />
    </main>
  );
}

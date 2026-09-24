"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShieldCheck,
  Brain,
  BarChart3,
  CircleDollarSign,
  TrendingUp,
  Leaf,
  Syringe,
  ClipboardList,
  ClipboardPlus,
  Gauge,
  ChevronsUpDown,
  Repeat,
  LogOut,
  Lock,
  Thermometer,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { overallReadinessScore } from "@/lib/mock-data";
import { useSimulation } from "@/lib/simulation";
import { startGuidedTour } from "@/components/demo/guided-tour";
import { Tooltip } from "@/components/ui/tooltip";
import { useTenant } from "@/lib/tenant-context";
import { useRole } from "@/lib/role-context";
import { useSupplyRequests } from "@/lib/supply-requests-context";
import { NAV_SECTIONS, type NavSectionId } from "@/lib/roles";

const SECTION_ICONS: Record<NavSectionId, typeof Package> = {
  dashboard: LayoutDashboard,
  "unit-overview": ClipboardList,
  "executive-overview": Gauge,
  requests: ClipboardPlus,
  inventory: Package,
  "vaccine-management": Syringe,
  "cold-chain": Thermometer,
  "ai-insights": Brain,
  forecasting: TrendingUp,
  financials: CircleDollarSign,
  "supply-chain": BarChart3,
  compliance: ShieldCheck,
};

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();
  const { coldChainAlertCount, excursionActive } = useSimulation();
  const { openCount: openRequestCount } = useSupplyRequests();

  const sections = role ? role.navSections : [];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar-bg flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/8">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-semibold text-base tracking-tight font-display">Health Canopy</h1>
          <p className="text-sidebar-text text-[11px]">Inventory Intelligence</p>
        </div>
      </div>

      {/* Facility */}
      <div className="px-4 py-3 border-b border-white/8">
        <FacilityBadge />
      </div>

      {/* Navigation (role-driven) */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {sections.map((sectionId) => {
          const item = NAV_SECTIONS[sectionId];
          const Icon = SECTION_ICONS[sectionId];
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/25"
                  : "text-sidebar-text hover:text-white hover:bg-sidebar-hover"
              )}
            >
              <Icon className={cn("w-[18px] h-[18px]", isActive ? "text-white" : "")} />
              {item.label}
              {item.id === "ai-insights" && (
                <span className="ml-auto w-2 h-2 rounded-full bg-accent-light pulse-dot" />
              )}
              {item.id === "requests" && openRequestCount > 0 && (
                <span className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-primary/25 text-primary-light">
                  {openRequestCount}
                </span>
              )}
              {item.id === "cold-chain" && coldChainAlertCount > 0 && (
                <span
                  className={cn(
                    "ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                    excursionActive
                      ? "bg-red-500/25 text-red-300 pulse-dot"
                      : "bg-warning/20 text-warning"
                  )}
                >
                  {coldChainAlertCount}
                </span>
              )}
              {item.id === "compliance" && (
                <Tooltip content="Compliance readiness score" position="right" className="ml-auto">
                  <span className="text-[11px] font-bold bg-warning/20 text-warning px-1.5 py-0.5 rounded cursor-help">
                    {overallReadinessScore}%
                  </span>
                </Tooltip>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User / role control */}
      <div className="px-4 py-3 border-t border-white/8">
        <UserSlot />
      </div>
    </aside>
  );
}

function UserSlot() {
  const { role, logout } = useRole();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // Switch role: drop the role -> role chooser.
  function switchRole() {
    logout();
    setOpen(false);
    router.replace("/login");
  }

  // Log out: drop the role and return to the chooser.
  function logOut() {
    logout();
    setOpen(false);
    router.replace("/login");
  }

  const persona = role?.persona ?? { name: "Demo User", title: "Contra Costa Health", initials: "CC" };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 rounded-lg px-1.5 py-1.5 hover:bg-sidebar-hover transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-semibold shrink-0">
          {persona.initials}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-white text-xs font-medium truncate">{persona.name}</p>
          <p className="text-sidebar-text text-[11px] truncate">{persona.title}</p>
        </div>
        <ChevronsUpDown className="w-3.5 h-3.5 text-sidebar-text shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 bottom-full mb-2 rounded-lg bg-sidebar-bg border border-white/10 shadow-xl overflow-hidden z-50">
          {role?.readOnly && (
            <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-sidebar-text border-b border-white/8">
              <Lock className="w-3 h-3" />
              Read-only view
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              startGuidedTour();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left text-sidebar-text hover:bg-white/5 hover:text-white transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Product tour
          </button>
          <button
            type="button"
            onClick={switchRole}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left text-sidebar-text hover:bg-white/5 hover:text-white transition-colors border-t border-white/8"
          >
            <Repeat className="w-3.5 h-3.5" />
            Switch role
          </button>
          <button
            type="button"
            onClick={logOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left text-sidebar-text hover:bg-white/5 hover:text-white transition-colors border-t border-white/8"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function FacilityBadge() {
  const { tenant } = useTenant();

  return (
    <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-hover text-sm">
      <div className="w-6 h-6 rounded bg-primary/25 flex items-center justify-center text-[11px] font-bold text-primary-light shrink-0">
        {tenant.abbreviation}
      </div>
      <span className="flex-1 text-left text-xs truncate text-white">
        {tenant.name}
      </span>
    </div>
  );
}

// ============================================================
// Role-Based Access — single source of truth
// ------------------------------------------------------------
// To add a future role, add one entry to ROLES below (and, if it
// needs a new destination, one entry to NAV_SECTIONS). Nothing
// else in the app should need to change: the sidebar, route guard
// (middleware), and login page all read from this file.
//
// This module is intentionally pure data (no React / no lucide
// imports) so the Edge middleware can import it safely.
// ============================================================

export type RoleId =
  | "supply-chain-manager"
  | "nurse-unit-coordinator"
  | "executive";
// Reserved for future roles — uncomment the config stubs at the
// bottom of ROLES to activate:
//   | "audit-compliance"
//   | "pharmacy-controlled"
//   | "it-admin";

export type NavSectionId =
  | "dashboard"
  | "unit-overview"
  | "executive-overview"
  | "requests"
  | "inventory"
  | "vaccine-management"
  | "cold-chain"
  | "ai-insights"
  | "forecasting"
  | "financials"
  | "supply-chain"
  | "compliance";

export type DataScope = "system" | "unit";

export type NavSection = {
  id: NavSectionId;
  label: string;
  href: string;
};

// Every routable destination the sidebar can show. `iconKey` is
// resolved to a lucide icon inside the sidebar (kept out of here so
// this file stays React-free for the Edge runtime).
export const NAV_SECTIONS: Record<NavSectionId, NavSection> = {
  dashboard: { id: "dashboard", label: "Dashboard", href: "/" },
  "unit-overview": { id: "unit-overview", label: "My Unit", href: "/unit" },
  "executive-overview": { id: "executive-overview", label: "Executive Overview", href: "/executive" },
  requests: { id: "requests", label: "Requests", href: "/requests" },
  inventory: { id: "inventory", label: "Inventory", href: "/inventory" },
  "vaccine-management": { id: "vaccine-management", label: "Vaccine Mgmt", href: "/vaccine-management" },
  "cold-chain": { id: "cold-chain", label: "Cold Chain", href: "/cold-chain" },
  "ai-insights": { id: "ai-insights", label: "AI Insights", href: "/ai-insights" },
  forecasting: { id: "forecasting", label: "Forecasting", href: "/forecasting" },
  financials: { id: "financials", label: "Financials", href: "/budget" },
  "supply-chain": { id: "supply-chain", label: "Supply Chain", href: "/analytics" },
  compliance: { id: "compliance", label: "Compliance", href: "/compliance" },
};

export type RoleConfig = {
  id: RoleId;
  label: string;
  shortLabel: string;
  description: string;
  /** Where the user lands after signing in, and where the guard sends them if they hit a disallowed route. */
  landingRoute: string;
  /** Which nav sections/routes this role may see, in display order. */
  navSections: NavSectionId[];
  /** system-wide vs a single unit/department. */
  dataScope: DataScope;
  /** Default unit for unit-scoped roles. */
  defaultUnit?: string;
  /** Read-only personas get no mock actions and no AI Agent. */
  readOnly: boolean;
  persona: { name: string; title: string; initials: string };
};

export const ROLES: Record<RoleId, RoleConfig> = {
  // 2b — Supply Chain Manager: the operational power user / anchor.
  // Most-privileged; the baseline the other two subtract from.
  "supply-chain-manager": {
    id: "supply-chain-manager",
    label: "Supply Chain Manager",
    shortLabel: "Supply Chain",
    description: "Operational control across all sites — alerts, PAR, vendors, spend.",
    landingRoute: "/",
    navSections: [
      "dashboard",
      "inventory",
      "requests",
      "vaccine-management",
      "cold-chain",
      "ai-insights",
      "forecasting",
      "financials",
      "supply-chain",
      "compliance",
    ],
    dataScope: "system",
    readOnly: false,
    persona: { name: "Dana Whitfield", title: "Director, Supply Chain", initials: "DW" },
  },

  // 2c — Nurse / Unit Supply Coordinator: lean, point-of-use, one unit.
  "nurse-unit-coordinator": {
    id: "nurse-unit-coordinator",
    label: "Nurse / Unit Supply Coordinator",
    shortLabel: "Unit Coordinator",
    description: "Point-of-use view for a single unit — stock, alerts, deliveries.",
    landingRoute: "/unit",
    navSections: ["unit-overview", "requests", "inventory", "vaccine-management", "cold-chain"],
    dataScope: "unit",
    defaultUnit: "Med/Surg",
    readOnly: false,
    persona: { name: "Priya Raman, RN", title: "Unit Supply Coordinator", initials: "PR" },
  },

  // 2d — Executive: single high-altitude, read-only overview.
  executive: {
    id: "executive",
    label: "Executive",
    shortLabel: "Executive",
    description: "Read-only, cross-site state of the system for leadership — overview + financials.",
    landingRoute: "/executive",
    navSections: ["executive-overview", "requests", "financials"],
    dataScope: "system",
    readOnly: true,
    persona: { name: "Dr. Lena Ortiz", title: "Chief Nursing Information Officer", initials: "LO" },
  },

  // ---- Future roles (leave room; add here, nothing else) ----
  // "audit-compliance": {
  //   id: "audit-compliance", label: "Audit / Compliance", shortLabel: "Compliance",
  //   description: "Read-only compliance & audit trail across the system.",
  //   landingRoute: "/compliance", navSections: ["compliance", "vaccine-management"],
  //   dataScope: "system", readOnly: true,
  //   persona: { name: "TBD", title: "Compliance Officer", initials: "AC" },
  // },
  // "pharmacy-controlled": {
  //   id: "pharmacy-controlled", label: "Pharmacy / Controlled Substances", shortLabel: "Pharmacy",
  //   description: "Controlled-substance and pharmacy inventory scope.",
  //   landingRoute: "/inventory", navSections: ["dashboard", "inventory", "compliance"],
  //   dataScope: "system", readOnly: false,
  //   persona: { name: "TBD", title: "Pharmacy Supervisor", initials: "PH" },
  // },
  // "it-admin": {
  //   id: "it-admin", label: "IT System Admin", shortLabel: "IT Admin",
  //   description: "System configuration and integration health.",
  //   landingRoute: "/", navSections: ["dashboard", "ai-insights", "supply-chain"],
  //   dataScope: "system", readOnly: false,
  //   persona: { name: "TBD", title: "IT Systems Administrator", initials: "IT" },
  // },
};

export const ROLE_LIST: RoleConfig[] = Object.values(ROLES);

export const ROLE_COOKIE = "hc_role";

export function isRoleId(value: string | undefined | null): value is RoleId {
  return !!value && value in ROLES;
}

export function getRole(roleId: string | undefined | null): RoleConfig | null {
  return isRoleId(roleId) ? ROLES[roleId] : null;
}

/** Which nav section a pathname belongs to (longest href match wins). */
export function sectionIdForPath(pathname: string): NavSectionId | null {
  let match: NavSection | null = null;
  for (const section of Object.values(NAV_SECTIONS)) {
    const exact = pathname === section.href;
    const nested = section.href !== "/" && pathname.startsWith(section.href + "/");
    if (exact || nested) {
      if (!match || section.href.length > match.href.length) match = section;
    }
  }
  return match ? match.id : null;
}

/** Route guard predicate. Unknown (non-nav) routes are allowed; the
 *  section-owned routes are gated by the role's navSections. */
export function roleCanAccessPath(roleId: RoleId, pathname: string): boolean {
  const section = sectionIdForPath(pathname);
  if (!section) return true;
  return ROLES[roleId].navSections.includes(section);
}

// ============================================================
// Supply Requests — anyone in the system can ask for an item.
// ------------------------------------------------------------
// This is the intake side of the supply chain: a nurse, a clinic
// coordinator, or an executive can raise a request for something
// they need. Supply Chain then triages it (approve -> order ->
// fulfilled, or decline).
//
// Pure data + helpers, no React, so it can be imported anywhere.
// ============================================================

import { DEMO_NOW } from "./demo-time";
import { inventoryItems } from "./mock-data";

export type RequestUrgency = "routine" | "urgent" | "stat";

export type RequestStatus =
  | "submitted"
  | "approved"
  | "ordered"
  | "fulfilled"
  | "declined";

export type SupplyRequest = {
  id: string;
  /** Catalog item name, or free text when the requester picked "not in catalog". */
  itemName: string;
  /** Present only when the request was matched to a catalog item. */
  sku?: string;
  category: string;
  quantity: number;
  unitOfMeasure: string;
  /** Unit / department the supply is for. */
  department: string;
  urgency: RequestUrgency;
  /** ISO date (yyyy-mm-dd). */
  neededBy: string;
  requestedBy: string;
  requesterTitle: string;
  reason: string;
  status: RequestStatus;
  /** ISO datetime. */
  submittedAt: string;
  /** Triage note left by Supply Chain. */
  reviewNote?: string;
};

export const URGENCY_META: Record<
  RequestUrgency,
  { label: string; blurb: string; badge: string; dot: string }
> = {
  routine: {
    label: "Routine",
    blurb: "Next scheduled replenishment",
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
  urgent: {
    label: "Urgent",
    blurb: "Needed within 24–48 hours",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  stat: {
    label: "STAT",
    blurb: "Patient care is blocked right now",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
};

export const STATUS_META: Record<
  RequestStatus,
  { label: string; badge: string }
> = {
  submitted: { label: "Submitted", badge: "bg-blue-100 text-blue-700" },
  approved: { label: "Approved", badge: "bg-indigo-100 text-indigo-700" },
  ordered: { label: "Ordered", badge: "bg-violet-100 text-violet-700" },
  fulfilled: { label: "Fulfilled", badge: "bg-emerald-100 text-emerald-700" },
  declined: { label: "Declined", badge: "bg-slate-200 text-slate-600" },
};

/** Statuses that still need somebody to act. */
export const OPEN_STATUSES: RequestStatus[] = [
  "submitted",
  "approved",
  "ordered",
];

export const UNITS_OF_MEASURE = [
  "each",
  "box",
  "case",
  "pack",
  "vial",
  "bag",
  "tray",
];

/** Sentinel for "the thing I need isn't in the catalog". */
export const OFF_CATALOG = "__off_catalog__";

export type CatalogEntry = {
  name: string;
  sku: string;
  category: string;
  department: string;
};

/** Every stocked item, alphabetised, for the request picker. */
export const requestCatalog: CatalogEntry[] = inventoryItems
  .map((i) => ({
    name: i.name,
    sku: i.sku,
    category: i.category,
    department: i.department,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** Distinct units/departments a request can be raised for. */
export const requestDepartments: string[] = Array.from(
  new Set(inventoryItems.map((i) => i.department))
).sort();

// ---- Seed data -------------------------------------------------
// Anchored to DEMO_NOW so the queue reads as "this week".

function isoDaysFromNow(days: number): string {
  const d = new Date(DEMO_NOW);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoHoursAgo(hours: number): string {
  const d = new Date(DEMO_NOW);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export const seedRequests: SupplyRequest[] = [
  {
    id: "REQ-1048",
    itemName: "N95 Respirator Masks",
    sku: "PPE-MSK-N95",
    category: "PPE",
    quantity: 6,
    unitOfMeasure: "case",
    department: "Emergency Department",
    urgency: "urgent",
    neededBy: isoDaysFromNow(1),
    requestedBy: "Marcus Bell, RN",
    requesterTitle: "Charge Nurse, ED",
    reason:
      "Respiratory surge overnight — we burned through the unit par and the backup bin is empty.",
    status: "submitted",
    submittedAt: isoHoursAgo(3),
  },
  {
    id: "REQ-1047",
    itemName: "IV Catheter 20G",
    sku: "SUP-IVC-20G",
    category: "Supplies",
    quantity: 400,
    unitOfMeasure: "each",
    department: "Med/Surg",
    urgency: "routine",
    neededBy: isoDaysFromNow(6),
    requestedBy: "Priya Raman, RN",
    requesterTitle: "Unit Supply Coordinator",
    reason: "Running about 25% under par after a heavier-than-usual week.",
    status: "approved",
    submittedAt: isoHoursAgo(27),
    reviewNote: "Approved — folding into the Thursday Medline order.",
  },
  {
    id: "REQ-1046",
    itemName: "Pediatric blood pressure cuffs (infant size)",
    category: "Uncategorised",
    quantity: 12,
    unitOfMeasure: "each",
    department: "Labor & Delivery",
    urgency: "routine",
    neededBy: isoDaysFromNow(10),
    requestedBy: "Ana Delgado, RN",
    requesterTitle: "Nurse Manager, L&D",
    reason:
      "Not something we stock today. We are borrowing from CCRMC every week and it is not sustainable.",
    status: "submitted",
    submittedAt: isoHoursAgo(31),
  },
  {
    id: "REQ-1045",
    itemName: "Heparin Sodium 5000U/mL",
    sku: "RX-HEP-5000",
    category: "Medication",
    quantity: 200,
    unitOfMeasure: "vial",
    department: "Pharmacy",
    urgency: "stat",
    neededBy: isoDaysFromNow(0),
    requestedBy: "Tom Nakashima, PharmD",
    requesterTitle: "Pharmacy Supervisor",
    reason: "Stock is below the reorder point and two drips are scheduled today.",
    status: "ordered",
    submittedAt: isoHoursAgo(49),
    reviewNote: "Expedited with Pfizer — courier delivery promised by 4pm.",
  },
  {
    id: "REQ-1044",
    itemName: "Sterile Surgical Gown (L)",
    sku: "PPE-GWN-STR-L",
    category: "PPE",
    quantity: 8,
    unitOfMeasure: "case",
    department: "Operating Rooms",
    urgency: "urgent",
    neededBy: isoDaysFromNow(-1),
    requestedBy: "Dana Whitfield",
    requesterTitle: "Director, Supply Chain",
    reason: "Rebuilding the OR buffer ahead of next week's ortho block.",
    status: "fulfilled",
    submittedAt: isoHoursAgo(72),
    reviewNote: "Delivered and put away by Materials Management.",
  },
  {
    id: "REQ-1043",
    itemName: "Standing desk converter",
    category: "Uncategorised",
    quantity: 1,
    unitOfMeasure: "each",
    department: "Materials Management",
    urgency: "routine",
    neededBy: isoDaysFromNow(14),
    requestedBy: "J. Ruiz",
    requesterTitle: "Inventory Clerk",
    reason: "Back pain during long receiving shifts.",
    status: "declined",
    submittedAt: isoHoursAgo(96),
    reviewNote:
      "Not a clinical supply — routed to Facilities as an ergonomics ticket.",
  },
];

/** Next sequential id given the requests already in play. */
export function nextRequestId(existing: SupplyRequest[]): string {
  const highest = existing.reduce((max, r) => {
    const n = Number.parseInt(r.id.replace(/\D/g, ""), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 1000);
  return `REQ-${highest + 1}`;
}

/** Sort newest-submitted first, but always float open work above closed. */
export function sortRequests(list: SupplyRequest[]): SupplyRequest[] {
  return [...list].sort((a, b) => {
    const aOpen = OPEN_STATUSES.includes(a.status) ? 0 : 1;
    const bOpen = OPEN_STATUSES.includes(b.status) ? 0 : 1;
    if (aOpen !== bOpen) return aOpen - bOpen;
    return b.submittedAt.localeCompare(a.submittedAt);
  });
}

/** "3 hours ago" style, measured against the frozen demo clock. */
export function relativeToDemoNow(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.round((DEMO_NOW.getTime() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

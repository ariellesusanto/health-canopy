"use client";

import { useMemo, useState } from "react";
import {
  ClipboardPlus,
  Inbox,
  CheckCircle2,
  Zap,
  Send,
  PackageCheck,
  Truck,
  XCircle,
  ChevronDown,
  Info,
  RotateCcw,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useTenant } from "@/lib/tenant-context";
import { useRole } from "@/lib/role-context";
import { useSupplyRequests } from "@/lib/supply-requests-context";
import { DEMO_NOW, formatDemoDate } from "@/lib/demo-time";
import {
  OFF_CATALOG,
  OPEN_STATUSES,
  STATUS_META,
  UNITS_OF_MEASURE,
  URGENCY_META,
  relativeToDemoNow,
  requestCatalog,
  requestDepartments,
  type RequestUrgency,
  type SupplyRequest,
} from "@/lib/supply-requests";

const URGENCY_ORDER: RequestUrgency[] = ["routine", "urgent", "stat"];

type Filter = "open" | "mine" | "all";

function defaultNeededBy(): string {
  const d = new Date(DEMO_NOW);
  d.setDate(d.getDate() + 3);
  return d.toISOString().slice(0, 10);
}

export default function RequestsPage() {
  const { showToast } = useToast();
  const { tenant } = useTenant();
  const { role, unit } = useRole();
  const { requests, submitRequest, setStatus, resetRequests } = useSupplyRequests();

  // Supply Chain triages the queue. Everyone else can raise a request
  // and watch it move, which is the whole point of this page.
  const canTriage = !!role && !role.readOnly && role.dataScope === "system";

  // ---- form state ----
  const [catalogChoice, setCatalogChoice] = useState<string>("");
  const [customItem, setCustomItem] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitOfMeasure, setUnitOfMeasure] = useState("each");
  // null means "the requester has not edited this yet", so it keeps
  // tracking the role/unit defaults as they resolve on the client.
  const [departmentInput, setDepartmentInput] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<RequestUrgency>("routine");
  const [neededBy, setNeededBy] = useState(defaultNeededBy);
  const [requestedByInput, setRequestedByInput] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("open");

  // Identity and unit are derived, not copied into state by an effect:
  // the role resolves on the client and these follow it until edited.
  const defaultDepartment =
    unit && requestDepartments.includes(unit) ? unit : requestDepartments[0] ?? "";
  const department = departmentInput ?? defaultDepartment;
  const requestedBy = requestedByInput ?? role?.persona.name ?? "";

  const offCatalog = catalogChoice === OFF_CATALOG;
  const selectedEntry = useMemo(
    () => requestCatalog.find((c) => c.sku === catalogChoice) ?? null,
    [catalogChoice]
  );

  const myName = role?.persona.name ?? "";
  const counts = useMemo(
    () => ({
      open: requests.filter((r) => OPEN_STATUSES.includes(r.status)).length,
      awaiting: requests.filter((r) => r.status === "submitted").length,
      pressing: requests.filter(
        (r) =>
          OPEN_STATUSES.includes(r.status) &&
          (r.urgency === "stat" || r.urgency === "urgent")
      ).length,
      fulfilled: requests.filter((r) => r.status === "fulfilled").length,
    }),
    [requests]
  );

  const visible = useMemo(() => {
    if (filter === "open") return requests.filter((r) => OPEN_STATUSES.includes(r.status));
    if (filter === "mine") return requests.filter((r) => r.requestedBy === myName);
    return requests;
  }, [requests, filter, myName]);

  function resetForm() {
    setCatalogChoice("");
    setCustomItem("");
    setQuantity("1");
    setUnitOfMeasure("each");
    setUrgency("routine");
    setNeededBy(defaultNeededBy());
    setReason("");
    setErrors({});
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const itemName = offCatalog ? customItem.trim() : selectedEntry?.name ?? "";
    const qty = Number.parseInt(quantity, 10);
    const next: Record<string, string> = {};

    if (!catalogChoice) next.item = "Pick an item, or choose “Something else”.";
    else if (offCatalog && !itemName) next.item = "Describe what you need.";
    if (!Number.isFinite(qty) || qty < 1) next.quantity = "Enter a quantity of 1 or more.";
    if (!department) next.department = "Choose the unit this is for.";
    if (!requestedBy.trim()) next.requestedBy = "Add your name so Supply Chain can follow up.";
    if (!reason.trim()) next.reason = "A sentence on why you need it speeds up triage.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const created = submitRequest({
      itemName,
      sku: selectedEntry?.sku,
      category: selectedEntry?.category ?? "Uncategorised",
      quantity: qty,
      unitOfMeasure,
      department,
      urgency,
      neededBy,
      requestedBy: requestedBy.trim(),
      requesterTitle: role?.persona.title ?? "Staff",
      reason: reason.trim(),
    });

    setJustCreated(created.id);
    setFilter("open");
    resetForm();
    showToast(`${created.id} sent to Supply Chain — ${itemName}`, "success");
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Requests"
        subtitle={`${tenant.shortName} — ask for an item or supply`}
      />

      <div className="p-4 md:p-8 max-w-6xl space-y-6">
        {/* Who this is for */}
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            Anyone at {tenant.shortName} can raise a request here — nurses, clinic
            staff, pharmacy, or leadership. Supply Chain triages the queue and
            moves each one through approved, ordered, and fulfilled.
          </p>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Open Requests", value: counts.open, icon: Inbox, color: "text-primary bg-primary/10" },
            { label: "Awaiting Triage", value: counts.awaiting, icon: ClipboardPlus, color: "text-blue-600 bg-blue-50" },
            { label: "Urgent or STAT", value: counts.pressing, icon: Zap, color: "text-amber-600 bg-amber-50" },
            { label: "Fulfilled", value: counts.fulfilled, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", s.color)}><s.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-6 items-start">
          {/* ---- Request form ---- */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-border p-5 space-y-4"
          >
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ClipboardPlus className="w-4 h-4 text-primary" />
                Request an item
              </h3>
              <p className="text-[11px] text-muted mt-1">
                Takes about thirty seconds. You will see it appear in the queue.
              </p>
            </div>

            {/* Item */}
            <Field label="What do you need?" error={errors.item}>
              <SelectShell>
                <select
                  value={catalogChoice}
                  onChange={(e) => setCatalogChoice(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select an item&hellip;</option>
                  {requestCatalog.map((c) => (
                    <option key={c.sku} value={c.sku}>
                      {c.name}
                    </option>
                  ))}
                  <option value={OFF_CATALOG}>Something else (not stocked)</option>
                </select>
              </SelectShell>
              {offCatalog && (
                <input
                  type="text"
                  value={customItem}
                  onChange={(e) => setCustomItem(e.target.value)}
                  placeholder="Describe the item — brand, size, model"
                  className={cn(inputClass, "mt-2")}
                />
              )}
              {selectedEntry && (
                <p className="text-[11px] text-muted mt-1.5">
                  {selectedEntry.category} &middot; SKU {selectedEntry.sku} &middot; usually held
                  by {selectedEntry.department}
                </p>
              )}
            </Field>

            {/* Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="How many" error={errors.quantity}>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Unit">
                <SelectShell>
                  <select
                    value={unitOfMeasure}
                    onChange={(e) => setUnitOfMeasure(e.target.value)}
                    className={selectClass}
                  >
                    {UNITS_OF_MEASURE.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </SelectShell>
              </Field>
            </div>

            {/* Department */}
            <Field label="Which unit is it for?" error={errors.department}>
              <SelectShell>
                <select
                  value={department}
                  onChange={(e) => setDepartmentInput(e.target.value)}
                  className={selectClass}
                >
                  {requestDepartments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </SelectShell>
            </Field>

            {/* Urgency */}
            <Field label="How urgent is it?">
              <div className="grid grid-cols-3 gap-2">
                {URGENCY_ORDER.map((u) => {
                  const meta = URGENCY_META[u];
                  const active = urgency === u;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUrgency(u)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-left transition-all",
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
                        <span className="text-[11px] font-semibold text-foreground">
                          {meta.label}
                        </span>
                      </span>
                      <span className="block text-[10px] text-muted mt-0.5 leading-tight">
                        {meta.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Needed by + requester */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Needed by">
                <input
                  type="date"
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Your name" error={errors.requestedBy}>
                <input
                  type="text"
                  value={requestedBy}
                  onChange={(e) => setRequestedByInput(e.target.value)}
                  placeholder="First and last name"
                  className={inputClass}
                />
              </Field>
            </div>

            {/* Reason */}
            <Field label="Why do you need it?" error={errors.reason}>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="What ran out, what it is blocking, anything Supply Chain should know."
                className={cn(inputClass, "resize-none")}
              />
            </Field>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              <Send className="w-4 h-4" />
              Submit request
            </button>
            <p className="text-[10px] text-muted text-center">
              Demo prototype &mdash; requests stay in your browser and no real order is placed.
            </p>
          </form>

          {/* ---- Queue ---- */}
          <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Inbox className="w-4 h-4 text-accent" />
                Request queue
              </h3>
              <div className="flex items-center gap-1 rounded-lg bg-background p-0.5">
                {([
                  ["open", "Open"],
                  ["mine", "Mine"],
                  ["all", "All"],
                ] as [Filter, string][]).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFilter(id)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                      filter === id
                        ? "bg-white text-foreground shadow-sm"
                        : "text-muted hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <p className="text-xs text-muted py-10 text-center">
                {filter === "mine"
                  ? "You have not raised a request yet. Use the form to send one."
                  : "Nothing in the queue right now."}
              </p>
            ) : (
              <div className="space-y-3">
                {visible.map((r) => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    highlight={r.id === justCreated}
                    canTriage={canTriage}
                    onStatus={setStatus}
                    onNotify={showToast}
                  />
                ))}
              </div>
            )}

            {canTriage && (
              <button
                type="button"
                onClick={() => {
                  resetRequests();
                  setJustCreated(null);
                  showToast("Request queue reset to the demo baseline", "info");
                }}
                className="mt-4 flex items-center gap-1 text-[10px] text-muted hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset demo queue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- pieces -----------------------------------------------------

const inputClass =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted/70 focus:border-primary focus:outline-none";

const selectClass =
  "w-full appearance-none rounded-lg border border-border bg-white pl-3 pr-9 py-2 text-sm text-foreground focus:border-primary focus:outline-none cursor-pointer";

function SelectShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function RequestCard({
  request: r,
  highlight,
  canTriage,
  onStatus,
  onNotify,
}: {
  request: SupplyRequest;
  highlight: boolean;
  canTriage: boolean;
  onStatus: (id: string, status: SupplyRequest["status"], note?: string) => void;
  onNotify: (message: string, type?: "success" | "warning" | "info") => void;
}) {
  const urgency = URGENCY_META[r.urgency];
  const status = STATUS_META[r.status];

  return (
    <div
      className={cn(
        "rounded-lg border p-3.5 transition-colors",
        highlight ? "border-primary bg-primary/5" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{r.itemName}</p>
          <p className="text-[11px] text-muted mt-0.5">
            {r.quantity.toLocaleString()} {r.unitOfMeasure} &middot; {r.department}
            {r.sku ? ` · ${r.sku}` : " · not stocked today"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", urgency.badge)}>
            {urgency.label}
          </span>
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", status.badge)}>
            {status.label}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-foreground/80 mt-2 leading-relaxed">{r.reason}</p>

      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-2 text-[10px] text-muted">
        <span className="font-mono">{r.id}</span>
        <span>&middot;</span>
        <span>{r.requestedBy}, {r.requesterTitle}</span>
        <span>&middot;</span>
        <span>{relativeToDemoNow(r.submittedAt)}</span>
        <span>&middot;</span>
        <span>needed by {formatDemoDate(r.neededBy)}</span>
      </div>

      {r.reviewNote && (
        <p className="text-[11px] text-foreground/70 mt-2 pl-2.5 border-l-2 border-border italic">
          {r.reviewNote}
        </p>
      )}

      {canTriage && (
        <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-border">
          {r.status === "submitted" && (
            <>
              <TriageButton
                icon={CheckCircle2}
                label="Approve"
                tone="text-primary hover:text-primary-dark"
                onClick={() => {
                  onStatus(r.id, "approved", "Approved by Supply Chain.");
                  onNotify(`${r.id} approved`, "success");
                }}
              />
              <TriageButton
                icon={XCircle}
                label="Decline"
                tone="text-muted hover:text-foreground"
                onClick={() => {
                  onStatus(r.id, "declined", "Declined by Supply Chain.");
                  onNotify(`${r.id} declined`, "info");
                }}
              />
            </>
          )}
          {r.status === "approved" && (
            <TriageButton
              icon={Truck}
              label="Mark ordered"
              tone="text-primary hover:text-primary-dark"
              onClick={() => {
                onStatus(r.id, "ordered", "Purchase order raised with the supplier.");
                onNotify(`${r.id} marked ordered`, "success");
              }}
            />
          )}
          {r.status === "ordered" && (
            <TriageButton
              icon={PackageCheck}
              label="Mark fulfilled"
              tone="text-accent hover:text-accent-light"
              onClick={() => {
                onStatus(r.id, "fulfilled", "Delivered to the unit.");
                onNotify(`${r.id} marked fulfilled`, "success");
              }}
            />
          )}
          {(r.status === "fulfilled" || r.status === "declined") && (
            <span className="text-[10px] text-muted">Closed &mdash; no action needed.</span>
          )}
        </div>
      )}
    </div>
  );
}

function TriageButton({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: typeof CheckCircle2;
  label: string;
  tone: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex items-center gap-1 text-[11px] font-medium transition-colors", tone)}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}

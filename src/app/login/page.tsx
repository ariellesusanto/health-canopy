"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Leaf, ChevronDown, ArrowRight } from "lucide-react";
import { useRole } from "@/lib/role-context";
import { ROLE_LIST, type RoleId } from "@/lib/roles";

// The only gate in this demo: pick which role to enter as.
export default function RoleChooserPage() {
  const router = useRouter();
  const { setRole } = useRole();
  const [roleId, setRoleId] = useState<RoleId>(ROLE_LIST[0].id);

  const selected = ROLE_LIST.find((r) => r.id === roleId)!;
  const greetingName = "there";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRole(roleId);
    router.replace(selected.landingRoute);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-card rounded-2xl border border-border shadow-xl p-8 card-enter">
          {/* Brand */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground font-display">Health Canopy</h1>
            <p className="text-sm text-muted mt-1">Welcome, {greetingName} — choose your role</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Continue as</label>
              <div className="relative">
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value as RoleId)}
                  className="w-full appearance-none pl-3 pr-9 py-2.5 rounded-lg border border-border bg-white text-sm text-foreground focus:border-primary focus:outline-none cursor-pointer"
                >
                  {ROLE_LIST.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              </div>
              <p className="text-[11px] text-muted mt-1.5 leading-snug">{selected.description}</p>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              Enter dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6">
            <p className="text-[11px] text-muted">Contra Costa Health · demo · synthetic data</p>
          </div>
        </div>
      </div>
    </div>
  );
}

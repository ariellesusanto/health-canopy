"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { AIAssistant } from "@/components/chat/ai-assistant";
import { DemoDirector } from "@/components/demo/demo-director";
import { GuidedTour } from "@/components/demo/guided-tour";
import { useRole } from "@/lib/role-context";

// Decides whether to show the app chrome (sidebar + AI Agent).
// The login page is chromeless; the read-only Executive persona gets
// no interactive AI Agent.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role } = useRole();

  // The role chooser is chromeless.
  const chromeless =
    pathname === "/login" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up");

  if (chromeless) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen bg-background">{children}</main>
      {role && <AIAssistant />}
      <DemoDirector />
      <GuidedTour />
    </>
  );
}

import type { Metadata } from "next";
import { Outfit, Fraunces, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { TenantProvider } from "@/lib/tenant-context";
import { RoleProvider } from "@/lib/role-context";
import { SimulationProvider } from "@/lib/simulation";
import { SupplyRequestsProvider } from "@/lib/supply-requests-context";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Health Canopy — AI-Powered Hospital Inventory Intelligence",
  description:
    "Next-generation hospital inventory management with AI-powered demand forecasting, Joint Commission compliance engine, and stakeholder-specific workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
        <body
          className={`${outfit.variable} ${fraunces.variable} ${geistMono.variable} antialiased`}
        >
          <RoleProvider>
            <TenantProvider>
              <ToastProvider>
                <SimulationProvider>
                  <SupplyRequestsProvider>
                    <AppShell>{children}</AppShell>
                  </SupplyRequestsProvider>
                </SimulationProvider>
              </ToastProvider>
            </TenantProvider>
          </RoleProvider>
        </body>
      </html>
  );
}

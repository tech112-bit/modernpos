import type { Metadata } from "next";
import "./globals.css";
import "@/lib/cache-globals"; // Initialize global cache functions
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";

export const metadata: Metadata = {
  title: "Modern POS System",
  description: "A modern, mobile-first Point of Sale system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthErrorBoundary>
          <AuthProvider>
            <NotificationProvider>
              <CurrencyProvider>
                <SettingsProvider>
                  {children}
                </SettingsProvider>
              </CurrencyProvider>
            </NotificationProvider>
          </AuthProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}

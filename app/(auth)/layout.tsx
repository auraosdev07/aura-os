/**
 * app/(auth)/layout.tsx
 *
 * Layout for unauthenticated routes (login).
 * Renders a centred, full-screen shell with no sidebar or topbar.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s · Aura OS",
    default: "Sign In · Aura OS",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {children}
    </div>
  );
}

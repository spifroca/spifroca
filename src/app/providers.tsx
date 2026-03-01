"use client";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { fontFamily: "Segoe UI, sans-serif", fontSize: 13 },
          success: { iconTheme: { primary: "#c0392b", secondary: "#fff" } },
        }}
      />
    </SessionProvider>
  );
}

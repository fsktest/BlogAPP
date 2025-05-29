"use client";

import { CookiesProvider } from "react-cookie";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import React from "react";
import { ThemeProvider } from "./ThemeProvider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CookiesProvider>
      <AuthProvider>
        <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
        <Toaster />
      </AuthProvider>
    </CookiesProvider>
  );
}

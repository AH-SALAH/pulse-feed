"use client";

import { ThemeProvider as NextThemesProvider } from "@teispace/next-themes";
import { type ComponentProps, type ReactNode } from "react";

export type ThemeProviderProps = ComponentProps<typeof NextThemesProvider> & {
  children: ReactNode;
};

export function ThemeProvider({
  children,
  attribute = "data-theme",
  defaultTheme = "dark",
  enableSystem = true,
  ...rest
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={true}
      {...rest}
    >
      {children}
    </NextThemesProvider>
  );
}

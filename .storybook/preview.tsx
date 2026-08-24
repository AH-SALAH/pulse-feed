import type { Preview } from "@storybook/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { NextNavigationDecorator } from "./next-router-mock";
import { createI18n } from "../lib/i18n/config";
import { defaultLocale } from "../lib/i18n/settings";
import "../app/globals.css";

const i18n = createI18n(defaultLocale);

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "var(--color-background)" },
        { name: "light", value: "var(--color-background)" },
      ],
    },
  },
  decorators: [
    NextNavigationDecorator(),
    (Story, context) => {
      const theme = context.globals.theme ?? "dark";
      return (
        <ThemeProvider
          attribute="data-theme"
          defaultTheme={theme}
          enableSystem={false}
        >
          <I18nextProvider i18n={i18n}>
            <div className="p-4 min-h-[200px]">
              <Story />
            </div>
          </I18nextProvider>
        </ThemeProvider>
      );
    },
  ],
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "dark",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["dark", "light"],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;

/**
 * Centralized mock for next/navigation hooks in Storybook.
 *
 * Usage in a story file:
 *   import { NextNavigationDecorator } from "../../.storybook/next-router-mock";
 *
 *   export const Default: Story = {
 *     decorators: [NextNavigationDecorator({ pathname: "/en/settings" })],
 *   };
 *
 * Usage globally in preview.tsx (already registered there).
 */
import React from "react";
import type { Decorator, StoryContext } from "@storybook/react";
import { fn } from "storybook/test";
import {
  usePathname,
  useParams,
  useRouter,
  useSearchParams,
  ReadonlyURLSearchParams
} from "@storybook/nextjs/navigation.mock";

interface RouterMockOptions {
  /** Default value returned by usePathname(). Defaults to "/en/board". */
  pathname?: string;
  /** Default value returned by useParams(). Defaults to { locale: "en" }. */
  params?: Record<string, string>;
  /** Default value returned by useSearchParams(). Defaults to empty URLSearchParams. */
  searchParams?: Record<string, string>;
}

/**
 * Creates a Storybook decorator that configures default mock return values
 * for the next/navigation hooks.  Per-story overrides are supported.
 */
export function NextNavigationDecorator(
  options: RouterMockOptions = {},
): Decorator {
  const DecoratorComponent = (Story: React.ComponentType, context: StoryContext) => {
    const {
      pathname = "/en/board",
      params = { locale: "en" },
      searchParams = {},
    } = options;

    // Allow story-level overrides via parameters.nextNavigation
    const navParams = (context.parameters as Record<string, unknown>)
      ?.nextNavigation as RouterMockOptions | undefined;

    const resolvedPathname = navParams?.pathname ?? pathname;
    const resolvedParams = navParams?.params ?? params;
    const resolvedSearchParams = navParams?.searchParams ?? searchParams;

    // Set up mock return values
    usePathname.mockReturnValue(resolvedPathname);
    useParams.mockReturnValue(resolvedParams);
    useRouter.mockReturnValue({
      push: fn(),
      replace: fn(),
      back: fn(),
      forward: fn(),
      prefetch: fn().mockResolvedValue(undefined),
      refresh: fn(),
    });
    useSearchParams.mockReturnValue(
      new URLSearchParams(resolvedSearchParams) as unknown as ReadonlyURLSearchParams,
    );

    return <Story />;
  };

  DecoratorComponent.displayName = "NextNavigationDecorator";
  return DecoratorComponent;
}

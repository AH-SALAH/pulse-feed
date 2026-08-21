import type { Meta, StoryObj } from "@storybook/react";
import ExplainButton from "./ExplainButton";

const meta: Meta<typeof ExplainButton> = {
  title: "Widget/ExplainButton",
  component: ExplainButton,
  args: { symbol: "SOLUSDT", isExplainLoading: false },
  decorators: [
    (Story) => (
      <div className="flex min-h-[24rem] items-center justify-center">
        <div className="relative flex h-64 w-80 flex-col justify-end rounded-2xl border border-outline-variant/20 bg-surface-container px-6 py-4">
          <div className="relative w-full">
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ExplainButton>;

export const Idle: Story = {
  args: { initialState: { status: "idle" } },
};

export const Loading: Story = {
  args: {
    initialState: { status: "loading" },
  },
};

export const Success: Story = {
  args: {
    initialState: {
      status: "success",
      summary:
        "Solana has been trading almost completely flat, ending the period virtually unchanged from where it started. The price has been chopping sideways in a tight range between roughly $87.30 and $87.65 without a clear direction. This suggests the market is pausing and waiting for a catalyst to make the next big move.",
    },
  },
};

export const Unavailable: Story = {
  args: {
    initialState: { status: "unavailable", resetsAt: "2026-08-20T00:00:00.000Z" },
  },
};

export const Error: Story = {
  args: {
    initialState: {
      status: "error",
      errorKey: "error",
    },
  },
};
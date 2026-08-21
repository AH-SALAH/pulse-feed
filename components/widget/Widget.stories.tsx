import type { Meta, StoryObj } from "@storybook/react";
import Widget from "./Widget";

const meta: Meta<typeof Widget> = {
  title: "Widget/Widget",
  component: Widget,
  parameters: {
    layout: "centered",
  },
};

export default meta;

type Story = StoryObj<typeof Widget>;

export const Bitcoin: Story = {
  args: { symbol: "BTCUSDT" },
};

export const Ethereum: Story = {
  args: { symbol: "ETHUSDT" },
};

export const Solana: Story = {
  args: { symbol: "SOLUSDT" },
};
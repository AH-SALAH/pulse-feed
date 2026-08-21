import type { Meta, StoryObj } from "@storybook/react";
import Sparkline from "./Sparkline";

const meta: Meta<typeof Sparkline> = {
  title: "Widget/Sparkline",
  component: Sparkline,
};

export default meta;

type Story = StoryObj<typeof Sparkline>;

export const Empty: Story = {
  args: { data: [] },
};

export const Rising: Story = {
  args: {
    data: [100, 102, 101, 105, 108, 107, 111, 115],
  },
};

export const Falling: Story = {
  args: {
    data: [120, 117, 119, 113, 110, 108, 105, 101],
  },
};

export const Flat: Story = {
  args: {
    data: [100, 100, 100, 100, 100],
  },
};
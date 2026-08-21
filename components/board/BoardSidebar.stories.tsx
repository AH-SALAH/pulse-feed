import type { Meta, StoryObj } from "@storybook/react";
import { BoardSidebar } from "./BoardSidebar";
import { I18nProvider } from "@/components/providers/I18nProvider";

function SidebarFixture() {
  return (
    <I18nProvider locale="en">
      <BoardSidebar locale="en" />
    </I18nProvider>
  );
}

const meta: Meta<typeof BoardSidebar> = {
  title: "Board/BoardSidebar",
  component: BoardSidebar,
  parameters: {
    layout: "fullscreen",
    nextNavigation: {
      pathname: "/en/board",
    },
    viewport: {
      defaultViewport: "lg",
      viewports: {
        lg: {
          name: "Large (1280)",
          styles: { width: "1280px", height: "800px" },
        },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof BoardSidebar>;

export const Default: Story = {
  render: () => <SidebarFixture />,
};
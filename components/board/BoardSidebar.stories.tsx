import type { Meta, StoryObj } from "@storybook/react";
import { usePathname } from "next/navigation";
import { BoardSidebar } from "./BoardSidebar";
import { I18nProvider } from "@/components/providers/I18nProvider";

const mockPathname = usePathname as unknown as {
  mockReturnValue?: (value: string) => void;
};
mockPathname.mockReturnValue?.("/en/board");

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
  },
};

export default meta;

type Story = StoryObj<typeof BoardSidebar>;

export const Default: Story = {
  render: () => <SidebarFixture />,
};
import type { Meta, StoryObj } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MarketDataProvider } from "../market-data/MarketDataProvider";
import Board from "./Board";
import type { WidgetDTO } from "@/lib/boards/types";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const fakeProvider = {
  connect: () => {},
  subscribe: () => () => {},
  disconnect: () => {},
  connectionState: "connected" as const,
};

function makeWidgets(count: number): WidgetDTO[] {
  const symbols = [
    "BTCUSDT",
    "ETHUSDT",
    "SOLUSDT",
    "BNBUSDT",
    "ADAUSDT",
    "DOGEUSDT",
    "XRPUSDT",
    "LINKUSDT",
  ];
  return symbols.slice(0, count).map((symbol, position) => ({
    id: `widget_${symbol.toLowerCase()}`,
    symbol,
    position,
  }));
}

function BoardFixture({
  widgets,
  editable = false,
}: {
  widgets: WidgetDTO[];
  editable?: boolean;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <MarketDataProvider symbols={widgets.map((w) => w.symbol)} provider={fakeProvider}>
        <Board widgets={widgets} editable={editable} />
      </MarketDataProvider>
    </QueryClientProvider>
  );
}

const meta: Meta<typeof Board> = {
  title: "Board/Board",
  component: Board,
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof Board>;

export const EmptyEditable: Story = {
  render: () => <BoardFixture widgets={[]} editable />,
};

export const WithWidgetsEditable: Story = {
  render: () => <BoardFixture widgets={makeWidgets(4)} editable />,
};

export const FullEditable: Story = {
  render: () => <BoardFixture widgets={makeWidgets(8)} editable />,
};

export const ReadOnly: Story = {
  render: () => <BoardFixture widgets={makeWidgets(4)} />,
};
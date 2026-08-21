export interface WidgetDTO {
  id: string;
  symbol: string;
  position: number;
  lastKnownPrice?: number;
  lastKnownChangePct?: number;
}

export interface BoardDTO {
  id: string;
  name: string;
  widgets: WidgetDTO[];
}
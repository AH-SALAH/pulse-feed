export type BoardErrorCode =
  | "BOARD_NOT_FOUND"
  | "WIDGET_NOT_FOUND"
  | "FORBIDDEN"
  | "WIDGET_CAP"
  | "INVALID_ORDER";

const STATUS: Record<BoardErrorCode, number> = {
  BOARD_NOT_FOUND: 404,
  WIDGET_NOT_FOUND: 404,
  FORBIDDEN: 403,
  WIDGET_CAP: 409,
  INVALID_ORDER: 422,
};

export class BoardError extends Error {
  readonly code: BoardErrorCode;
  readonly status: number;

  constructor(code: BoardErrorCode, message: string) {
    super(message);
    this.name = "BoardError";
    this.code = code;
    this.status = STATUS[code];
  }
}
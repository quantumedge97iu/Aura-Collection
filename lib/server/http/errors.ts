export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export function mapDbError(error: unknown): unknown {
  if (error instanceof AppError) return error;
  const pg = error as { code?: string; message?: string };
  const message = pg.message ?? "";
  if (message.includes("insufficient_stock")) return new AppError(409, "insufficient_stock", "That piece is no longer available.");
  if (message.includes("cart not accessible") || message.includes("not allowed") || message.includes("requires admin")) {
    return new AppError(403, "forbidden", "You cannot do that.");
  }
  if (message.includes("coupon")) return new AppError(422, "coupon_rejected", "That coupon cannot be applied.");
  if (message.includes("cart is empty")) return new AppError(422, "cart_empty", "Your cart is empty.");
  if (message.includes("unavailable item")) return new AppError(409, "unavailable", "That piece is not for sale.");
  if (message.includes("invalid status transition")) return new AppError(409, "invalid_transition", "That status change is not allowed.");
  if (message.includes("city is not deliverable") || message.includes("incomplete shipping") || message.includes("invalid quantity") || message.includes("idempotency key") || message.includes("email required") || message.includes("invalid card")) {
    return new AppError(400, "invalid_request", "The request could not be accepted.");
  }
  if (message.includes("order can no longer be cancelled")) return new AppError(409, "not_cancellable", "This order can no longer be cancelled.");
  if (message.includes("order not found")) return new AppError(404, "not_found", "Order not found.");
  if (message.includes("no inventory row")) return new AppError(404, "not_found", "Inventory record not found.");
  if (pg.code === "23505") return new AppError(409, "conflict", "That record already exists.");
  if (pg.code === "23514") return new AppError(400, "invalid_request", "The value is not allowed.");
  if (pg.code === "22P02") return new AppError(400, "invalid_request", "A value has the wrong format.");
  return error;
}

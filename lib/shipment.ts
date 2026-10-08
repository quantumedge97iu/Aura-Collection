const transitDays: Record<string, number> = {
  Karachi: 1,
  Hyderabad: 2,
  Lahore: 3,
  Faisalabad: 3,
  Islamabad: 3,
  Rawalpindi: 3,
  Sialkot: 3,
  Multan: 4,
  Peshawar: 4,
  Quetta: 5,
};

export type ShipmentStep = {
  key: "placed" | "confirmed" | "packed" | "shipped" | "out" | "delivered";
  label: string;
  place: string;
  detail: string;
  at: string;
};

export type Shipment = {
  tracking: string;
  courier: string;
  city: string;
  eta: string;
  current: number;
  steps: ShipmentStep[];
};

type ShipmentOrder = {
  number: string;
  createdAt: string;
  status: string;
  shipping: { city: string };
  tracking?: string;
  eta?: string | null;
  shipmentStatus?: string | null;
  history?: Array<{ status: string; at: string }>;
};

export function trackingCode(orderId: string) {
  return `LX-${orderId.replace(/^LJ-?/i, "")}`;
}

export function arrivalDate(city: string, from = new Date(), madeToOrder = false, transitDays?: number) {
  const days = (transitDays ?? leadDays(city, false)) + (madeToOrder ? 5 : 0);
  return atHour(addWorkingDays(from, days), 18);
}

const statusIndex: Record<string, number> = {
  created: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 5,
  returned: 5,
  refunded: 5,
  cancelled: 0,
};

export function shipmentOf(order: ShipmentOrder): Shipment {
  const city = order.shipping.city || "Karachi";
  const placed = new Date(order.createdAt);
  const eta = order.eta ? new Date(order.eta) : arrivalDate(city, placed, false);
  const atFor = (status: string) => order.history?.find((entry) => entry.status === status)?.at;
  let current = statusIndex[order.status] ?? 0;
  if (order.shipmentStatus === "packed") current = 2;
  if (order.shipmentStatus === "shipped") current = 3;
  if (order.shipmentStatus === "out_for_delivery") current = 4;
  if (order.shipmentStatus === "delivered" || order.status === "delivered") current = 5;
  if (order.status === "cancelled") current = 0;

  const stamp = (index: number, status: string) => (index <= current ? atFor(status) ?? placed.toISOString() : eta.toISOString());
  const steps: ShipmentStep[] = [
    { key: "placed", label: "Order placed", place: "Karachi studio", detail: order.status === "cancelled" ? "This order was cancelled." : "The order is in the house book.", at: stamp(0, "created") },
    { key: "confirmed", label: "Confirmed", place: "Karachi studio", detail: "The house accepted the order.", at: stamp(1, "confirmed") },
    { key: "packed", label: "Packed", place: "Karachi studio", detail: "Hallmarked, boxed, and sealed for dispatch.", at: stamp(2, "processing") },
    { key: "shipped", label: "Shipped", place: "Left Karachi", detail: "Handed to Aura Dispatch.", at: stamp(3, "shipped") },
    { key: "out", label: "Out for delivery", place: city, detail: `The courier is in ${city} with the parcel.`, at: stamp(4, "shipped") },
    { key: "delivered", label: "Delivered", place: city, detail: "Signed for at the delivery address.", at: stamp(5, "delivered") },
  ];

  return {
    tracking: order.tracking || trackingCode(order.number),
    courier: "Aura Dispatch",
    city,
    eta: eta.toISOString(),
    current,
    steps,
  };
}

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function leadDays(city: string, madeToOrder: boolean) {
  return (transitDays[city] ?? 4) + (madeToOrder ? 5 : 0);
}

function addWorkingDays(from: Date, days: number) {
  const next = new Date(from.getTime());
  let left = days;
  while (left > 0) {
    next.setDate(next.getDate() + 1);
    if (next.getDay() !== 0) left -= 1;
  }
  return next;
}

function atHour(from: Date, hour: number) {
  const next = new Date(from.getTime());
  next.setHours(hour, 0, 0, 0);
  return next;
}

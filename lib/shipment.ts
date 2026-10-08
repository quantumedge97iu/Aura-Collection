import { getProduct } from "@/lib/catalog";

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
  id: string;
  createdAt: string;
  shipping: { city: string };
  items: Array<{ slug: string }>;
};

export function trackingCode(orderId: string) {
  return `LX-${orderId.replace(/^LJ-?/i, "")}`;
}

export function arrivalDate(city: string, from = new Date(), madeToOrder = false) {
  return atHour(addWorkingDays(from, leadDays(city, madeToOrder)), 18);
}

export function shipmentOf(order: ShipmentOrder, now = new Date()): Shipment {
  const city = order.shipping.city || "Karachi";
  const placed = new Date(order.createdAt);
  const workshop = order.items.some((item) => getProduct(item.slug)?.category === "bridal");
  const confirmed = new Date(placed.getTime() + 2 * 60 * 60 * 1000);
  const packed = workshop ? atHour(addWorkingDays(placed, 5), 11) : new Date(placed.getTime() + 8 * 60 * 60 * 1000);
  const deliveredAt = arrivalDate(city, placed, workshop);
  let shipped = atHour(previousWorkingDay(deliveredAt), 16);
  if (shipped.getTime() <= packed.getTime()) shipped = new Date(packed.getTime() + 4 * 60 * 60 * 1000);
  let out = atHour(deliveredAt, 9);
  if (out.getTime() <= shipped.getTime()) out = new Date(shipped.getTime() + 4 * 60 * 60 * 1000);
  let delivered = new Date(deliveredAt.getTime());
  if (delivered.getTime() <= out.getTime()) delivered = new Date(out.getTime() + 6 * 60 * 60 * 1000);

  const steps: ShipmentStep[] = [
    {
      key: "placed",
      label: "Order placed",
      place: "Karachi studio",
      detail: "The order is in the house book.",
      at: placed.toISOString(),
    },
    {
      key: "confirmed",
      label: "Confirmed",
      place: "Karachi studio",
      detail: "The house accepted it and reserved the piece.",
      at: confirmed.toISOString(),
    },
    {
      key: "packed",
      label: "Packed",
      place: workshop ? "Workshop" : "Karachi studio",
      detail: workshop ? "The bridal piece is finished, hallmarked, and boxed." : "Hallmarked, boxed, and sealed for dispatch.",
      at: packed.toISOString(),
    },
    {
      key: "shipped",
      label: "Shipped",
      place: "Left Karachi",
      detail: "Handed to Aura Dispatch.",
      at: shipped.toISOString(),
    },
    {
      key: "out",
      label: "Out for delivery",
      place: city,
      detail: `The courier is in ${city} with the parcel.`,
      at: out.toISOString(),
    },
    {
      key: "delivered",
      label: "Delivered",
      place: city,
      detail: "Signed for at the delivery address.",
      at: delivered.toISOString(),
    },
  ];

  let current = 0;
  steps.forEach((step, index) => {
    if (new Date(step.at).getTime() <= now.getTime()) current = index;
  });

  return {
    tracking: trackingCode(order.id),
    courier: "Aura Dispatch",
    city,
    eta: delivered.toISOString(),
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

function previousWorkingDay(from: Date) {
  const next = new Date(from.getTime());
  do {
    next.setDate(next.getDate() - 1);
  } while (next.getDay() === 0);
  return next;
}

function atHour(from: Date, hour: number) {
  const next = new Date(from.getTime());
  next.setHours(hour, 0, 0, 0);
  return next;
}

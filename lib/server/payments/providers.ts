import { AppError } from "../http/errors";

export type PaymentMethod = "cod" | "bank" | "card";

export type PreparedPayment = {
  method: PaymentMethod;
  provider: string;
  cardLast4: string | null;
};

export interface PaymentProvider {
  method: PaymentMethod;
  provider: string;
  prepare(input: { cardLast4?: string | null }): PreparedPayment;
}

class CashProvider implements PaymentProvider {
  method = "cod" as const;
  provider = "cash_on_delivery";
  prepare(): PreparedPayment {
    return { method: this.method, provider: this.provider, cardLast4: null };
  }
}

class BankProvider implements PaymentProvider {
  method = "bank" as const;
  provider = "bank_transfer";
  prepare(): PreparedPayment {
    return { method: this.method, provider: this.provider, cardLast4: null };
  }
}

class CardProvider implements PaymentProvider {
  method = "card" as const;
  provider = "card";
  prepare(input: { cardLast4?: string | null }): PreparedPayment {
    if (!input.cardLast4 || !/^[0-9]{4}$/.test(input.cardLast4)) {
      throw new AppError(400, "invalid_request", "Enter the last 4 digits of the card.");
    }
    return { method: this.method, provider: this.provider, cardLast4: input.cardLast4 };
  }
}

const providers: Record<PaymentMethod, PaymentProvider> = {
  cod: new CashProvider(),
  bank: new BankProvider(),
  card: new CardProvider(),
};

export function paymentProvider(method: PaymentMethod) {
  return providers[method];
}

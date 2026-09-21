import { config } from '@gsv/config';

export function isMockMode(): boolean {
  return config.paymentMock || false;
}

export type UpiUriInput = {
  payeeAddress: string; // The UPI ID (pa)
  payeeName: string; // The payee name (pn)
  transactionNote: string; // The booking code/note (tn)
  amountPaise: number; // The amount (am)
};

export function generateUpiUri(input: UpiUriInput): string {
  const amountRupees = (input.amountPaise / 100).toFixed(2);
  const params = new URLSearchParams({
    pa: input.payeeAddress,
    pn: input.payeeName,
    tn: input.transactionNote,
    am: amountRupees,
    cu: 'INR',
  });
  return `upi://pay?${params.toString()}`;
}

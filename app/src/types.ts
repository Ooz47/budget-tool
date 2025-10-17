export type Tx = {
  id: string;
  bank: string;
  accountIban?: string | null;
  dateOperation: string;   // ISO
  dateValeur?: string | null;
  label: string;
  details?: string | null;
  debit: number;
  credit: number;
  amount: number;
  yearMonth: string;       // "YYYY-MM"
  sourceFile: string;
  categoryId?: string | null;
};

export type Monthly = {
  month: string;    // "YYYY-MM"
  debit: number;
  credit: number;
  balance: number;
};

export type AnnualSummary = {
  debit: number;
  credit: number;
  balance: number;
};

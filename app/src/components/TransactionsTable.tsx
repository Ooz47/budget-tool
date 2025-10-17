// import { Tx } from "../types";
import { useEffect, useState } from "react";
import api from "../api";

type Tx = {
  id: string;
  bank: string;
  dateOperation: string;
  label: string;
  details?: string | null;
  debit: number;
  credit: number;
  amount: number;
  yearMonth: string;
};

export default function TransactionsTable() {
  const [rows, setRows] = useState<Tx[]>([]);
  const [month, setMonth] = useState("2025-09");
  const [bank, setBank] = useState("SG");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/transactions", { params: { month, bank, search } })
      .then(r => {
              console.log("API /transactions =>", r.data);
        const arr = Array.isArray(r.data) ? r.data : [];
        setRows(arr.map((x:any) => ({
          id: String(x.id),
          bank: String(x.bank ?? ""),
          dateOperation: String(x.dateOperation ?? "").slice(0,10),
          label: String(x.label ?? ""),
          details: x.details ?? null,
          debit: Number(x.debit ?? 0),
          credit: Number(x.credit ?? 0),
          amount: Number(x.amount ?? 0),
          yearMonth: String(x.yearMonth ?? ""),
        })));
      })
      .catch(() => setRows([]));
  }, [month, bank, search]);


  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <input value={month} onChange={e=>setMonth(e.target.value)} placeholder="YYYY-MM" />
        <input value={bank} onChange={e=>setBank(e.target.value)} placeholder="Bank" />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher libellé..." />
      </div>
      <table width="100%" cellPadding={6} style={{ borderCollapse:"collapse" }}>
        <thead>
          <tr>
            <th>Date</th><th>Libellé</th><th>Détails</th><th>Débit</th><th>Crédit</th><th>Montant</th>
          </tr>
        </thead>
       <tbody>
  {rows.length===0 && (
    <tr><td colSpan={6} style={{ padding:12, color:"#6b7280" }}>
      Aucune transaction pour ce filtre.
    </td></tr>
  )}
  {rows.map(r=>(
    <tr key={r.id} style={{ borderTop:"1px solid #ddd" }}>
      <td>{r.dateOperation}</td>
      <td>{r.label}</td>
      <td>{r.details ?? ""}</td>
      <td style={{ textAlign:"right" }}>{r.debit.toFixed(2)}</td>
      <td style={{ textAlign:"right" }}>{r.credit.toFixed(2)}</td>
      <td style={{ textAlign:"right", color: r.amount<0 ? "#dc2626" : "#16a34a" }}>
        {r.amount.toFixed(2)}
      </td>
    </tr>
  ))}
</tbody>

      </table>
    </div>
  );
}

import TransactionsTable from "./components/TransactionsTable";
import MonthlyChart from "./components/MonthlyChart";
import api from "./api";
import ImportForm from "./components/ImportForm";
import { useEffect, useState } from "react";

function AnnualSummary() {
  const [sum, setSum] = useState<{debit:number, credit:number, balance:number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/annual")
      .then(r => {
        // Défense: si l’API renvoie autre chose
        const s = r.data || {};
        setSum({
          debit: Number(s.debit ?? 0),
          credit: Number(s.credit ?? 0),
          balance: Number(s.balance ?? 0),
        });
      })
      .catch(() => {
        setSum({ debit: 0, credit: 0, balance: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !sum) return <div>Chargement…</div>;

  return (
    <div style={{ display:"flex", gap:16, margin:"12px 0" }}>
      <div>Total Débit: {Number(sum.debit).toFixed(2)}</div>
      <div>Total Crédit: {Number(sum.credit).toFixed(2)}</div>
      <div>Solde: <b style={{ color: sum.balance<0 ? "#dc2626" : "#16a34a" }}>
        {Number(sum.balance).toFixed(2)}
      </b></div>
    </div>
  );
}


export default function App() {
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = () => setReloadKey(k => k + 1);

  return (
    <div style={{ padding: 16 }}>
      <h1>Budget Tool (Local) — SG</h1>
      <ImportForm onDone={refresh} />

      {/* (facultatif) recap annuel */}
      {/* <AnnualSummary key={`a-${reloadKey}`} /> */}

      <h2>Évolution mensuelle (2025)</h2>
      <MonthlyChart year="2025" key={`m-${reloadKey}`} />

      <h2>Transactions</h2>
      <TransactionsTable key={`t-${reloadKey}`} />
    </div>
  );
}

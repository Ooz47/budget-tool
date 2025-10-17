import { useState } from "react";
import Filters from "./components/Filters";
import ImportForm from "./components/ImportForm";
import TransactionsTable from "./components/TransactionsTable";
import MonthlyChart from "./components/MonthlyChart";
import SummaryCard from "./components/SummaryCard";

export default function App() {
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = () => setReloadKey(k => k + 1);

  return (
    <div style={{ padding: 16 }}>
      <h1>Budget Tool (Local) — SG</h1>
      <ImportForm onDone={refresh} />
     <Filters year={year} month={month} onChange={(y,m)=>{setYear(y); setMonth(m);}} />
      <h2>Évolution mensuelle</h2>
      <MonthlyChart year={year} month={month} key={`m-${reloadKey}-${year}-${month}`} />

      <h2>
  Résumé — {month ? `${year}-${month}` : year}
</h2>
      <SummaryCard year={year} month={month} key={`s-${reloadKey}-${year}-${month}`} /> 
      
      <h2>Transactions</h2>
      <TransactionsTable key={`t-${reloadKey}-${year}-${month}`} year={year} month={month} />
    </div>
  );
}

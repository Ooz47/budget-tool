import { useState } from "react";
import Filters from "../components/Filters";
import ImportForm from "../components/ImportForm";
import TransactionsTable from "../components/TransactionsTable";
import MonthlyChart from "../components/MonthlyChart";
import SummaryCard from "../components/SummaryCard";
import TypeSummaryTable from "../components/TypeSummaryTable";
import EntitySummaryTable from "../components/EntitySummaryTable";
import StatsSummary from "../components/StatsSummary";
// import AdminTools from "../components/AdminTools";
export default function Dashboard() {
  const [year, setYear] = useState("2025");
  const [month, setMonth] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = () => setReloadKey((k) => k + 1);

  return (
    <div style={{ padding: 20 }}>
      <h2>Budget Tool Dashboard</h2>
      

      {/* <AdminTools /> */}
      <StatsSummary />
      <ImportForm onDone={refresh} />
      <Filters
        year={year}
        month={month}
        onChange={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
      />
      <SummaryCard
        year={year}
        month={month}
        key={`s-${reloadKey}-${year}-${month}`}
      />
      <h2>Évolution mensuelle</h2>
      <MonthlyChart
        year={year}
        month={month}
        key={`m-${reloadKey}-${year}-${month}`}
      />

      <h2>Résumé — {month ? `${year}-${month}` : year}</h2>
      <TypeSummaryTable year={year} month={month} />
      <EntitySummaryTable
        year={year}
        month={month}
        key={`v-${reloadKey}-${year}-${month}`}
      />

      <h2>Transactions</h2>
      <TransactionsTable
        key={`t-${reloadKey}-${year}-${month}`}
        year={year}
        month={month}
      />
    </div>
  );
}
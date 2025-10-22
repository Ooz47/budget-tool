type Props = {
  year: string;
  month: string;
  onChange: (y: string, m: string) => void;
};

export default function Filters({ year, month, onChange }: Props) {
  const years = ["2024", "2025"];
  const months = [
    ["01", "Janvier"], ["02", "Février"], ["03", "Mars"], ["04", "Avril"],
    ["05", "Mai"], ["06", "Juin"], ["07", "Juillet"], ["08", "Août"],
    ["09", "Sept."], ["10", "Oct."], ["11", "Nov."], ["12", "Déc."],
  ];

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
      <select value={year} onChange={e => onChange(e.target.value, month)}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select value={month} onChange={e => onChange(year, e.target.value)}>
        <option value="">-- Tous les mois --</option>
        {months.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
      </select>
    </div>
  );
}

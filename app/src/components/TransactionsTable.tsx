import { useEffect, useState, useMemo, useRef } from "react";
import Select from "react-select";
import api from "../api";

type Tx = {
  id: string;
  bank: string;
  accountIban?: string | null;
  dateOperation: string;
  dateValeur?: string | null;
  label: string;
  details?: string | null;
  debit: number;
  credit: number;
  amount: number;
  yearMonth: string;
  sourceFile: string;
  categoryId?: string | null;
  typeOperation?: string | null;
entityId?: string | null;
entity?: { id: string; name: string } | null;

};

type Props = {
  year: string;
  month: string;
};

export default function TransactionsTable({ year, month }: Props) {
  const [rows, setRows] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);

  const [sortField, setSortField] = useState<keyof Tx>("dateOperation");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [query, setQuery] = useState("");

  // 🧭 Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  // 🎚️ Filtres
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterEntity, setFilterEntity] = useState<string[]>([]);
  const [filterMin, setFilterMin] = useState<number | "">("");
  const [filterMax, setFilterMax] = useState<number | "">("");

  const tableRef = useRef<HTMLDivElement>(null);

  // --- 1️⃣ Chargement des transactions
  useEffect(() => {
    setLoading(true);
    api
      .get<Tx[]>("/transactions", { params: { year, month } })
      .then((r) => {
        const arr = Array.isArray(r.data) ? r.data : [];
        setRows(
          arr.map((x) => ({
            ...x,
            debit: Number(x.debit ?? 0),
            credit: Number(x.credit ?? 0),
            amount: Number(x.amount ?? 0),
          }))
        );
        setPage(1);
      })
      .catch((err) => {
        console.error("Erreur API /transactions :", err);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [year, month]);

  // --- 2️⃣ Filtres dynamiques combinés à la recherche
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        r.label?.toLowerCase().includes(q) ||
        r.details?.toLowerCase().includes(q) ||
        r.typeOperation?.toLowerCase().includes(q) ||
        r.entity?.name?.toLowerCase().includes(q);

      const matchesType =
        filterType.length === 0 ||
        filterType.includes(r.typeOperation ?? "");

      const matchesEntity =
        filterEntity.length === 0 ||
        filterEntity.includes(r.entity?.name ?? "");

      const matchesAmount =
        (filterMin === "" || r.amount >= Number(filterMin)) &&
        (filterMax === "" || r.amount <= Number(filterMax));

      return matchesQuery && matchesType && matchesEntity && matchesAmount;
    });
  }, [rows, query, filterType, filterEntity, filterMin, filterMax]);

  // --- 3️⃣ Tri
  const sortedRows = useMemo(() => {
    const data = [...filteredRows];
    data.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA ?? "").toUpperCase();
      const strB = String(valB ?? "").toUpperCase();
      return sortOrder === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
    return data;
  }, [filteredRows, sortField, sortOrder]);

  // --- 4️⃣ Pagination locale
  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const paginatedRows = sortedRows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const handleSort = (field: keyof Tx) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // --- Données des filtres
  const typeOptions = [
    { value: "VIREMENT", label: "Virement" },
    { value: "PRLV", label: "Prélèvement" },
    { value: "PAIEMENT CB", label: "Paiement CB" },
    { value: "CHEQUE", label: "Chèque" },
    { value: "AUTRE (FRAIS BANCAIRES)", label: "Frais bancaires" },
    { value: "AUTRE", label: "Autres" },
  ];

  const entityOptions = Array.from(
    new Set(rows.map((r) => r.entity?.name).filter(Boolean))
  )
    .sort((a, b) => (a ?? "").localeCompare(b ?? "")) // ✅ sécurisé
    .map((ent) => ({ value: ent!, label: ent! }));

  if (loading) return <div>Chargement des transactions...</div>;

  return (
    <div ref={tableRef} style={{ marginTop: 20, marginBottom: 40 }}>
      {/* 🔍 Recherche */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="🔍 Rechercher (libellé, type, entité...)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          style={{
            width: "100%",
            padding: "6px 10px",
            fontSize: "0.9rem",
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
      </div>

     {/* 🎚️ Filtres dynamiques */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "10px",
    alignItems: "center",
    marginBottom: "14px",
  }}
>
  {/* Type d’opération */}
  <div style={{ minWidth: 180 }}>
    <label style={{ display: "block", fontSize: "0.8rem", color: "#555", marginBottom: 4 }}>
      Type d’opération
    </label>
    <Select
      isMulti
      options={typeOptions}
      value={typeOptions.filter((opt) => filterType.includes(opt.value))}
      onChange={(selected) => setFilterType(selected.map((opt) => opt.value))}
      placeholder="Tous"
      styles={{
        control: (base) => ({
          ...base,
          minHeight: "34px",
          fontSize: "0.85rem",
          borderColor: "#ccc",
          boxShadow: "none",
        }),
        multiValue: (base) => ({ ...base, background: "#e7f3ff" }),
      }}
    />
  </div>

  {/* Entités */}
  <div style={{ minWidth: 180 }}>
    <label style={{ display: "block", fontSize: "0.8rem", color: "#555", marginBottom: 4 }}>
      Entité
    </label>
    <Select
      isMulti
      options={entityOptions}
      value={entityOptions.filter((opt) => filterEntity.includes(opt.value))}
      onChange={(selected) => setFilterEntity(selected.map((opt) => opt.value))}
      placeholder="Toutes"
      styles={{
        control: (base) => ({
          ...base,
          minHeight: "34px",
          fontSize: "0.85rem",
          borderColor: "#ccc",
          boxShadow: "none",
        }),
        multiValue: (base) => ({ ...base, background: "#f3f3f3" }),
      }}
    />
  </div>

  {/* Montant min */}
  <div>
    <label style={{ display: "block", fontSize: "0.8rem", color: "#555", marginBottom: 4 }}>
      Montant min (€)
    </label>
    <input
      type="number"
      placeholder="ex: 10"
      value={filterMin}
      onChange={(e) =>
        setFilterMin(e.target.value ? Number(e.target.value) : "")
      }
      style={{
        width: "100%",
        padding: "6px",
        fontSize: "0.85rem",
        border: "1px solid #ccc",
        borderRadius: 4,
      }}
    />
  </div>

  {/* Montant max */}
  <div>
    <label style={{ display: "block", fontSize: "0.8rem", color: "#555", marginBottom: 4 }}>
      Montant max (€)
    </label>
    <input
      type="number"
      placeholder="ex: 500"
      value={filterMax}
      onChange={(e) =>
        setFilterMax(e.target.value ? Number(e.target.value) : "")
      }
      style={{
        width: "100%",
        padding: "6px",
        fontSize: "0.85rem",
        border: "1px solid #ccc",
        borderRadius: 4,
      }}
    />
  </div>

  {/* Bouton reset */}
  <div style={{ alignSelf: "end", marginTop: 6 }}>
    <button
      onClick={() => {
        setFilterType([]);
        setFilterEntity([]);
        setFilterMin("");
        setFilterMax("");
      }}
      style={{
        width: "100%",
        padding: "7px 10px",
        fontSize: "0.85rem",
        border: "1px solid #ccc",
        borderRadius: 4,
        background: "#f7f7f7",
        cursor: "pointer",
        transition: "background 0.2s ease",
      }}
      onMouseOver={(e) =>
        (e.currentTarget.style.background = "#eee")
      }
      onMouseOut={(e) =>
        (e.currentTarget.style.background = "#f7f7f7")
      }
    >
      Réinitialiser
    </button>
  </div>
</div>


      {/* 📋 Tableau */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.9rem",
        }}
      >
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd" }}>
            {[
              ["dateOperation", "Date"],
              ["label", "Libellé"],
              ["details", "Détails"],
              ["typeOperation", "Type"],
              ["entity", "Entité"],
              ["amount", "Montant (€)"],
            ].map(([key, label]) => (
              <th
                key={key}
                onClick={() => handleSort(key as keyof Tx)}
                style={{
                  cursor: "pointer",
                  textAlign:
                    key === "amount" ? "right" : key === "entity" ? "left" : "left",
                  padding: "4px 8px",
                  userSelect: "none",
                }}
              >
                {label}{" "}
                {sortField === key && (sortOrder === "asc" ? "▲" : "▼")}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {paginatedRows.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{ textAlign: "center", padding: 8, color: "#666" }}
              >
                Aucune transaction trouvée.
              </td>
            </tr>
          ) : (
            paginatedRows.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{r.dateOperation?.slice(0, 10)}</td>
                <td>{r.label}</td>
                <td style={{ color: "#555" }}>{r.details ?? ""}</td>
                <td>{r.typeOperation ?? ""}</td>
                <td>{r.entity?.name ?? "-"}</td>
                <td
                  style={{
                    textAlign: "right",
                    color: r.amount < 0 ? "#dc2626" : "#16a34a",
                    fontWeight: 500,
                  }}
                >
                  {r.amount.toFixed(2)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 📄 Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            style={{
              padding: "4px 8px",
              border: "1px solid #ccc",
              borderRadius: 4,
              background: page === 1 ? "#f3f3f3" : "white",
              cursor: page === 1 ? "not-allowed" : "pointer",
            }}
          >
            ◀
          </button>

          <span style={{ lineHeight: "24px" }}>
            Page {page} / {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            style={{
              padding: "4px 8px",
              border: "1px solid #ccc",
              borderRadius: 4,
              background: page === totalPages ? "#f3f3f3" : "white",
              cursor: page === totalPages ? "not-allowed" : "pointer",
            }}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

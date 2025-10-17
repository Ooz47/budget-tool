import { useState } from "react";
import api from "../api";

export default function ImportForm({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return setMsg("Choisis un CSV SG d'abord.");
    setLoading(true); setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api.post("/import/sg-csv", fd); // <-- PAS de headers ici
      
    setMsg(`Import: +${r.data.imported}, modifiés: ${r.data.updated}, ignorés: ${r.data.skipped} (${r.data.file || "?"})`);
      onDone(); // rafraîchir tableau + graphiques
    } catch (err: any) {
      console.error(err);
      setMsg("Import échoué");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8, alignItems: "center", margin: "12px 0" }}>
      <input type="file" accept=".csv,text/csv" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button type="submit" disabled={!file || loading}>{loading ? "Import..." : "Importer SG CSV"}</button>
      <span>{msg}</span>
    </form>
  );
}

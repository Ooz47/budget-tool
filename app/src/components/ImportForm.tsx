import { useState } from "react";
import api from "../api";
import { useActiveAccount } from "../context/ActiveAccountContext";


export default function ImportForm({ onDone }: { onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
const { activeAccountId } = useActiveAccount();
const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!file) return setMsg("Choisis un CSV SG d'abord.");
  if (!activeAccountId) return setMsg("Aucun compte sélectionné.");
  setLoading(true);
  setMsg("");

  const fd = new FormData();
  fd.append("file", file, file.name); // ✅ 3ᵉ argument = nom du fichier
  fd.append("accountId", activeAccountId);

  try {
    const r = await api.post("/import/sg-csv", fd, {
      headers: { "Content-Type": "multipart/form-data" }, // ✅ forcer type ici
    });
    setMsg(
      `Import réussi : +${r.data.imported}, modifiés: ${r.data.updated}`
    );
    onDone();
  } catch (err: any) {
    console.error("Erreur import:", err);
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

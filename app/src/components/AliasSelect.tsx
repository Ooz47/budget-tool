import { useEffect, useState } from "react";
import { fetchEntities } from "../api/entities";
import api from "../api";

interface Props {
  entityId: string;
  onClose: () => void;
  onUpdated: () => void;
}

type EntityLite = {
  id: string;
  name: string;
  displayName?: string | null;
  aliasOfId?: string | null;
};

export default function AliasSelect({ entityId, onClose, onUpdated }: Props) {
  const [entities, setEntities] = useState<EntityLite[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Charger toutes les entités
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchEntities();
        // Exclure l'entité principale
        const list = data.filter((e: EntityLite) => e.id !== entityId);
        setEntities(list);

        // Pré-cocher celles déjà aliasées
        const aliases = data.filter((e: EntityLite) => e.aliasOfId === entityId);
        setSelected(aliases.map((a) => a.id));
      } catch (e) {
        console.error("Erreur chargement entités :", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [entityId]);

  // Toggle sélection
  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Sauvegarder les alias sélectionnés
  const handleSave = async () => {
    try {
      setSaving(true);
      await api.post(`/entities/${entityId}/merge`, { aliasIds: selected });
      onUpdated();
      onClose();
    } catch (e) {
      console.error("Erreur sauvegarde alias :", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 8,
          padding: 20,
          width: 480,
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <h3 style={{ marginTop: 0 }}>🔗 Gérer les alias</h3>
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <>
            <p style={{ color: "#555", fontSize: "0.9rem" }}>
              Cochez les entités à fusionner avec celle-ci.  
              Les montants de leurs transactions seront regroupés.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                marginTop: 10,
              }}
            >
              {entities.map((e) => (
                <label
                  key={e.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 6px",
                    borderRadius: 4,
                    background: selected.includes(e.id)
                      ? "rgba(37,99,235,0.1)"
                      : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(e.id)}
                    onChange={() => toggle(e.id)}
                  />
                  <span>
                    {e.displayName || e.name}
                    {e.displayName && (
                      <span style={{ color: "#777", fontSize: "0.8em" }}>
                        {" "}
                        ({e.name})
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </>
        )}

        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6",
              border: "1px solid #ccc",
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "6px 14px",
              borderRadius: 6,
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

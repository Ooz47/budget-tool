import { useEffect, useState } from "react";
import { fetchTags } from "../api/tags";

type Tag = {
  id: string;
  name: string;
  color?: string | null;
};

interface TagSelectProps {
  value: string[];
  onChange: (newValues: string[]) => void;
}

/**
 * TagSelect — Sélecteur multiple de tags (checklist simple)
 * - charge les tags via /api/tags
 * - permet de cocher/décocher plusieurs tags
 */
export default function TagSelect({ value, onChange }: TagSelectProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTags = async () => {
      setLoading(true);
      try {
        const res = await fetchTags();
        setTags(res);
      } catch (e) {
        console.error("Erreur chargement tags :", e);
      } finally {
        setLoading(false);
      }
    };
    loadTags();
  }, []);

  const toggleTag = (id: string) => {
    const newValues = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    onChange(newValues);
  };

  if (loading) return <p>Chargement des tags...</p>;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 4,
      }}
    >
      {tags.map((t) => {
        const selected = value.includes(t.id);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => toggleTag(t.id)}
            style={{
              backgroundColor: selected ? t.color || "#2563eb" : "#f3f4f6",
              color: selected ? "white" : "#111",
              border: selected ? "1px solid #2563eb" : "1px solid #d1d5db",
              borderRadius: 4,
              padding: "3px 8px",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
            title={t.name}
          >
            {t.name}
          </button>
        );
      })}
      {tags.length === 0 && (
        <span style={{ color: "#999", fontStyle: "italic" }}>
          Aucun tag disponible
        </span>
      )}
    </div>
  );
}

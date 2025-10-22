import { useEffect, useState } from "react";
import Select from "react-select";
// import { useActiveAccount } from "../context/ActiveAccountContext";
import { fetchCategories } from "../api/categories";

type Category = {
  id: string;
  name: string;
  color?: string | null;
  parentCategoryId?: string | null;
  children?: Category[];
};

type Props = {
  value?: string | string[] | null;
  onChange?: (value: string | string[] | null) => void;
  isMulti?: boolean;
  placeholder?: string;
  excludeId?: string; // 🆕 pour empêcher la sélection de soi-même
};

export default function CategorySelect({
  value,
  onChange,
  isMulti = false,
  placeholder = "Sélectionner une catégorie",
  excludeId,
}: Props) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
// const { activeAccountId } = useActiveAccount();
  useEffect(() => {
    
// if (!activeAccountId) return; // ⛔ évite d'appeler l'API sans compte actif
    setLoading(true);
    fetchCategories()
      .then((cats: Category[]) => {
        const opts: { label: string; value: string }[] = [];

        cats.forEach((cat) => {
          if (cat.id === excludeId) return; // 🧹 filtre le parent lui-même
          opts.push({ label: `📂 ${cat.name}`, value: cat.id });

          if (cat.children?.length) {
            cat.children.forEach((sub) => {
              if (sub.id === excludeId) return;
              opts.push({
                label: `↳ ${sub.name}`,
                value: sub.id,
              });
            });
          }
        });

        setOptions(opts);
      })
      .catch((err) => console.error("Erreur chargement catégories:", err))
      .finally(() => setLoading(false));
  }, [excludeId]);

  const selected = isMulti
    ? options.filter((opt) => (value as string[])?.includes(opt.value))
    : options.find((opt) => opt.value === value) || null;

  return (
    <Select
      isMulti={isMulti}
      isLoading={loading}
      options={options}
      value={selected}
      onChange={(selectedOption) => {
        if (isMulti) {
          const vals = (selectedOption as any[])?.map((opt) => opt.value) || [];
          onChange?.(vals);
        } else {
          onChange?.((selectedOption as any)?.value || null);
        }
      }}
      placeholder={placeholder}
      styles={{
        control: (base) => ({
          ...base,
          minHeight: "34px",
          fontSize: "0.85rem",
          borderColor: "#ccc",
        }),
      }}
    />
  );
}

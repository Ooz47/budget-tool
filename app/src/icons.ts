import * as LucideIcons from "lucide-react";
export default LucideIcons;

export function getIcon(name?: string) {
  if (!name) return null;
  const iconName = name.replace(/(^\w|-\w)/g, (m) =>
    m.replace("-", "").toUpperCase()
  );
  return LucideIcons[iconName as keyof typeof LucideIcons] || null;
}
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type ActiveAccountContextType = {
  activeAccountId: string | null;
  activeAccountName: string | null;
  setActiveAccount: (id: string | null, name?: string | null) => void;
};

// Valeurs par défaut
const ActiveAccountContext = createContext<ActiveAccountContextType>({
  activeAccountId: null,
  activeAccountName: null,
  setActiveAccount: () => {},
});

export const ActiveAccountProvider = ({ children }: { children: ReactNode }) => {
  const [activeAccountId, setActiveAccountId] = useState<string | null>(
    localStorage.getItem("activeAccountId")
  );
  const [activeAccountName, setActiveAccountName] = useState<string | null>(
    localStorage.getItem("activeAccountName")
  );

  const setActiveAccount = (id: string | null, name: string | null = null) => {
    setActiveAccountId(id);
    setActiveAccountName(name);
    if (id) {
      localStorage.setItem("activeAccountId", id);
      if (name) localStorage.setItem("activeAccountName", name);
    } else {
      localStorage.removeItem("activeAccountId");
      localStorage.removeItem("activeAccountName");
    }
    window.dispatchEvent(new Event("storage")); // 🔁 synchronise entre onglets
  };

  // Synchronisation entre onglets
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "activeAccountId") setActiveAccountId(e.newValue);
      if (e.key === "activeAccountName") setActiveAccountName(e.newValue);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <ActiveAccountContext.Provider
      value={{ activeAccountId, activeAccountName, setActiveAccount }}
    >
      {children}
    </ActiveAccountContext.Provider>
  );
};

export const useActiveAccount = () => useContext(ActiveAccountContext);

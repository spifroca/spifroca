"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Projekt { id: string; nummer: string; name: string; status: string; }
interface ProjektContextType {
  aktuellesProjekt: Projekt | null;
  setAktuellesProjekt: (p: Projekt | null) => void;
  projekte: Projekt[];
  setProjekte: (p: Projekt[]) => void;
}

const ProjektContext = createContext<ProjektContextType>({
  aktuellesProjekt: null, setAktuellesProjekt: () => {},
  projekte: [],           setProjekte: () => {},
});

export function ProjektProvider({ children, initialProjekte }: { children: ReactNode; initialProjekte: Projekt[] }) {
  const [projekte, setProjekte] = useState<Projekt[]>(initialProjekte);
  const [aktuellesProjekt, setAktuellesProjektState] = useState<Projekt | null>(null);

  useEffect(() => {
    // Letztes Projekt aus localStorage laden
    const saved = localStorage.getItem("spifroca_projektId");
    const found = initialProjekte.find(p => p.id === saved) || initialProjekte[0] || null;
    setAktuellesProjektState(found);
  }, [initialProjekte]);

  const setAktuellesProjekt = (p: Projekt | null) => {
    setAktuellesProjektState(p);
    if (p) localStorage.setItem("spifroca_projektId", p.id);
  };

  return (
    <ProjektContext.Provider value={{ aktuellesProjekt, setAktuellesProjekt, projekte, setProjekte }}>
      {children}
    </ProjektContext.Provider>
  );
}

export const useProjekt = () => useContext(ProjektContext);

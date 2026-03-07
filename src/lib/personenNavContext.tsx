"use client";
import { createContext, useContext } from "react";

export interface PNavState {
  pId: string | null;
  pName: string | null;
  page: string;
}

export const PNavCtx = createContext<PNavState & { set: (s: Partial<PNavState>) => void }>({
  pId: null,
  pName: null,
  page: "Übersicht",
  set: () => {},
});

export const usePNav = () => useContext(PNavCtx);

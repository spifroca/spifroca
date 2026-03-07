import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.length < 2) return NextResponse.json([]);

  const results: any[] = [];

  // Personen
  const personen = await prisma.person.findMany({
    where: {
      OR: [
        { name:      { contains: q, mode: "insensitive" } },
        { vorname:   { contains: q, mode: "insensitive" } },
        { firmaName: { contains: q, mode: "insensitive" } },
        { email:     { contains: q, mode: "insensitive" } },
        { telefon:   { contains: q, mode: "insensitive" } },
        { ort:       { contains: q, mode: "insensitive" } },
        { funktion:  { contains: q, mode: "insensitive" } },
      ],
    },
    take: 8,
  });

  personen.forEach(p => results.push({
    id:    p.id,
    typ:   p.typ === "FIRMA" ? "Firma" : "Person",
    titel: p.typ === "FIRMA" ? p.firmaName || p.name : `${p.vorname || ""} ${p.name}`.trim(),
    sub:   [p.funktion, p.ort].filter(Boolean).join(" · ") || p.email || "",
    href:  `/dashboard/personen?id=${p.id}`,
  }));

  // Projekte
  const projekte = await prisma.projekt.findMany({
    where: {
      OR: [
        { name:        { contains: q, mode: "insensitive" } },
        { nummer:      { contains: q, mode: "insensitive" } },
        { beschreibung:{ contains: q, mode: "insensitive" } },
        { gruppe:      { contains: q, mode: "insensitive" } },
      ],
    },
    take: 5,
  });

  projekte.forEach(p => results.push({
    id:    p.id,
    typ:   "Projekt",
    titel: `${p.nummer} · ${p.name}`,
    sub:   [p.gruppe, p.status].filter(Boolean).join(" · "),
    href:  "/dashboard/projekte",
  }));

  // Benutzer (nur für Admins)
  const user = session.user as any;
  if (user?.rolle === "ADMINISTRATOR") {
    const benutzer = await prisma.benutzer.findMany({
      where: {
        OR: [
          { name:  { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 4,
    });
    benutzer.forEach(b => results.push({
      id:    b.id,
      typ:   "Benutzer",
      titel: b.name,
      sub:   b.email,
      href:  "/dashboard/benutzerverwaltung",
    }));
  }

  return NextResponse.json(results.slice(0, 15));
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projekte = await prisma.projekt.findMany({
    include: { projektleiter: { select: { id: true, name: true, vorname: true } } },
    orderBy: { nummer: "desc" },
  });
  return NextResponse.json(projekte);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const projekt = await prisma.projekt.create({
      data: {
        nummer:           body.nummer,
        name:             body.name,
        status:           body.status           || "VORPROJEKT",
        gruppe:           body.gruppe           || null,
        beschreibung:     body.beschreibung     || null,
        plz:              body.plz              || null,
        ort:              body.ort              || null,
        kanton:           body.kanton           || null,
        land:             body.land             || "CH",
        sprache:          body.sprache          || "deutsch",
        verwaltungsbeginn:body.verwaltungsbeginn? new Date(body.verwaltungsbeginn) : null,
        verwaltungsende:  body.verwaltungsende  ? new Date(body.verwaltungsende)   : null,
        eigentuemerId:     body.eigentuemerId     || null,
        budgetGesamt:     body.budgetGesamt     ? parseFloat(body.budgetGesamt)    : null,
        projektleiterId:  body.projektleiterId  || null,
      },
      include: { projektleiter: { select: { id: true, name: true, vorname: true } } },
    });
    return NextResponse.json(projekt);
  } catch (err: any) {
    console.error("POST /api/projekte:", err);
    return NextResponse.json({ error: err.message || "Fehler" }, { status: 500 });
  }
}

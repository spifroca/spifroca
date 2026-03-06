import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const projekt = await prisma.projekt.update({
      where: { id: params.id },
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
        eigentümerId:     body.eigentümerId     || null,
        budgetGesamt:     body.budgetGesamt     ? parseFloat(body.budgetGesamt)    : null,
        projektleiterId:  body.projektleiterId  || null,
      },
      include: { projektleiter: { select: { id: true, name: true, vorname: true } } },
    });
    return NextResponse.json(projekt);
  } catch (err: any) {
    console.error("PUT /api/projekte:", err);
    return NextResponse.json({ error: err.message || "Fehler" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await prisma.projekt.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

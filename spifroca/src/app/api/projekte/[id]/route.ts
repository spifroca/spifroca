import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const { id, eigentümerId, projektleiterId, verwaltungsbeginn, verwaltungsende, budgetGesamt, projektleiter, personen, machbarkeit, ...rest } = data;
  const projekt = await prisma.projekt.update({
    where: { id: params.id },
    data: {
      ...rest,
      budgetGesamt: budgetGesamt ? parseFloat(budgetGesamt) : null,
      verwaltungsbeginn: verwaltungsbeginn ? new Date(verwaltungsbeginn) : null,
      verwaltungsende:   verwaltungsende   ? new Date(verwaltungsende)   : null,
      projektleiterId: projektleiterId || null,
    },
    include: { projektleiter: { select: { id: true, name: true } } },
  });
  return NextResponse.json(projekt);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.projekt.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

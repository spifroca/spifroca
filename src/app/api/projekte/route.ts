import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projekte = await prisma.projekt.findMany({
    include: { projektleiter: { select: { id: true, name: true } } },
    orderBy: { nummer: "desc" },
  });
  return NextResponse.json(projekte);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const { eigentümerId, projektleiterId, verwaltungsbeginn, verwaltungsende, budgetGesamt, ...rest } = data;
  const projekt = await prisma.projekt.create({
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

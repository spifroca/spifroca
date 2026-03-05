import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projektId = req.nextUrl.searchParams.get("projektId");
  if (!projektId) return NextResponse.json({ error: "projektId required" }, { status: 400 });
  const data = await prisma.machbarkeit.findUnique({ where: { projektId } });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const result = await prisma.machbarkeit.upsert({
    where: { projektId: data.projektId },
    create: { ...data },
    update: { ...data, updatedAt: new Date() },
  });
  return NextResponse.json(result);
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (user?.rolle !== "ADMINISTRATOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const benutzer = await prisma.benutzer.findMany({
    include: { person: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(benutzer);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (user?.rolle !== "ADMINISTRATOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();
  if (!data.name || !data.email || !data.passwort) {
    return NextResponse.json({ error: "Name, E-Mail und Passwort sind Pflichtfelder" }, { status: 400 });
  }

  const existing = await prisma.benutzer.findUnique({ where: { email: data.email } });
  if (existing) return NextResponse.json({ error: "E-Mail bereits vergeben" }, { status: 400 });

  const passwordHash = bcrypt.hashSync(data.passwort, 10);

  const benutzer = await prisma.benutzer.create({
    data: {
      name:         data.name,
      email:        data.email,
      passwordHash,
      rolle:        data.rolle || "BETRACHTER",
      aktiv:        data.aktiv !== false,
      personId:     data.personId || null,
    },
    include: { person: true },
  });

  return NextResponse.json(benutzer, { status: 201 });
}

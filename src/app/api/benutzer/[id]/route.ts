import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (user?.rolle !== "ADMINISTRATOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const data = await req.json();

  const updateData: any = {
    name:     data.name,
    email:    data.email,
    rolle:    data.rolle,
    aktiv:    data.aktiv,
    personId: data.personId || null,
  };

  if (data.passwort) {
    updateData.passwordHash = bcrypt.hashSync(data.passwort, 10);
  }

  const benutzer = await prisma.benutzer.update({
    where: { id: params.id },
    data: updateData,
    include: { person: true },
  });

  return NextResponse.json(benutzer);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (user?.rolle !== "ADMINISTRATOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.benutzer.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

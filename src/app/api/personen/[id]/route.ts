import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const person = await prisma.person.findUnique({
    where: { id: params.id },
    include: {
      arbeitgeber: { select: { id: true, name: true, firmaName: true } },
      mitarbeiter: { select: { id: true, name: true, vorname: true } },
      projekte:    { include: { projekt: { select: { nummer: true, name: true } } } },
    },
  });
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(person);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  const person = await prisma.person.update({
    where: { id: params.id },
    data: {
      typ:               data.typ,
      rollen:            data.rollen            || [],
      name:              data.name,
      vorname:           data.vorname           || null,
      email:             data.email             || null,
      telefon:           data.telefon           || null,
      telefonMobil:      data.telefonMobil      || null,
      webseite:          data.webseite          || null,
      sprache:           data.sprache           || "DE",
      strasse:           data.strasse           || null,
      plz:               data.plz               || null,
      ort:               data.ort               || null,
      land:              data.land              || "CH",
      funktion:          data.funktion          || null,
      abteilung:         data.abteilung         || null,
      geschaeftsStrasse: data.geschaeftsStrasse || null,
      geschaeftsPlz:     data.geschaeftsPlz     || null,
      geschaeftsOrt:     data.geschaeftsOrt     || null,
      firmaName:         data.firmaName         || null,
      uid:               data.uid               || null,
      iban:              data.iban              || null,
      geburtsdatum:      data.geburtsdatum ? new Date(data.geburtsdatum) : null,
      notizen:           data.notizen           || null,
      arbeitgeberId:     data.arbeitgeberId     || null,
    },
    include: {
      arbeitgeber: { select: { id: true, name: true, firmaName: true } },
      mitarbeiter: { select: { id: true, name: true, vorname: true } },
      projekte:    { include: { projekt: { select: { nummer: true, name: true } } } },
    },
  });

  return NextResponse.json(person);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.person.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

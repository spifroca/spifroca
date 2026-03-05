import { prisma } from "@/lib/prisma";
import { BenutzerverwaltungClient } from "./BenutzerverwaltungClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function BenutzerverwaltungPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (user?.rolle !== "ADMINISTRATOR") redirect("/dashboard/projekte");

  const benutzer = await prisma.benutzer.findMany({
    include: { person: true },
    orderBy: { name: "asc" },
  });

  const personen = await prisma.person.findMany({
    where: { benutzer: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true, vorname: true, firmaName: true, typ: true },
  });

  return <BenutzerverwaltungClient
    benutzer={JSON.parse(JSON.stringify(benutzer))}
    personen={JSON.parse(JSON.stringify(personen))}
  />;
}

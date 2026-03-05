import { prisma } from "@/lib/prisma";
import { ProjekteClient } from "./ProjekteClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ProjektePage() {
  const session  = await getServerSession(authOptions);
  const personen = await prisma.person.findMany({
    select: { id: true, name: true, vorname: true, firmaName: true, typ: true },
    where: { aktiv: true },
    orderBy: { name: "asc" },
  });
  const projekte = await prisma.projekt.findMany({
    include: { projektleiter: { select: { id: true, name: true } } },
    orderBy: { nummer: "desc" },
  });
  return <ProjekteClient
    projekte={JSON.parse(JSON.stringify(projekte))}
    personen={JSON.parse(JSON.stringify(personen))}
    session={JSON.parse(JSON.stringify(session))}
  />;
}

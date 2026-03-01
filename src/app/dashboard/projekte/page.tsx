import { prisma } from "@/lib/prisma";
import { ProjekteClient } from "./ProjekteClient";

export default async function ProjektePage() {
  const projekte = await prisma.projekt.findMany({
    include: { projektleiter: { select: { name: true } } },
    orderBy: { nummer: "asc" },
  });

  return <ProjekteClient projekte={JSON.parse(JSON.stringify(projekte))} />;
}

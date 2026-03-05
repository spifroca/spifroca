import { prisma } from "@/lib/prisma";
import { PersonenClient } from "./PersonenClient";

export default async function PersonenPage() {
  const personen = await prisma.person.findMany({
    include: {
      arbeitgeber: { select: { id: true, name: true, firmaName: true } },
      mitarbeiter: { select: { id: true, name: true, vorname: true } },
      projekte:    { include: { projekt: { select: { nummer: true, name: true } } } },
    },
    orderBy: [{ name: "asc" }],
  });

  return <PersonenClient personen={JSON.parse(JSON.stringify(personen))} />;
}

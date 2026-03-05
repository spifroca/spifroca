import { prisma } from "@/lib/prisma";
import { KostenplanungClient } from "./KostenplanungClient";

export default async function KostenplanungPage() {
  const projekte = await prisma.projekt.findMany({
    select: { id: true, nummer: true, name: true, status: true },
    orderBy: { nummer: "desc" },
  });
  return <KostenplanungClient projekte={JSON.parse(JSON.stringify(projekte))} />;
}

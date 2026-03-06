import { prisma } from "@/lib/prisma";
import { PersonenClient } from "./PersonenClient";

export default async function PersonenPage() {
  const personen = await prisma.person.findMany({ orderBy: [{ typ:"asc" },{ name:"asc" }] });
  const firmen   = await prisma.person.findMany({ where:{ typ:"FIRMA", aktiv:true }, select:{ id:true, name:true, firmaName:true }, orderBy:{ name:"asc" } });
  return <PersonenClient personen={JSON.parse(JSON.stringify(personen))} firmen={JSON.parse(JSON.stringify(firmen))} />;
}

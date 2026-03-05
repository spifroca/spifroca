import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/layout/DashboardClient";
import { ProjektProvider } from "@/lib/projektContext";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const projekte = await prisma.projekt.findMany({
    select: { id: true, nummer: true, name: true, status: true },
    orderBy: { nummer: "desc" },
  });

  return (
    <ProjektProvider initialProjekte={JSON.parse(JSON.stringify(projekte))}>
      <DashboardClient session={session}>
        {children}
      </DashboardClient>
    </ProjektProvider>
  );
}

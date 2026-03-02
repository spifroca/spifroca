import { PrismaClient, Rolle, ProjektStatus, AusschreibungStatus, MeilensteinStatus, RisikoWahrscheinlichkeit, RisikoAuswirkung, BelegArt } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starte Seed...");

  // ─── Benutzer ──────────────────────────────────────────────────────────────
  const pw = (p: string) => bcrypt.hashSync(p, 10);

  const admin = await prisma.benutzer.upsert({
    where: { email: "admin@spiderfrog.ch" },
    update: {},
    create: { email: "admin@spiderfrog.ch", passwordHash: pw("Admin123!"), name: "Sandra Meier", rolle: Rolle.ADMINISTRATOR, mandant: "Spiderfrog AG", mfaAktiv: false },
  });
  const leiter = await prisma.benutzer.upsert({
    where: { email: "leiter@spiderfrog.ch" },
    update: {},
    create: { email: "leiter@spiderfrog.ch", passwordHash: pw("Leiter123!"), name: "Marco Weber", rolle: Rolle.PROJEKTLEITER, mandant: "Spiderfrog AG" },
  });
  await prisma.benutzer.upsert({
    where: { email: "controlling@spiderfrog.ch" },
    update: {},
    create: { email: "controlling@spiderfrog.ch", passwordHash: pw("Control123!"), name: "Beat Zimmermann", rolle: Rolle.CONTROLLING, mandant: "Spiderfrog AG", mfaAktiv: true },
  });
  await prisma.benutzer.upsert({
    where: { email: "planer@extern.ch" },
    update: {},
    create: { email: "planer@extern.ch", passwordHash: pw("Planer123!"), name: "Maria Keller", rolle: Rolle.EXTERNER_PLANER, mandant: "Keller Architektur" },
  });

  // ─── Projekte ──────────────────────────────────────────────────────────────
  const projekte = [
    { nummer: "16299.00", name: "Striegelpark Safenwil, Mehrfamilienhäuser", status: ProjektStatus.IN_AUSFUEHRUNG, gruppe: "Bern", budgetTotal: 4200000, budgetVerbraucht: 3150000, projektleiterId: leiter.id },
    { nummer: "16401",    name: "Zentrum Rietacker, Gewerbe-/Wohnüberbauung", status: ProjektStatus.IN_AUSFUEHRUNG, gruppe: "Zürich", budgetTotal: 2600000, budgetVerbraucht: 890000, projektleiterId: leiter.id },
    { nummer: "16355",    name: "Am Klostergarten, Neubau Gewerbezentrum", status: ProjektStatus.OFFERTE, gruppe: "Luzern", budgetTotal: 1800000, budgetVerbraucht: 320000 },
    { nummer: "16258",    name: "Umbau Sporthalle 'Hock', Basel", status: ProjektStatus.IN_AUSFUEHRUNG, gruppe: "Basel", budgetTotal: 3100000, budgetVerbraucht: 2900000 },
    { nummer: "16666",    name: "Hotel Concordia, Erweiterung Apparthotel", status: ProjektStatus.IN_VORBEREITUNG, gruppe: "Basel", budgetTotal: 6100000, budgetVerbraucht: 5950000 },
    { nummer: "16096",    name: "Schulhaus Zelgwiesen, Erweiterung Doppelturnhallen", status: ProjektStatus.IN_VORBEREITUNG, gruppe: "Luzern", budgetTotal: 5200000, budgetVerbraucht: 400000 },
    { nummer: "20001.MH", name: "Demo Musterprojekt", status: ProjektStatus.AKQUISITION, gruppe: "Zürich", budgetTotal: 800000, budgetVerbraucht: 0 },
  ];

  for (const p of projekte) {
    const proj = await prisma.projekt.upsert({ where: { nummer: p.nummer }, update: {}, create: p });

    // Kostenstellen
    await prisma.kostenstelle.createMany({ data: [
      { projektId: proj.id, bkp: "211", bezeichnung: "Baumeisterarbeiten", budget: p.budgetTotal! * 0.3, verbraucht: (p.budgetVerbraucht||0) * 0.3 },
      { projektId: proj.id, bkp: "221", bezeichnung: "Zimmerarbeiten", budget: p.budgetTotal! * 0.1, verbraucht: (p.budgetVerbraucht||0) * 0.1 },
      { projektId: proj.id, bkp: "231", bezeichnung: "Fassade", budget: p.budgetTotal! * 0.15, verbraucht: (p.budgetVerbraucht||0) * 0.12 },
      { projektId: proj.id, bkp: "241", bezeichnung: "Fenster / Aussentüren", budget: p.budgetTotal! * 0.08, verbraucht: (p.budgetVerbraucht||0) * 0.08 },
    ], skipDuplicates: true });

    // Meilensteine
    await prisma.meilenstein.createMany({ data: [
      { projektId: proj.id, bezeichnung: "Baugenehmigung erteilt", datum: new Date("2024-03-15"), status: MeilensteinStatus.ERLEDIGT },
      { projektId: proj.id, bezeichnung: "Rohbau Abnahme", datum: new Date("2025-05-30"), status: proj.status === ProjektStatus.IN_AUSFUEHRUNG ? MeilensteinStatus.IN_ARBEIT : MeilensteinStatus.OFFEN },
      { projektId: proj.id, bezeichnung: "Bauübergabe", datum: new Date("2025-11-30"), status: MeilensteinStatus.OFFEN },
    ], skipDuplicates: false });

    // Risiken
    await prisma.risiko.createMany({ data: [
      { projektId: proj.id, titel: "Lieferverzug Material", kategorie: "Lieferkette", wahrscheinlichkeit: RisikoWahrscheinlichkeit.MITTEL, auswirkung: RisikoAuswirkung.ERHEBLICH, massnahme: "Alternativlieferanten evaluieren" },
      { projektId: proj.id, titel: "Kostenüberschreitung", kategorie: "Finanziell", wahrscheinlichkeit: RisikoWahrscheinlichkeit.NIEDRIG, auswirkung: RisikoAuswirkung.GERING, massnahme: "Monatliches Controlling" },
    ], skipDuplicates: false });

    // Kommunikation
    await prisma.kommunikationsInfo.createMany({ data: [
      { projektId: proj.id, funktion: "Projektleitung", nummer: 18, name: "Marco Weber", abteilung: "Marketing / Finanzen (GL)", strasse: "Wülflingerstrasse 12", ort: "8400 Winterthur ZH", typ: "team", kontakte: JSON.stringify([{art:"Intern",wert:"+41 (52) 2690180"},{art:"Fax",wert:"+41 (52) 2690181"},{art:"E-Mail",wert:"weber@spiderfrog.ch"}]) },
      { projektId: proj.id, funktion: "Bauleiter", nummer: 30, name: "Burri Chris", abteilung: "Software-Entwicklung", strasse: "Wülflingerstrasse 12", ort: "8400 Winterthur ZH", typ: "team", kontakte: JSON.stringify([{art:"Intern",wert:"+41 (52) 2690130"}]) },
    ], skipDuplicates: false });
  }

  console.log("✅ Seed erfolgreich abgeschlossen!");
  console.log("\n📋 Demo-Zugänge:");
  console.log("  admin@spiderfrog.ch        / Admin123!   (Administrator)");
  console.log("  leiter@spiderfrog.ch       / Leiter123!  (Projektleiter)");
  console.log("  controlling@spiderfrog.ch  / Control123! (Controlling, 2FA)");
  console.log("  planer@extern.ch       / Planer123!  (Externer Planer)");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

// ─── Für alle Benutzer automatisch einen Kontakt erstellen ───────────────────
console.log("👥 Erstelle Kontakte für bestehende Benutzer...");

const alleBenutzer = await prisma.benutzer.findMany({ where: { personId: null } });

for (const b of alleBenutzer) {
  const nameParts = b.name.split(" ");
  const vorname   = nameParts.length > 1 ? nameParts[0] : null;
  const name      = nameParts.length > 1 ? nameParts.slice(1).join(" ") : b.name;

  const person = await prisma.person.create({
    data: {
      typ:    "PRIVATPERSON",
      rollen: ["BENUTZER"],
      name,
      vorname,
      email: b.email,
    },
  });

  await prisma.benutzer.update({
    where: { id: b.id },
    data:  { personId: person.id },
  });

  console.log(`  ✅ Kontakt für ${b.name} erstellt`);
}

console.log("✅ Seed abgeschlossen!");

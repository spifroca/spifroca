import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const pw = (p: string) => bcrypt.hashSync(p, 10);

async function main() {
  console.log("🌱 Starte Seed...");

  // ─── Personen (Kontakte) ────────────────────────────────────────────────────

  // Firmen
  const firmaSpiderfrog = await prisma.person.upsert({
    where: { id: "firm-spiderfrog" },
    update: {},
    create: {
      id: "firm-spiderfrog",
      typ: "FIRMA", rollen: ["PLANER"],
      name: "Spiderfrog AG", firmaName: "Spiderfrog AG",
      strasse: "Industriestrasse 12", plz: "5242", ort: "Lupfig", land: "CH",
      email: "info@spiderfrog.ch", telefon: "+41 56 123 45 67",
      webseite: "https://spiderfrog.ch", uid: "CHE-123.456.789",
    },
  });

  const firmaRealNorth = await prisma.person.upsert({
    where: { id: "firm-realnorth" },
    update: {},
    create: {
      id: "firm-realnorth",
      typ: "FIRMA", rollen: ["BAUHERR"],
      name: "Real North AG", firmaName: "Real North AG",
      strasse: "Unternehmer-Park 3", plz: "6340", ort: "Baar", land: "CH",
      email: "verwaltung@realnorth.ch", telefon: "+41 41 552 53 63",
      webseite: "https://realnorth.ch", uid: "CHE-987.654.321",
    },
  });

  const firmaBauAG = await prisma.person.upsert({
    where: { id: "firm-bauag" },
    update: {},
    create: {
      id: "firm-bauag",
      typ: "FIRMA", rollen: ["LIEFERANT", "UNTERNEHMER"],
      name: "Müller Bau AG", firmaName: "Müller Bau AG",
      strasse: "Werkstrasse 8", plz: "5400", ort: "Baden", land: "CH",
      email: "info@mueller-bau.ch", telefon: "+41 56 222 33 44",
      uid: "CHE-456.789.123", iban: "CH93 0076 2011 6238 5295 7",
    },
  });

  const firmaElektro = await prisma.person.upsert({
    where: { id: "firm-elektro" },
    update: {},
    create: {
      id: "firm-elektro",
      typ: "FIRMA", rollen: ["LIEFERANT"],
      name: "Elektro Huber AG", firmaName: "Elektro Huber AG",
      strasse: "Stromgasse 5", plz: "5600", ort: "Lenzburg", land: "CH",
      email: "info@elektro-huber.ch", telefon: "+41 62 333 44 55",
      iban: "CH56 0483 5012 3456 7800 9",
    },
  });

  // Privatpersonen
  const personSandra = await prisma.person.upsert({
    where: { id: "pers-sandra" },
    update: {},
    create: {
      id: "pers-sandra",
      typ: "PRIVATPERSON", rollen: ["BENUTZER", "PLANER"],
      name: "Meier", vorname: "Sandra",
      email: "sandra.meier@spiderfrog.ch",
      telefon: "+41 79 123 45 67",
      funktion: "Projektleiterin",
      arbeitgeberId: firmaSpiderfrog.id,
      strasse: "Hauptstrasse 22", plz: "5242", ort: "Lupfig", land: "CH",
      sprache: "DE",
    },
  });

  const personAdmin = await prisma.person.upsert({
    where: { id: "pers-admin" },
    update: {},
    create: {
      id: "pers-admin",
      typ: "PRIVATPERSON", rollen: ["BENUTZER"],
      name: "Administrator", vorname: "System",
      email: "admin@spiderfrog.ch",
      funktion: "System Administrator",
      arbeitgeberId: firmaSpiderfrog.id,
      sprache: "DE",
    },
  });

  const personThomas = await prisma.person.upsert({
    where: { id: "pers-thomas" },
    update: {},
    create: {
      id: "pers-thomas",
      typ: "PRIVATPERSON", rollen: ["BENUTZER", "PLANER"],
      name: "Brun", vorname: "Thomas",
      email: "thomas.brun@spiderfrog.ch",
      telefon: "+41 79 234 56 78",
      funktion: "Architekt",
      arbeitgeberId: firmaSpiderfrog.id,
      sprache: "DE",
    },
  });

  const personKlaus = await prisma.person.upsert({
    where: { id: "pers-klaus" },
    update: {},
    create: {
      id: "pers-klaus",
      typ: "PRIVATPERSON", rollen: ["BAUHERR"],
      name: "Schneider", vorname: "Klaus",
      email: "k.schneider@realnorth.ch",
      telefon: "+41 41 552 53 60",
      funktion: "Geschäftsführer",
      arbeitgeberId: firmaRealNorth.id,
      sprache: "DE",
    },
  });

  const personMaria = await prisma.person.upsert({
    where: { id: "pers-maria" },
    update: {},
    create: {
      id: "pers-maria",
      typ: "PRIVATPERSON", rollen: ["KONTAKT"],
      name: "Vogel", vorname: "Maria",
      email: "m.vogel@mueller-bau.ch",
      telefon: "+41 56 222 33 45",
      funktion: "Projektleiterin Bau",
      arbeitgeberId: firmaBauAG.id,
      sprache: "DE",
    },
  });

  const personReto = await prisma.person.upsert({
    where: { id: "pers-reto" },
    update: {},
    create: {
      id: "pers-reto",
      typ: "PRIVATPERSON", rollen: ["BENUTZER"],
      name: "Keller", vorname: "Reto",
      email: "controlling@spiderfrog.ch",
      telefon: "+41 79 345 67 89",
      funktion: "Controller",
      arbeitgeberId: firmaSpiderfrog.id,
      sprache: "DE",
    },
  });

  // ─── Benutzer ───────────────────────────────────────────────────────────────

  const admin = await prisma.benutzer.upsert({
    where: { email: "admin@spiderfrog.ch" },
    update: {},
    create: {
      email: "admin@spiderfrog.ch",
      passwordHash: pw("Admin123!"),
      name: "System Administrator",
      rolle: "ADMINISTRATOR",
      personId: personAdmin.id,
    },
  });

  const sandra = await prisma.benutzer.upsert({
    where: { email: "sandra.meier@spiderfrog.ch" },
    update: {},
    create: {
      email: "sandra.meier@spiderfrog.ch",
      passwordHash: pw("Sandra123!"),
      name: "Sandra Meier",
      rolle: "PROJEKTLEITER",
      personId: personSandra.id,
    },
  });

  const thomas = await prisma.benutzer.upsert({
    where: { email: "thomas.brun@spiderfrog.ch" },
    update: {},
    create: {
      email: "thomas.brun@spiderfrog.ch",
      passwordHash: pw("Thomas123!"),
      name: "Thomas Brun",
      rolle: "PROJEKTLEITER",
      personId: personThomas.id,
    },
  });

  const reto = await prisma.benutzer.upsert({
    where: { email: "controlling@spiderfrog.ch" },
    update: {},
    create: {
      email: "controlling@spiderfrog.ch",
      passwordHash: pw("Control123!"),
      name: "Reto Keller",
      rolle: "CONTROLLING",
      personId: personReto.id,
    },
  });

  // ─── Projekte ───────────────────────────────────────────────────────────────

  const projekte = [
    {
      id: "proj-001",
      nummer: "2024-001",
      name: "Wohnüberbauung Striegelpark Safenwil",
      gruppe: "Wohnbau",
      status: "IN_AUSFUEHRUNG",
      projektleiterId: sandra.id,
      budgetGesamt: 4800000,
      budgetVerbraucht: 2100000,
      fortschritt: 44,
      beschreibung: "12 Eigentumswohnungen, 3-5 Zimmer, Minergie-Standard",
    },
    {
      id: "proj-002",
      nummer: "2024-002",
      name: "Zentrum Rietacker Küttigen",
      gruppe: "Gewerbe",
      status: "PLANUNG",
      projektleiterId: thomas.id,
      budgetGesamt: 12500000,
      budgetVerbraucht: 450000,
      fortschritt: 12,
      beschreibung: "Neubau Gewerbezentrum mit Büro- und Ladenflächen",
    },
    {
      id: "proj-003",
      nummer: "2024-003",
      name: "Sanierung Schulhaus Brugg",
      gruppe: "Öffentlich",
      status: "IN_AUSFUEHRUNG",
      projektleiterId: sandra.id,
      budgetGesamt: 3200000,
      budgetVerbraucht: 2800000,
      fortschritt: 87,
      beschreibung: "Energetische Sanierung, neue Fenster, Dach und HLKSE",
    },
    {
      id: "proj-004",
      nummer: "2023-008",
      name: "Logieren am Rennweg Zürich",
      gruppe: "Wohnbau",
      status: "ABGESCHLOSSEN",
      projektleiterId: thomas.id,
      budgetGesamt: 2100000,
      budgetVerbraucht: 2050000,
      fortschritt: 100,
      beschreibung: "4 voll möblierte Appartements in der Zürcher Altstadt",
    },
    {
      id: "proj-005",
      nummer: "2025-001",
      name: "Im Birkenhain Rudolfstetten",
      gruppe: "Wohnbau",
      status: "VORPROJEKT",
      projektleiterId: sandra.id,
      budgetGesamt: 18000000,
      budgetVerbraucht: 120000,
      fortschritt: 5,
      beschreibung: "Neues Wohnquartier am Islerenwald, ca. 60 Wohneinheiten",
    },
    {
      id: "proj-006",
      nummer: "2024-004",
      name: "Umbau Bürogebäude Baden",
      gruppe: "Gewerbe",
      status: "PLANUNG",
      projektleiterId: thomas.id,
      budgetGesamt: 850000,
      budgetVerbraucht: 95000,
      fortschritt: 18,
      beschreibung: "Neugestaltung Bürolandschaft, Open Space Konzept",
    },
  ];

  for (const p of projekte) {
    await prisma.projekt.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        nummer: p.nummer,
        name: p.name,
        gruppe: p.gruppe,
        status: p.status as any,
        projektleiterId: p.projektleiterId,
        budgetGesamt: p.budgetGesamt,
        budgetVerbraucht: p.budgetVerbraucht,
        fortschritt: p.fortschritt,
        beschreibung: p.beschreibung,
      },
    });
    console.log(`  ✅ Projekt: ${p.nummer} ${p.name}`);
  }

  // ─── Projekt-Personen Verknüpfungen ─────────────────────────────────────────

  const verknuepfungen = [
    { projektId: "proj-001", personId: personSandra.id,  funktion: "Projektleiterin" },
    { projektId: "proj-001", personId: personKlaus.id,   funktion: "Bauherr" },
    { projektId: "proj-001", personId: firmaBauAG.id,    funktion: "Generalunternehmer" },
    { projektId: "proj-002", personId: personThomas.id,  funktion: "Architekt" },
    { projektId: "proj-002", personId: firmaRealNorth.id,funktion: "Bauherr" },
    { projektId: "proj-003", personId: personSandra.id,  funktion: "Projektleiterin" },
    { projektId: "proj-003", personId: firmaBauAG.id,    funktion: "Totalunternehmer" },
    { projektId: "proj-003", personId: firmaElektro.id,  funktion: "Elektroplaner" },
    { projektId: "proj-005", personId: personSandra.id,  funktion: "Projektleiterin" },
    { projektId: "proj-005", personId: firmaRealNorth.id,funktion: "Bauherr" },
  ];

  for (const v of verknuepfungen) {
    await prisma.projektPerson.upsert({
      where: { projektId_personId: { projektId: v.projektId, personId: v.personId } },
      update: {},
      create: v,
    });
  }

  // ─── Risiken ─────────────────────────────────────────────────────────────────

  await prisma.risiko.createMany({
    skipDuplicates: true,
    data: [
      { projektId: "proj-001", titel: "Lieferverzug Fenster", wahrscheinlichkeit: "HOCH", auswirkung: "MITTEL", massnahme: "Frühzeitig bestellen, Alternativlieferant evaluieren", status: "OFFEN" },
      { projektId: "proj-001", titel: "Bodenkontamination", wahrscheinlichkeit: "NIEDRIG", auswirkung: "HOCH", massnahme: "Bodenuntersuchung abgeschlossen, keine Kontamination", status: "GESCHLOSSEN" },
      { projektId: "proj-003", titel: "Asbest in Altbauschichten", wahrscheinlichkeit: "MITTEL", auswirkung: "HOCH", massnahme: "Schadstoffgutachter beauftragt, Sanierungskonzept in Erarbeitung", status: "IN_BEARBEITUNG" },
      { projektId: "proj-005", titel: "Baubewilligung verzögert", wahrscheinlichkeit: "MITTEL", auswirkung: "HOCH", massnahme: "Frühzeitiger Dialog mit Gemeinde Rudolfstetten", status: "IN_BEARBEITUNG" },
    ],
  });

  // ─── Meilensteine ────────────────────────────────────────────────────────────

  await prisma.meilenstein.createMany({
    skipDuplicates: true,
    data: [
      { projektId: "proj-001", titel: "Baubewilligung erteilt",     datum: new Date("2024-03-15"), status: "ERLEDIGT" },
      { projektId: "proj-001", titel: "Rohbau abgeschlossen",       datum: new Date("2024-09-30"), status: "ERLEDIGT" },
      { projektId: "proj-001", titel: "Innenausbau fertig",         datum: new Date("2025-04-30"), status: "IN_ARBEIT" },
      { projektId: "proj-001", titel: "Übergabe an Käufer",         datum: new Date("2025-07-01"), status: "OFFEN" },
      { projektId: "proj-003", titel: "Gerüst gestellt",            datum: new Date("2024-05-01"), status: "ERLEDIGT" },
      { projektId: "proj-003", titel: "Fenster eingebaut",          datum: new Date("2024-10-15"), status: "ERLEDIGT" },
      { projektId: "proj-003", titel: "Abnahme Gemeinde",           datum: new Date("2025-03-15"), status: "IN_VERZUG" },
      { projektId: "proj-005", titel: "Vorprojekt genehmigt",       datum: new Date("2025-06-01"), status: "OFFEN" },
      { projektId: "proj-005", titel: "Baubewilligung eingereicht", datum: new Date("2025-09-01"), status: "OFFEN" },
    ],
  });

  console.log("\n✅ Seed erfolgreich abgeschlossen!");
  console.log("\n📋 Benutzer-Zugänge:");
  console.log("  admin@spiderfrog.ch       | Admin123!  | Administrator");
  console.log("  sandra.meier@spiderfrog.ch| Sandra123! | Projektleiterin");
  console.log("  thomas.brun@spiderfrog.ch | Thomas123! | Projektleiter");
  console.log("  controlling@spiderfrog.ch | Control123!| Controlling");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

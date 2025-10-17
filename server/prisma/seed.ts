import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // catégories optionnelles (non utilisées maintenant, mais utiles plus tard)

  // --- Catégories : upsert (compatible SQLite)
  const categories = [
    { name: "Télécom", color: "#0ea5e9" },
    { name: "Courses", color: "#22c55e" },
    { name: "Loisirs", color: "#a78bfa" },
  ];

  for (const c of categories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: { color: c.color },
      create: c,
    });
  }

  // échantillon SG (dates FR -> stockées en ISO)
  const tx = [
    {
      bank: "SG",
      accountIban: null,
      dateOperation: new Date("2025-09-03"),
      dateValeur: new Date("2025-09-04"),
      label: "CB ORANGE FACTURE 09/2025",
      details: "PRLV SEPA ORANGE FRANCE SA",
      debit: 39.99, credit: 0, amount: -39.99,
      yearMonth: "2025-09", sourceFile: "SG-2025-09.csv"
    },
    {
      bank: "SG",
      accountIban: null,
      dateOperation: new Date("2025-09-05"),
      dateValeur: new Date("2025-09-06"),
      label: "CARREFOUR MARKET",
      details: "CB 04/09",
      debit: 68.12, credit: 0, amount: -68.12,
      yearMonth: "2025-09", sourceFile: "SG-2025-09.csv"
    },
    {
      bank: "SG",
      accountIban: null,
      dateOperation: new Date("2025-09-28"),
      dateValeur: new Date("2025-09-29"),
      label: "VIREMENT RECU CLIENT X",
      details: null,
      debit: 0, credit: 1200, amount: 1200,
      yearMonth: "2025-09", sourceFile: "SG-2025-09.csv"
    },
    {
      bank: "SG",
      accountIban: null,
      dateOperation: new Date("2025-10-02"),
      dateValeur: new Date("2025-10-02"),
      label: "AMAZON EU",
      details: "CB 01/10",
      debit: 25.90, credit: 0, amount: -25.90,
      yearMonth: "2025-10", sourceFile: "SG-2025-10.csv"
    }
  ];
console.log("Seeding start");
  await prisma.transaction.createMany({ data: tx });
  console.log("Seeding done");
}

main().then(async () => {
  await prisma.$disconnect();
}).catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

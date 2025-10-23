import { PrismaClient } from "../generated/prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Réinitialisation de la base...");

  await prisma.transaction.deleteMany();
  await prisma.entityTag.deleteMany();
  await prisma.entity.deleteMany();
  await prisma.account.deleteMany();
  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();

  console.log("✅ Données nettoyées");

// --- Catégories
await prisma.category.createMany({
  data: [
    { name: "Logement", color: "#795548", icon: "home" },
    { name: "Électricité", color: "#FFC107", icon: "zap" },
    { name: "Eau", color: "#03A9F4", icon: "droplets" },
    { name: "Internet / TV / Fixe", color: "#3F51B5", icon: "wifi" },
    { name: "Assurance", color: "#607D8B", icon: "shield-check" },
    { name: "Banque / Frais bancaires", color: "#9E9E9E", icon: "credit-card" },
    { name: "Transports", color: "#2196F3", icon: "car" },
    { name: "Santé", color: "#009688", icon: "heart" },
    { name: "Abonnements", color: "#3F51B5", icon: "smartphone" },
    { name: "Vie quotidienne", color: "#8BC34A", icon: "shopping-cart" },
    { name: "Loisirs & culture", color: "#9C27B0", icon: "film" },
    { name: "Épargne", color: "#4CAF50", icon: "piggy-bank" },
    { name: "Investissement immobilier", color: "#FF9800", icon: "building-2" },
    { name: "Revenus", color: "#4CAF50", icon: "arrow-down-circle" },
  ],
});
  const categoriesMap = Object.fromEntries(
    (await prisma.category.findMany()).map((c) => [c.name, c.id])
  );

  // --- Tags
  await prisma.tag.createMany({
    data: [
      { name: "pro", color: "#4CAF50" },
      { name: "perso", color: "#607D8B" },
      { name: "charges", color: "#E53935" },
      { name: "récurrent", color: "#2196F3" },
    ],
  });

  // --- Comptes
  const comptePro = await prisma.account.create({
    data: { name: "Compte Pro", bankCode: "SG", color: "#2563eb" },
  });
  const comptePerso = await prisma.account.create({
    data: { name: "Compte Perso", bankCode: "BNP", color: "#16a34a" },
  });

  // // --- Entités spécifiques à chaque compte
  // const [amazonPro, amazonPerso, edf, uberPro, uberPerso, doctolib, orange, clientX] =
  //   await prisma.$transaction([
  //     prisma.entity.create({
  //       data: {
  //         name: "Amazon",
  //         accountId: comptePro.id,
  //         categoryId: categoriesMap["Vie quotidienne"],
  //       },
  //     }),
  //     prisma.entity.create({
  //       data: {
  //         name: "Amazon",
  //         accountId: comptePerso.id,
  //         categoryId: categoriesMap["Loisirs & culture"],
  //       },
  //     }),
  //     prisma.entity.create({
  //       data: {
  //         name: "EDF",
  //         accountId: comptePerso.id,
  //         categoryId: categoriesMap["Logement"],
  //       },
  //     }),
  //     prisma.entity.create({
  //       data: {
  //         name: "Uber",
  //         accountId: comptePro.id,
  //         categoryId: categoriesMap["Transports"],
  //       },
  //     }),
  //     prisma.entity.create({
  //       data: {
  //         name: "Uber",
  //         accountId: comptePerso.id,
  //         categoryId: categoriesMap["Transports"],
  //       },
  //     }),
  //     prisma.entity.create({
  //       data: {
  //         name: "Doctolib",
  //         accountId: comptePerso.id,
  //         categoryId: categoriesMap["Santé"],
  //       },
  //     }),
  //     prisma.entity.create({
  //       data: {
  //         name: "Orange",
  //         accountId: comptePerso.id,
  //         categoryId: categoriesMap["Abonnements"],
  //       },
  //     }),
  //     prisma.entity.create({
  //       data: {
  //         name: "Client X",
  //         accountId: comptePro.id,
  //         categoryId: categoriesMap["Revenus"],
  //       },
  //     }),
  //   ]);

  // // --- Transactions de test
  // const txData = [
  //   // Compte pro
  //   {
  //     bank: "SG",
  //     accountId: comptePro.id,
  //     dateOperation: new Date("2025-09-01"),
  //     label: "Paiement Amazon fournitures",
  //     details: "Papeterie",
  //     debit: 50,
  //     credit: 0,
  //     amount: -50,
  //     yearMonth: "2025-09",
  //     sourceFile: "seed",
  //     typeOperation: "PAIEMENT CB",
  //     entityId: amazonPro.id,
  //     fingerprint: randomUUID(),
  //   },
  //   {
  //     bank: "SG",
  //     accountId: comptePro.id,
  //     dateOperation: new Date("2025-09-05"),
  //     label: "Virement Client X",
  //     debit: 0,
  //     credit: 500,
  //     amount: 500,
  //     yearMonth: "2025-09",
  //     sourceFile: "seed",
  //     typeOperation: "VIREMENT",
  //     entityId: clientX.id,
  //     fingerprint: randomUUID(),
  //   },
  //   {
  //     bank: "SG",
  //     accountId: comptePro.id,
  //     dateOperation: new Date("2025-09-10"),
  //     label: "Uber business",
  //     debit: 25,
  //     credit: 0,
  //     amount: -25,
  //     yearMonth: "2025-09",
  //     sourceFile: "seed",
  //     typeOperation: "PAIEMENT CB",
  //     entityId: uberPro.id,
  //     fingerprint: randomUUID(),
  //   },

  //   // Compte perso
  //   {
  //     bank: "BNP",
  //     accountId: comptePerso.id,
  //     dateOperation: new Date("2025-09-02"),
  //     label: "Amazon - achat perso",
  //     debit: 80,
  //     credit: 0,
  //     amount: -80,
  //     yearMonth: "2025-09",
  //     sourceFile: "seed",
  //     typeOperation: "PAIEMENT CB",
  //     entityId: amazonPerso.id,
  //     fingerprint: randomUUID(),
  //   },
  //   {
  //     bank: "BNP",
  //     accountId: comptePerso.id,
  //     dateOperation: new Date("2025-09-03"),
  //     label: "EDF facture août",
  //     debit: 100,
  //     credit: 0,
  //     amount: -100,
  //     yearMonth: "2025-09",
  //     sourceFile: "seed",
  //     typeOperation: "PRLV",
  //     entityId: edf.id,
  //     fingerprint: randomUUID(),
  //   },
  //   {
  //     bank: "BNP",
  //     accountId: comptePerso.id,
  //     dateOperation: new Date("2025-09-04"),
  //     label: "Orange abonnement mobile",
  //     debit: 40,
  //     credit: 0,
  //     amount: -40,
  //     yearMonth: "2025-09",
  //     sourceFile: "seed",
  //     typeOperation: "PRLV",
  //     entityId: orange.id,
  //     fingerprint: randomUUID(),
  //   },
  //   {
  //     bank: "BNP",
  //     accountId: comptePerso.id,
  //     dateOperation: new Date("2025-09-05"),
  //     label: "Remboursement mutuelle",
  //     debit: 0,
  //     credit: 75,
  //     amount: 75,
  //     yearMonth: "2025-09",
  //     sourceFile: "seed",
  //     typeOperation: "VIREMENT",
  //     entityId: doctolib.id,
  //     fingerprint: randomUUID(),
  //   },
  //   {
  //     bank: "BNP",
  //     accountId: comptePerso.id,
  //     dateOperation: new Date("2025-09-06"),
  //     label: "Uber",
  //     debit: 20,
  //     credit: 0,
  //     amount: -20,
  //     yearMonth: "2025-09",
  //     sourceFile: "seed",
  //     typeOperation: "PAIEMENT CB",
  //     entityId: uberPerso.id,
  //     fingerprint: randomUUID(),
  //   },
  //   {
  //     bank: "BNP",
  //     accountId: comptePerso.id,
  //     dateOperation: new Date("2025-09-08"),
  //     label: "Doctolib consultation",
  //     debit: 60,
  //     credit: 0,
  //     amount: -60,
  //     yearMonth: "2025-09",
  //     sourceFile: "seed",
  //     typeOperation: "PAIEMENT CB",
  //     entityId: doctolib.id,
  //     fingerprint: randomUUID(),
  //   },
  //   {
  //     bank: "BNP",
  //     accountId: comptePerso.id,
  //     dateOperation: new Date("2025-09-10"),
  //     label: "Salaire septembre",
  //     debit: 0,
  //     credit: 2000,
  //     amount: 2000,
  //     yearMonth: "2025-09",
  //     sourceFile: "seed",
  //     typeOperation: "VIREMENT",
  //     fingerprint: randomUUID(),
  //   },
  // ];

  // await prisma.transaction.createMany({ data: txData });

  console.log("✅ Données d’exemple insérées avec succès !");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

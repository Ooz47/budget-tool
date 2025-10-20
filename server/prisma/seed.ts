import { PrismaClient } from "../generated/prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.category.createMany({
    data: [
      { name: "Logement", color: "#795548", icon: "home" },
      { name: "Transports", color: "#2196F3", icon: "car" },
      { name: "Santé", color: "#009688", icon: "heart" },
      { name: "Abonnements", color: "#3F51B5", icon: "smartphone" },
      { name: "Impôts et taxes", color: "#E53935", icon: "percent" },
      { name: "Vie quotidienne", color: "#8BC34A", icon: "shopping-cart" },
      { name: "Loisirs & culture", color: "#9C27B0", icon: "film" },
      { name: "Revenus", color: "#4CAF50", icon: "arrow-down-circle" },
      { name: "Épargne", color: "#FF9800", icon: "piggy-bank" },
      { name: "Autres", color: "#9E9E9E", icon: "dots-horizontal" },
    ],

  });

  await prisma.tag.createMany({
    data: [
      { name: "charges", color: "#E53935" },
      { name: "récurrent", color: "#2196F3" },
      { name: "pro", color: "#4CAF50" },
      { name: "perso", color: "#607D8B" },
      { name: "à_vérifier", color: "#FFC107" },
    ],
  });
}

main().finally(() => prisma.$disconnect());

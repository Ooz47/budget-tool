import { FastifyInstance } from "fastify";

export async function categoryRoutes(app: FastifyInstance) {
  // 🟢 Liste toutes les catégories (avec enfants)
  app.get("/categories", async (req, reply) => {
    try {
      const categories = await app.prisma.category.findMany({
        where: { parentCategoryId: null },
        include: { children: true },
        orderBy: { name: "asc" },
      });
      return categories;
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // 🟡 Crée une nouvelle catégorie
  app.post("/categories", async (req, reply) => {
    try {
      const { name, color, icon, description, parentCategoryId } = req.body as {
        name: string;
        color?: string;
        icon?: string;
        description?: string;
        parentCategoryId?: string | null;
      };

      if (!name?.trim()) {
        return reply.code(400).send({ error: "Le champ 'name' est obligatoire." });
      }

      const existing = await app.prisma.category.findUnique({ where: { name } });
      if (existing) {
        return reply.code(409).send({ error: "Une catégorie avec ce nom existe déjà." });
      }

      const newCat = await app.prisma.category.create({
        data: {
          name: name.trim(),
          color,
          icon,
          description,
          parentCategoryId: parentCategoryId || null,
        },
      });

      return reply.code(201).send(newCat);
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // 🟠 Met à jour une catégorie
  app.patch("/categories/:id", async (req, reply) => {
    try {
      const id = req.params["id"];
      const { name, color, icon, description, parentCategoryId } = req.body as {
        name?: string;
        color?: string;
        icon?: string;
        description?: string;
        parentCategoryId?: string | null;
      };

      const updated = await app.prisma.category.update({
        where: { id },
        data: {
          name,
          color,
          icon,
          description,
          parentCategoryId: parentCategoryId ?? null,
        },
      });

      return updated;
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // 🔴 Supprime une catégorie (avec sécurité)
  app.delete("/categories/:id", async (req, reply) => {
    try {
      const id = req.params["id"];

      // Vérifie si des sous-catégories existent
      const subCount = await app.prisma.category.count({
        where: { parentCategoryId: id },
      });

      if (subCount > 0) {
        return reply.code(400).send({
          error: "Impossible de supprimer une catégorie ayant des sous-catégories.",
        });
      }

      await app.prisma.category.delete({ where: { id } });
      return { deleted: true };
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });
}

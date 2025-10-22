import { FastifyInstance } from "fastify";

export async function entityRoutes(app: FastifyInstance) {
  // 🟢 Liste toutes les entités du compte actif
  app.get("/entities", async (req, reply) => {
    try {
      const { accountId } = (req.query as any) ?? {};
      if (!accountId) return reply.code(400).send({ error: "Aucun compte sélectionné" });

      const entities = await app.prisma.entity.findMany({
        where: { accountId },
        include: {
          category: true,
          tags: { include: { tag: true } },
          aliases: true,
          aliasOf: true,
        },
        orderBy: { name: "asc" },
      });

      return entities;
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // 🟡 Récupère une entité spécifique
  app.get("/entities/:id", async (req, reply) => {
    try {
      const id = req.params["id"];
      const entity = await app.prisma.entity.findUnique({
        where: { id },
        include: {
          category: true,
          tags: { include: { tag: true } },
          aliases: true,
          aliasOf: true,
        },
      });

      if (!entity) return reply.code(404).send({ error: "Entité non trouvée." });
      return entity;
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // 🟢 Crée une nouvelle entité (rattachée à un compte)
  app.post("/entities", async (req, reply) => {
    try {
      const { name, accountId, categoryId, tagIds } = req.body as {
        name: string;
        accountId: string;
        categoryId?: string | null;
        tagIds?: string[];
      };

      if (!name?.trim()) return reply.code(400).send({ error: "Le champ 'name' est obligatoire." });
      if (!accountId) return reply.code(400).send({ error: "Le champ 'accountId' est obligatoire." });

      const existing = await app.prisma.entity.findFirst({
        where: { name, accountId },
      });
      if (existing) {
        return reply.code(409).send({ error: "Cette entité existe déjà pour ce compte." });
      }

      const entity = await app.prisma.entity.create({
        data: {
          name: name.trim(),
          accountId,
          categoryId: categoryId || null,
          tags: {
            create:
              tagIds?.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })) || [],
          },
        },
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      });

      return reply.code(201).send(entity);
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // 🟠 Met à jour une entité
  app.patch("/entities/:id", async (req, reply) => {
    try {
      const id = req.params["id"];
      const { name, categoryId, aliasOfId, tagIds } = req.body as {
        name?: string;
        categoryId?: string | null;
        aliasOfId?: string | null;
        tagIds?: string[];
      };

      const updated = await app.prisma.entity.update({
        where: { id },
        data: {
          name,
          categoryId: categoryId ?? null,
          aliasOfId: aliasOfId ?? null,
          tags: {
            deleteMany: {},
            create:
              tagIds?.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })) || [],
          },
        },
        include: {
          category: true,
          tags: { include: { tag: true } },
        },
      });

      return updated;
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // 🔴 Supprime une entité
  app.delete("/entities/:id", async (req, reply) => {
    try {
      const id = req.params["id"];
      await app.prisma.entity.delete({ where: { id } });
      return { deleted: true };
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // 🧩 Fusionne plusieurs entités dans une principale (alias)
  app.post("/entities/:id/merge", async (req, reply) => {
    try {
      const id = req.params["id"];
      const { aliasIds } = req.body as { aliasIds: string[] };

      const currentAliases = await app.prisma.entity.findMany({
        where: { aliasOfId: id },
        select: { id: true },
      });

      const currentIds = currentAliases.map((a) => a.id);
      const newIds = aliasIds || [];

      // Détacher les alias décochés
      const toDetach = currentIds.filter((x) => !newIds.includes(x));
      if (toDetach.length > 0) {
        await app.prisma.entity.updateMany({
          where: { id: { in: toDetach } },
          data: { aliasOfId: null },
        });
      }

      // Attacher les nouveaux alias
      const toAttach = newIds.filter((x) => !currentIds.includes(x));
      if (toAttach.length > 0) {
        await app.prisma.entity.updateMany({
          where: { id: { in: toAttach } },
          data: { aliasOfId: id },
        });
      }

      return {
        success: true,
        mergedInto: id,
        attached: toAttach,
        detached: toDetach,
      };
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // ✏️ Met à jour le nom d'affichage
  app.patch("/entities/:id/display", async (req, reply) => {
    try {
      const id = req.params["id"];
      const { displayName } = req.body as { displayName?: string | null };

      const updated = await app.prisma.entity.update({
        where: { id },
        data: { displayName: displayName?.trim() || null },
        select: { id: true, name: true, displayName: true, updatedAt: true },
      });

      return updated;
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });
}

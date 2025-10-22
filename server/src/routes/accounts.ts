import { FastifyInstance } from "fastify";

export async function accountRoutes(app: FastifyInstance) {
  // 🟢 Liste tous les comptes
  app.get("/accounts", async (req, reply) => {
    try {
      const accounts = await app.prisma.account.findMany({
        orderBy: { createdAt: "asc" },
        include: {
          transactions: { select: { id: true } },
          entities: { select: { id: true } }, // ✅ remplacé entityConfigs → entities
        },
      });

      // On ajoute quelques stats utiles
      const data = accounts.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        bankCode: a.bankCode,
        color: a.color,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        transactionCount: a.transactions.length,
        entityCount: a.entities.length, // ✅ renommé
      }));

      return data;
    } catch (e: any) {
      app.log.error(e);
      reply.code(500).send({ error: e.message });
    }
  });

  // 🟡 Crée un nouveau compte
  app.post("/accounts", async (req, reply) => {
    try {
      const { name, description, bankCode, color } = req.body as {
        name: string;
        description?: string;
        bankCode?: string;
        color?: string;
      };

      if (!name?.trim()) {
        return reply.code(400).send({ error: "Le nom du compte est obligatoire." });
      }

      const existing = await app.prisma.account.findUnique({ where: { name } });
      if (existing) {
        return reply.code(409).send({ error: "Un compte avec ce nom existe déjà." });
      }

      const account = await app.prisma.account.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          bankCode: bankCode?.trim() || null,
          color: color || "#999999",
        },
      });

      return reply.code(201).send(account);
    } catch (e: any) {
      app.log.error(e);
      reply.code(500).send({ error: e.message });
    }
  });

  // 🟠 Met à jour un compte
  app.patch("/accounts/:id", async (req, reply) => {
    try {
      const id = req.params["id"];
      const { name, description, bankCode, color } = req.body as {
        name?: string;
        description?: string;
        bankCode?: string;
        color?: string;
      };

      const updated = await app.prisma.account.update({
        where: { id },
        data: { name, description, bankCode, color },
      });

      return updated;
    } catch (e: any) {
      app.log.error(e);
      reply.code(500).send({ error: e.message });
    }
  });

  // 🔴 Supprime un compte
  app.delete("/accounts/:id", async (req, reply) => {
    try {
      const id = req.params["id"];

      const txCount = await app.prisma.transaction.count({ where: { accountId: id } });
      if (txCount > 0) {
        return reply.code(400).send({
          error: `Impossible de supprimer : ${txCount} transaction(s) associée(s) à ce compte.`,
        });
      }

      await app.prisma.account.delete({ where: { id } });
      return { deleted: true };
    } catch (e: any) {
      app.log.error(e);
      reply.code(500).send({ error: e.message });
    }
  });

  // 📊 Vue d’ensemble rapide
  app.get("/accounts/summary", async (req, reply) => {
    try {
      const accounts = await app.prisma.account.findMany({
        include: {
          transactions: {
            select: { dateOperation: true },
            orderBy: { dateOperation: "desc" },
            take: 1,
          },
        },
      });

      const summary = accounts.map((a) => ({
        id: a.id,
        name: a.name,
        color: a.color,
        transactionCount: a.transactions.length,
        lastTransaction:
          a.transactions.length > 0 ? a.transactions[0].dateOperation : null,
      }));

      return summary;
    } catch (e: any) {
      app.log.error(e);
      reply.code(500).send({ error: e.message });
    }
  });
}

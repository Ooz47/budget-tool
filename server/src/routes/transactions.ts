import { FastifyInstance } from "fastify";

export async function transactionsRoutes(app: FastifyInstance) {
  app.get("/transactions", async (req, reply) => {
    try {
      const { bank, year, month, accountId } = (req.query as any) ?? {};

      // 🔒 Vérifie qu'un compte actif est bien spécifié
      if (!accountId) {
        return reply.code(400).send({ error: "Aucun compte sélectionné" });
      }

      // 🧮 Construction dynamique du filtre
      const where: any = { accountId };

      if (bank) where.bank = bank;
      if (year && month) where.yearMonth = `${year}-${month.padStart(2, "0")}`;
      else if (year) where.yearMonth = { startsWith: `${year}-` };

      // 🔍 Récupération des transactions du compte actif
      const rows = await app.prisma.transaction.findMany({
        where,
        include: {
          entity: {
            select: {
              id: true,
              name: true,
              // on pourra plus tard ajouter displayName ou alias par compte ici
            },
          },
        },
        orderBy: [{ dateOperation: "asc" }],
      });

      return rows;
    } catch (e: any) {
      app.log.error({ msg: "Erreur lors du chargement des transactions", err: e.message });
      reply.code(500).send({ error: e.message });
    }
  });

  // Health check
  app.get("/health", async () => ({ ok: true }));
}

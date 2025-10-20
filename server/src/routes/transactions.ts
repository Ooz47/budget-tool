import { FastifyInstance } from "fastify";

export async function transactionsRoutes(app: FastifyInstance) {
app.get("/transactions", async (req, reply) => {
  try {
    const { bank, year, month } = (req.query as any) ?? {};
    const where: any = {};

    if (bank) where.bank = bank;
    if (year && month) where.yearMonth = `${year}-${month}`;
    else if (year) where.yearMonth = { startsWith: `${year}-` };

    const rows = await app.prisma.transaction.findMany({
      where,
      include: { entity: true },
      orderBy: [{ dateOperation: "asc" }],
    });

    return rows;
  } catch (e) {
    reply.code(500).send({ error: e.message });
  }
});



  // health check simple
  app.get("/health", async () => ({ ok: true }));
}

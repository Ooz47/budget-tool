import { FastifyInstance } from "fastify";

export async function transactionsRoutes(app: FastifyInstance) {
app.get("/transactions", async (req, reply) => {
  try {
    const { month, bank, search } = (req.query as any) ?? {};
    const where: any = {};
    if (month) where.yearMonth = month;
    if (bank) where.bank = bank;
    if (search) {
      where.OR = [
        { label: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } }
      ];
    }
    const rows = await app.prisma.transaction.findMany({
      where,
      orderBy: [{ dateOperation: "asc" }, { createdAt: "asc" }]
    });
    return rows; // toujours un array
  } catch (e) {
    req.log.error(e);
    reply.code(200); // pour ne pas casser le front
    return [];       // array vide → pas de .map crash
  }
});


  // health check simple
  app.get("/health", async () => ({ ok: true }));
}

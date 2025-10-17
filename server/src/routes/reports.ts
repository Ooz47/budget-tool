import { FastifyInstance } from "fastify";

export async function reportsRoutes(app: FastifyInstance) {
  // Agrégations mensuelles par catégorie et totaux (catégorie ignorée pour l’instant)
  app.get("/reports/monthly", async (req) => {
    const { year } = (req.query as any) ?? {};
    const yearPrefix = year ? `${year}-` : "";
    // groupement par yearMonth
    const rows = await app.prisma.transaction.groupBy({
      by: ["yearMonth"],
      _sum: { debit: true, credit: true, amount: true },
      where: year ? { yearMonth: { startsWith: yearPrefix } } : undefined,
      orderBy: { yearMonth: "asc" }
    });
    return rows.map(r => ({
      month: r.yearMonth,
      debit: r._sum.debit ?? 0,
      credit: r._sum.credit ?? 0,
      balance: r._sum.amount ?? 0
    }));
  });

  // Agrégations annuelles (un total)
  app.get("/reports/annual", async () => {
    const rows = await app.prisma.transaction.groupBy({
      by: ["yearMonth"],
      _sum: { debit: true, credit: true, amount: true }
    });
    const total = rows.reduce((acc, r) => {
      acc.debit += r._sum.debit ?? 0;
      acc.credit += r._sum.credit ?? 0;
      acc.balance += r._sum.amount ?? 0;
      return acc;
    }, { debit: 0, credit: 0, balance: 0 });
    return total;
  });
}

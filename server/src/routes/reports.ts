import { FastifyInstance } from "fastify";

export async function reportsRoutes(app: FastifyInstance) {

  app.get("/reports/monthly", async (req, reply) => {
    try {
      const { year, month } = (req.query as any) ?? {};

      if (year && month) {
        // exemple 2025-02
        const ym = `${year}-${month.padStart(2, "0")}`;
        const agg = await app.prisma.transaction.aggregate({
          where: { yearMonth: ym },
          _sum: { debit: true, credit: true, amount: true },
        });
        return [
          {
            month: ym,
            debit: agg._sum.debit ?? 0,
            credit: agg._sum.credit ?? 0,
            balance: agg._sum.amount ?? 0,
          },
        ];
      }

      const where = year ? { yearMonth: { startsWith: `${year}-` } } : {};
      const rows = await app.prisma.transaction.groupBy({
        by: ["yearMonth"],
        where,
        _sum: { debit: true, credit: true, amount: true },
        orderBy: { yearMonth: "asc" },
      });

      return rows.map((r) => ({
        month: r.yearMonth,
        debit: r._sum.debit ?? 0,
        credit: r._sum.credit ?? 0,
        balance: r._sum.amount ?? 0,
      }));
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  app.get("/reports/summary", async (req, reply) => {
  try {
    const { year, month } = (req.query as any) ?? {};

    const where: any = {};
    if (year && month) {
      where.yearMonth = `${year}-${month.padStart(2, "0")}`;
    } else if (year) {
      where.yearMonth = { startsWith: `${year}-` };
    }

    const agg = await app.prisma.transaction.aggregate({
      where,
      _sum: { debit: true, credit: true, amount: true },
    });

    const debit = agg._sum.debit ?? 0;
    const credit = agg._sum.credit ?? 0;
    const balance = agg._sum.amount ?? 0;

    return { debit, credit, balance };
  } catch (e: any) {
    reply.code(500).send({ error: e.message });
  }
});

}

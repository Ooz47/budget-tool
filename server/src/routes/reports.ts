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

app.get("/reports/by-type", async (req, reply) => {
  try {
    const { year, month } = (req.query as any) ?? {};

    const where: any = {};
    if (year && month) {
      where.yearMonth = `${year}-${month.padStart(2, "0")}`;
    } else if (year) {
      where.yearMonth = { startsWith: `${year}-` };
    }

    const rows = await app.prisma.transaction.groupBy({
      by: ["typeOperation"],
      where,
      _count: { _all: true },
      _sum: { debit: true, credit: true },
      orderBy: { _sum: { debit: "desc" } },
    });

    const data = rows.map((r) => ({
      type: r.typeOperation ?? "INCONNU",
      count: r._count._all,
      debit: r._sum.debit ?? 0,
      credit: r._sum.credit ?? 0,
   
    }));

    return data;
  } catch (e: any) {
    reply.code(500).send({ error: e.message });
  }
});


app.get("/reports/by-entity", async (req, reply) => {
  try {
    const { year, month } = (req.query as any) ?? {};

    const where: any = {};
    if (year && month) {
      where.yearMonth = `${year}-${month.padStart(2, "0")}`;
    } else if (year) {
      where.yearMonth = { startsWith: `${year}-` };
    }

    // Récupère toutes les transactions pour compter celles sans entité
    const all = await app.prisma.transaction.findMany({
      where,
      select: { entity: true, debit: true, credit: true },
    });

    const rows = await app.prisma.transaction.groupBy({
      by: ["entity"],
      where,
      _count: { _all: true },
      _sum: { debit: true, credit: true },
      orderBy: { _sum: { debit: "desc" } },
    });

    const data = rows
      .filter((r) => r.entity !== null)
      .map((r) => ({
        entity: r.entity ?? "INCONNUE",
        count: r._count._all,
        debit: r._sum.debit ?? 0,
        credit: r._sum.credit ?? 0,
      }));

    const missing = all.filter((t) => !t.entity).length;

    return { data, missing };
  } catch (e: any) {
    reply.code(500).send({ error: e.message });
  }
});

// ----------------------------------------------------------------------
// 🧩 Statistiques globales sur les transactions
// ----------------------------------------------------------------------
app.get("/reports/stats", async (req, reply) => {
  try {
    const total = await app.prisma.transaction.count();
    const withEntity = await app.prisma.transaction.count({
      where: { NOT: { entity: null } },
    });

    const withType = await app.prisma.transaction.count({
      where: { NOT: { typeOperation: null } },
    });

    const withoutEntity = total - withEntity;
    const withoutType = total - withType;

    const coverage = total > 0 ? ((withEntity / total) * 100).toFixed(2) : "0";

    return {
      total,
      withEntity,
      withoutEntity,
      withType,
      withoutType,
      coverage: Number(coverage),
    };
  } catch (e: any) {
    reply.code(500).send({ error: e.message });
  }
});




}

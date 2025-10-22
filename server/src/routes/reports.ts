import { FastifyInstance } from "fastify";

export async function reportsRoutes(app: FastifyInstance) {
  // ----------------------------------------------------------------------
  // 📅 Rapport mensuel global
  // ----------------------------------------------------------------------
  app.get("/reports/monthly", async (req, reply) => {
    try {
      const { year, month, accountId } = (req.query as any) ?? {};
      if (!accountId)
        return reply.code(400).send({ error: "Aucun compte sélectionné" });

      const where: any = { accountId };
      if (year && month) where.yearMonth = `${year}-${month.padStart(2, "0")}`;
      else if (year) where.yearMonth = { startsWith: `${year}-` };

      if (year && month) {
        const agg = await app.prisma.transaction.aggregate({
          where,
          _sum: { debit: true, credit: true, amount: true },
        });
        return [
          {
            month: `${year}-${month.padStart(2, "0")}`,
            debit: agg._sum.debit ?? 0,
            credit: agg._sum.credit ?? 0,
            balance: agg._sum.amount ?? 0,
          },
        ];
      }

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

  // ----------------------------------------------------------------------
  // 🧾 Résumé global du mois
  // ----------------------------------------------------------------------
  app.get("/reports/summary", async (req, reply) => {
    try {
      const { year, month, accountId } = (req.query as any) ?? {};
      if (!accountId)
        return reply.code(400).send({ error: "Aucun compte sélectionné" });

      const where: any = { accountId };
      if (year && month) where.yearMonth = `${year}-${month.padStart(2, "0")}`;
      else if (year) where.yearMonth = { startsWith: `${year}-` };

      const agg = await app.prisma.transaction.aggregate({
        where,
        _sum: { debit: true, credit: true, amount: true },
      });

      return {
        debit: agg._sum.debit ?? 0,
        credit: agg._sum.credit ?? 0,
        balance: agg._sum.amount ?? 0,
      };
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // ----------------------------------------------------------------------
  // 💳 Regroupement par type d’opération
  // ----------------------------------------------------------------------
  app.get("/reports/by-type", async (req, reply) => {
    try {
      const { year, month, accountId } = (req.query as any) ?? {};
      if (!accountId)
        return reply.code(400).send({ error: "Aucun compte sélectionné" });

      const where: any = { accountId };
      if (year && month) where.yearMonth = `${year}-${month.padStart(2, "0")}`;
      else if (year) where.yearMonth = { startsWith: `${year}-` };

      const rows = await app.prisma.transaction.groupBy({
        by: ["typeOperation"],
        where,
        _count: { _all: true },
        _sum: { debit: true, credit: true },
        orderBy: { _sum: { debit: "desc" } },
      });

      return rows.map((r) => ({
        type: r.typeOperation ?? "INCONNU",
        count: r._count._all,
        debit: r._sum.debit ?? 0,
        credit: r._sum.credit ?? 0,
      }));
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // ----------------------------------------------------------------------
  // 🏢 Regroupement par entité
  // ----------------------------------------------------------------------
  app.get("/reports/by-entity", async (req, reply) => {
    try {
      const { year, month, accountId } = (req.query as any) ?? {};
      if (!accountId)
        return reply.code(400).send({ error: "Aucun compte sélectionné" });

      const where: any = { accountId };
      if (year && month) where.yearMonth = `${year}-${month.padStart(2, "0")}`;
      else if (year) where.yearMonth = { startsWith: `${year}-` };

      const entities = await app.prisma.entity.findMany({
        where: { accountId },
        include: {
          aliases: true,
          aliasOf: true,
          tags: { include: { tag: true } },
        },
      });

      const allTx = await app.prisma.transaction.findMany({
        where,
        select: {
          id: true,
          entityId: true,
          debit: true,
          credit: true,
          amount: true,
        },
      });

      const totals: Record<string, { debit: number; credit: number; count: number }> = {};

      for (const tx of allTx) {
        if (!tx.entityId) continue;
        const main = entities.find((e) =>
          e.id === tx.entityId
            ? true
            : e.aliases.some((a) => a.id === tx.entityId)
        );
        if (!main) continue;

        const key = main.id;
        if (!totals[key]) totals[key] = { debit: 0, credit: 0, count: 0 };
        totals[key].debit += tx.debit || 0;
        totals[key].credit += tx.credit || 0;
        totals[key].count++;
      }

      const data = entities
        .filter((e) => !e.aliasOfId)
        .map((e) => ({
          entity: e.displayName || e.name,
          count: totals[e.id]?.count ?? 0,
          debit: totals[e.id]?.debit ?? 0,
          credit: totals[e.id]?.credit ?? 0,
          aliases: e.aliases.map((a) => a.displayName || a.name),
          tags: e.tags.map((t) => ({
            name: t.tag.name,
            color: t.tag.color || "#e5e7eb",
          })),
        }))
        .filter((d) => d.count > 0)
        .sort((a, b) => b.debit - a.debit);

      const missing = allTx.filter((t) => !t.entityId).length;
      return { data, missing };
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // ----------------------------------------------------------------------
  // 📊 Regroupement par catégorie
  // ----------------------------------------------------------------------
  app.get("/reports/by-category", async (req, reply) => {
    try {
      const { year, month, accountId } = (req.query as any) ?? {};
      if (!accountId)
        return reply.code(400).send({ error: "Aucun compte sélectionné" });

      const where: any = { accountId };
      if (year && month) where.yearMonth = `${year}-${month.padStart(2, "0")}`;
      else if (year) where.yearMonth = { startsWith: `${year}-` };

      const transactions = await app.prisma.transaction.findMany({
        where,
        select: {
          debit: true,
          credit: true,
          entity: {
            select: { id: true, aliasOfId: true, categoryId: true },
          },
        },
      });

      const categories = await app.prisma.category.findMany({
        select: { id: true, name: true, parentCategoryId: true },
      });

      const entities = await app.prisma.entity.findMany({
        where: { accountId },
        select: { id: true, aliasOfId: true, categoryId: true },
      });

      const aliasMap = new Map<string, string>();
      for (const e of entities) {
        if (e.aliasOfId) aliasMap.set(e.id, e.aliasOfId);
      }

      const categoryTotals: Record<string, { debit: number; credit: number; count: number }> = {};
      let uncategorized = { debit: 0, credit: 0, count: 0 };

      for (const tx of transactions) {
        let entityId = tx.entity?.id;
        if (!entityId) {
          uncategorized.debit += tx.debit || 0;
          uncategorized.credit += tx.credit || 0;
          uncategorized.count++;
          continue;
        }

        while (aliasMap.has(entityId)) entityId = aliasMap.get(entityId)!;
        const entity = entities.find((e) => e.id === entityId);
        const catId = entity?.categoryId;

        if (!catId) {
          uncategorized.debit += tx.debit || 0;
          uncategorized.credit += tx.credit || 0;
          uncategorized.count++;
          continue;
        }

        if (!categoryTotals[catId])
          categoryTotals[catId] = { debit: 0, credit: 0, count: 0 };

        categoryTotals[catId].debit += tx.debit || 0;
        categoryTotals[catId].credit += tx.credit || 0;
        categoryTotals[catId].count++;
      }

      // Création des catégories hiérarchiques
      const categoryMap = new Map<string, any>();
      for (const c of categories) {
        categoryMap.set(c.id, {
          id: c.id,
          name: c.name,
          parentCategoryId: c.parentCategoryId,
          debit: categoryTotals[c.id]?.debit || 0,
          credit: categoryTotals[c.id]?.credit || 0,
          count: categoryTotals[c.id]?.count || 0,
          children: [],
        });
      }

      // Propagation vers parents
      for (const cat of categoryMap.values()) {
        let current = cat;
        while (current.parentCategoryId) {
          const parent = categoryMap.get(current.parentCategoryId);
          if (parent) {
            parent.debit += cat.debit;
            parent.credit += cat.credit;
            parent.count += cat.count;
            current = parent;
          } else break;
        }
      }

      // Construction hiérarchie
      const tree: any[] = [];
      for (const cat of categoryMap.values()) {
        if (cat.parentCategoryId) {
          const parent = categoryMap.get(cat.parentCategoryId);
          if (parent) parent.children.push(cat);
        } else tree.push(cat);
      }

      if (uncategorized.count > 0) {
        tree.push({
          id: "uncategorized",
          name: "Non catégorisée",
          debit: uncategorized.debit,
          credit: uncategorized.credit,
          count: uncategorized.count,
          children: [],
        });
      }

      return { data: tree };
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // ----------------------------------------------------------------------
  // 📈 Statistiques globales
  // ----------------------------------------------------------------------
  app.get("/reports/stats", async (req, reply) => {
    try {
      const { accountId } = (req.query as any) ?? {};
      if (!accountId)
        return reply.code(400).send({ error: "Aucun compte sélectionné" });

      const total = await app.prisma.transaction.count({ where: { accountId } });
      const withEntity = await app.prisma.transaction.count({
        where: { accountId, NOT: { entity: null } },
      });
      const withType = await app.prisma.transaction.count({
        where: { accountId, NOT: { typeOperation: null } },
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

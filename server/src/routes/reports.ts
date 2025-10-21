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

    // 1️⃣ Récupère toutes les entités avec leurs alias
    const entities = await app.prisma.entity.findMany({
      include: {
        aliases: true,
        aliasOf: true,
        tags: { include: { tag: true } },
      },
    });

    // 2️⃣ Récupère toutes les transactions (filtrées)
    const allTx = await app.prisma.transaction.findMany({
      where,
      select: { id: true, entityId: true, debit: true, credit: true, amount: true },
    });

    // 3️⃣ Calcule les totaux par entité principale
    const totals: Record<string, { debit: number; credit: number; count: number }> = {};

    for (const tx of allTx) {
      if (!tx.entityId) continue;

      // Trouve l’entité principale (celle sans aliasOf)
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

    // 4️⃣ Formate la sortie (avec alias visibles)
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
    })), // 👈 ajouté
      }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.debit - a.debit);

    // 5️⃣ Transactions sans entité
    const missing = allTx.filter((t) => !t.entityId).length;

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
    // console.log("🧩 withoutEntity :", withoutEntity);
    // console.log("🧩 withoutType :", withoutEntity);
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


app.get("/reports/by-category", async (req, reply) => {
  try {
    const { year, month } = (req.query as any) ?? {};

    // 📅 Filtrage temporel
    const where: any = {};
    if (year && month) {
      where.yearMonth = `${year}-${month.padStart(2, "0")}`;
    } else if (year) {
      where.yearMonth = { startsWith: `${year}-` };
    }

    // 🧱 1️⃣ Récupère toutes les transactions
    const transactions = await app.prisma.transaction.findMany({
      where,
      select: {
        debit: true,
        credit: true,
        entity: {
          select: {
            id: true,
            aliasOfId: true,
            categoryId: true,
          },
        },
      },
    });

    // 🧩 2️⃣ Récupère toutes les catégories
    const categories = await app.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        parentCategoryId: true,
      },
    });

    // 🧩 3️⃣ Récupère les entités pour gérer les alias
    const entities = await app.prisma.entity.findMany({
      select: { id: true, aliasOfId: true, categoryId: true },
    });

    // Map alias → entité principale
    const aliasMap = new Map<string, string>();
    for (const e of entities) {
      if (e.aliasOfId) aliasMap.set(e.id, e.aliasOfId);
    }

    // 🧮 4️⃣ Agrège les montants par catégorie
    const categoryTotals: Record<
      string,
      { debit: number; credit: number; count: number }
    > = {};

    let uncategorized = { debit: 0, credit: 0, count: 0 };

    for (const tx of transactions) {
      let entityId = tx.entity?.id;
      if (!entityId) {
        uncategorized.debit += tx.debit || 0;
        uncategorized.credit += tx.credit || 0;
        uncategorized.count++;
        continue;
      }

      // remonte si alias
      while (aliasMap.has(entityId)) {
        entityId = aliasMap.get(entityId)!;
      }

      const entity = entities.find((e) => e.id === entityId);
      const catId = entity?.categoryId;

      if (!catId) {
        uncategorized.debit += tx.debit || 0;
        uncategorized.credit += tx.credit || 0;
        uncategorized.count++;
        continue;
      }

      if (!categoryTotals[catId]) {
        categoryTotals[catId] = { debit: 0, credit: 0, count: 0 };
      }
      categoryTotals[catId].debit += tx.debit || 0;
      categoryTotals[catId].credit += tx.credit || 0;
      categoryTotals[catId].count += 1;
    }

    // 🧠 5️⃣ Structure des catégories
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

    // 🪜 6️⃣ Propagation des totaux vers les parents
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

    // 🏗️ 7️⃣ Construction de la hiérarchie
    const tree: any[] = [];
    for (const cat of categoryMap.values()) {
      if (cat.parentCategoryId) {
        const parent = categoryMap.get(cat.parentCategoryId);
        if (parent) parent.children.push(cat);
      } else {
        tree.push(cat);
      }
    }

    // 🧾 8️⃣ Ajout de la catégorie "Non catégorisée"
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





}

import { FastifyInstance } from "fastify";
import { detectTypeAndEntity } from "../services/transaction-analyzer";

export async function adminRoutes(app: FastifyInstance) {
  /**
   * Réanalyse toutes les transactions existantes :
   * - Si `dry=true` → simulation (ne met rien à jour)
   * - Sinon → applique réellement les changements
   */
  app.post("/admin/reanalyze", async (req, reply) => {
  console.log("🧩 Reanalyse déclenchée :", req.query);
  try {
    const dry = (req.query as any)?.dry === "true";
    const force = (req.query as any)?.force === "true";

    const transactions = await app.prisma.transaction.findMany({
      select: { id: true, label: true, details: true, typeOperation: true, entity: true },
    });

    let updated = 0;
    let simulatedChanges: any[] = [];

    for (const t of transactions) {
      const text = `${t.label ?? ""} ${t.details ?? ""}`;
      const { typeOperation, entity } = detectTypeAndEntity(text);

      // ✅ condition : soit les valeurs changent, soit on force la mise à jour
      if (force || typeOperation !== t.typeOperation || entity !== t.entity) {
        updated++;

        if (dry) {
          simulatedChanges.push({
            id: t.id,
            before: { typeOperation: t.typeOperation, entity: t.entity },
            after: { typeOperation, entity },
          });
        } else {
          await app.prisma.transaction.update({
            where: { id: t.id },
            data: { typeOperation, entity },
          });
        }
      }
    }

    if (dry) {
      return {
        mode: "dry-run",
        simulated: updated,
        preview: simulatedChanges.slice(0, 10),
      };
    }

    return { updated };
  } catch (e: any) {
    reply.code(500).send({ error: e.message });
  }
});

}

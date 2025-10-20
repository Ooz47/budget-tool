import { FastifyInstance } from "fastify";
import { detectTypeAndEntity } from "../services/transaction-analyzer";

/**
 * 🔧 Utilitaire interne : récupère ou crée une entité et renvoie son ID
 */
async function getOrCreateEntityId(app: FastifyInstance, name?: string | null) {
  if (!name) return null;

  const clean = name.trim();
  const existing = await app.prisma.entity.findUnique({ where: { name: clean } });
  if (existing) return existing.id;

  const created = await app.prisma.entity.create({ data: { name: clean } });
  return created.id;
}

export async function adminRoutes(app: FastifyInstance) {
  /**
   * 🧩 Réanalyse toutes les transactions existantes :
   * - Si `dry=true` → simulation (ne met rien à jour)
   * - Sinon → applique réellement les changements
   */
  app.post("/admin/reanalyze", async (req, reply) => {
    console.log("🧩 Reanalyse déclenchée :", req.query);
    try {

      
      const dry = (req.query as any)?.dry === "true";
      const force = (req.query as any)?.force === "true";

      const transactions = await app.prisma.transaction.findMany({
        select: {
          id: true,
          label: true,
          details: true,
          typeOperation: true,
          entityId: true,
          entity: { select: { name: true } },
        },
      });

      let updated = 0;
      const simulatedChanges: any[] = [];

      for (const t of transactions) {
        const text = `${t.label ?? ""} ${t.details ?? ""}`;
        const { typeOperation, entity } = detectTypeAndEntity(text);

        const oldEntityName = t.entity?.name ?? null;
        const entityChanged = entity !== oldEntityName;

        // ⚙️ condition : on force ou on détecte un changement
        if (force || typeOperation !== t.typeOperation || entityChanged) {
          updated++;

          if (dry) {
            simulatedChanges.push({
              id: t.id,
              before: { typeOperation: t.typeOperation, entity: oldEntityName },
              after: { typeOperation, entity },
            });
          } else {
            const entityId = await getOrCreateEntityId(app, entity);

            await app.prisma.transaction.update({
              where: { id: t.id },
              data: {
                typeOperation,
                entityId,
              },
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
      console.error("Erreur réanalyse :", e);
      reply.code(500).send({ error: e.message });
    }
  });
}

import { FastifyInstance } from "fastify";
import axios from "axios";
import FormData from "form-data";
import { makeFingerprint } from "../services/fingerprint";
import { detectTypeAndEntity } from "../services/transaction-analyzer";

export async function importRoutes(app: FastifyInstance) {
  app.post("/import/sg-csv", async (req: any, reply) => {
    try {
      console.log("🔍 Type du body:", req.headers["content-type"]);
      console.log("🔍 Body keys:", Object.keys(req.body || {}));

      const body = req.body || {};
      let file = body.file;

      // 🧩 Cas alternatif : si Fastify a mis le fichier dans req.files()
      if (!file && typeof req.files === "function") {
        const files = await req.files();
        file = files?.[0];
      }

      const accountId =
        typeof body.accountId === "object" ? body.accountId.value : body.accountId;

      if (!file || typeof file.toBuffer !== "function") {
        app.log.error({ bodyKeys: Object.keys(req.body || {}) }, "No file in body");
        return reply.code(400).send({ error: "Fichier manquant (champ 'file')" });
      }
      if (!accountId) {
        return reply.code(400).send({ error: "Aucun compte sélectionné" });
      }

      const buf = await file.toBuffer();
      const filename = file?.filename || "sg.csv";
      const mimetype = file?.mimetype || "text/csv";

      // --- Appel du parseur distant ---
      const fd = new FormData();
      fd.append("file", buf, { filename, contentType: mimetype });

      const resp = await axios.post("http://127.0.0.1:8765/parse/sg/csv", fd, {
        headers: fd.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000,
      });

      const rows = Array.isArray(resp.data?.transactions)
        ? resp.data.transactions
        : [];
      if (!rows.length)
        return { imported: 0, updated: 0, skipped: 0, file: filename };

      let inserted = 0,
        updated = 0;

      await app.prisma.$transaction(async (tx) => {
        for (const r of rows) {
          const data = {
            bank: r.bank,
            accountIban: r.accountIban ?? null,
            dateOperation: new Date(r.dateOperation),
            dateValeur: r.dateValeur ? new Date(r.dateValeur) : null,
            label: r.label,
            details: r.details ?? null,
            debit: r.debit,
            credit: r.credit,
            amount: r.amount,
            yearMonth: r.yearMonth,
            sourceFile: r.sourceFile,
            categoryId: null,
            accountId, // ✅ rattaché au bon compte
          };

          const fingerprint = makeFingerprint({
            bank: data.bank,
            dateOperation: data.dateOperation,
            amount: data.amount,
            label: data.label,
            details: data.details,
            accountIban: data.accountIban,
          });

          const { typeOperation, entity } = detectTypeAndEntity(
            `${data.label} ${data.details ?? ""}`
          );

          let entityId: string | null = null;
          if (entity) {
            // 🔍 Cherche une entité avec ce nom ET ce compte
            const existing = await tx.entity.findFirst({
              where: { name: entity, accountId },
            });

            entityId = existing
              ? existing.id
              : (
                  await tx.entity.create({
                    data: { name: entity, accountId },
                  })
                ).id;
          }

          const res = await tx.transaction.upsert({
            where: { fingerprint },
            create: { ...data, fingerprint, typeOperation, entityId },
            update: {
              dateValeur: data.dateValeur,
              label: data.label,
              details: data.details,
              debit: data.debit,
              credit: data.credit,
              amount: data.amount,
              yearMonth: data.yearMonth,
              sourceFile: data.sourceFile,
              typeOperation,
              entityId,
            },
          });

          if (res.createdAt.getTime() === res.updatedAt.getTime()) inserted++;
          else updated++;
        }
      });

      return { imported: inserted, updated, file: rows[0].sourceFile };
    } catch (e: any) {
      req.log.error({ msg: "Import failed", err: e?.message, stack: e?.stack });
      return reply
        .code(500)
        .send({ error: "Import failed", message: e?.message ?? null });
    }
  });
}

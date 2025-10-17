import { FastifyInstance } from "fastify";
import axios from "axios";
import FormData from "form-data";
import { makeFingerprint } from "../services/fingerprint";

export async function importRoutes(app: FastifyInstance) {
  app.post("/import/sg-csv", async (req: any, reply) => {
    try {
      // Avec attachFieldsToBody: true, le fichier est ici
      const file = req.body?.file;
      if (!file || typeof file.toBuffer !== "function") {
        app.log.error({ bodyKeys: Object.keys(req.body || {}) }, "No file in body");
        return reply.code(400).send({ error: "Fichier manquant (champ 'file')" });
      }

      const buf = await file.toBuffer();
      const filename = file?.filename || "sg.csv";
      const mimetype = file?.mimetype || "text/csv";

      // Forward vers le parser Python
      const fd = new FormData();
      fd.append("file", buf, { filename, contentType: mimetype });

      const resp = await axios.post("http://127.0.0.1:8765/parse/sg/csv", fd, {
        headers: fd.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 30000,
      });

      const rows = Array.isArray(resp.data?.transactions) ? resp.data.transactions : [];
      if (!rows.length) return { imported: 0, updated: 0, skipped: 0, file: filename };

      let inserted = 0, updated = 0, skipped = 0;
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
          };

          const fingerprint = makeFingerprint({
            bank: data.bank,
            dateOperation: data.dateOperation,
            amount: data.amount,
            label: data.label,
            details: data.details,
            accountIban: data.accountIban,
          });

          const res = await tx.transaction.upsert({
            where: { fingerprint },
            create: { ...data, fingerprint },
            update: {
              dateValeur: data.dateValeur,
              label: data.label,
              details: data.details,
              debit: data.debit,
              credit: data.credit,
              amount: data.amount,
              yearMonth: data.yearMonth,
              sourceFile: data.sourceFile,
            },
          });

          if (res.createdAt.getTime() === res.updatedAt.getTime()) inserted++;
          else updated++;
        }
      });

      return { imported: inserted, updated, skipped, file: rows[0].sourceFile };
    } catch (e: any) {
      req.log.error({ msg: "Import failed", err: e?.message, stack: e?.stack });
      return reply.code(500).send({ error: "Import failed", message: e?.message ?? null });
    }
  });
}

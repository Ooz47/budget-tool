import Fastify from "fastify";
import cors from "@fastify/cors";
import { prisma } from "./lib/prisma";
import { transactionsRoutes } from "./routes/transactions";
import { reportsRoutes } from "./routes/reports";
import multipart from "@fastify/multipart";
import { importRoutes } from "./routes/import";




const app = Fastify({ logger: true });


app.register(cors, { origin: true });
app.register(multipart, {
  attachFieldsToBody: true,      // <<<< essentiel ici
  limits: { files: 1, fileSize: 20 * 1024 * 1024 }, // 20 MB, par sécurité
});
app.register(importRoutes);

app.decorate("prisma", prisma);

app.get("/", async () => ({ name: "budget-tool server", version: "0.1.0" }));
app.register(transactionsRoutes);
app.register(reportsRoutes);

app.listen({ port: 5175, host: "127.0.0.1" }).then(() => {
  app.log.info("Server running on http://127.0.0.1:5175");
});

// typing pour app.prisma
declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

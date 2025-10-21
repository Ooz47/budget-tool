import { FastifyInstance } from "fastify";

export async function tagRoutes(app: FastifyInstance) {
  // 🟢 Liste tous les tags
  app.get("/tags", async (req, reply) => {
    try {
      const tags = await app.prisma.tag.findMany({
        orderBy: { name: "asc" },
      });
      return tags;
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // 🟡 Crée un nouveau tag
  app.post("/tags", async (req, reply) => {
    try {
      const { name, color } = req.body as {
        name: string;
        color?: string | null;
      };

      if (!name?.trim()) {
        return reply.code(400).send({ error: "Le champ 'name' est obligatoire." });
      }

      const existing = await app.prisma.tag.findUnique({ where: { name } });
      if (existing) {
        return reply.code(409).send({ error: "Un tag avec ce nom existe déjà." });
      }

      const newTag = await app.prisma.tag.create({
        data: { name: name.trim(), color: color || "#999999" },
      });

      return reply.code(201).send(newTag);
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // 🟠 Met à jour un tag
  app.patch("/tags/:id", async (req, reply) => {
    try {
      const id = req.params["id"];
      const { name, color } = req.body as {
        name?: string;
        color?: string | null;
      };

      const updated = await app.prisma.tag.update({
        where: { id },
        data: { name, color },
      });

      return updated;
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });

  // 🔴 Supprime un tag
  app.delete("/tags/:id", async (req, reply) => {
    try {
      const id = req.params["id"];
      await app.prisma.tag.delete({ where: { id } });
      return { deleted: true };
    } catch (e: any) {
      reply.code(500).send({ error: e.message });
    }
  });
}

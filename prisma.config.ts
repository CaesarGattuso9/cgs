import "dotenv/config";

import { defineConfig } from "prisma/config";

const defaultDatabaseUrl = "postgresql://lifelog:lifelog@db:5432/lifelog?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || defaultDatabaseUrl,
  },
});

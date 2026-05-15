import { createRequestHandler } from "@react-router/express";
import { drizzle } from "drizzle-orm/postgres-js";
import express from "express";
import postgres from "postgres";
import { createContext, RouterContextProvider } from "react-router";

import { DatabaseContext } from "~/database/context";
import * as schema from "~/database/schema";

export const expressContext = createContext<{ VALUE_FROM_EXPRESS: string }>();
export const app = express();
app.disable("x-powered-by");

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });
app.use((_, __, next) => DatabaseContext.run(db, next));

app.use(
  createRequestHandler({
    build: () => import("virtual:react-router/server-build"),
    getLoadContext() {
      const context = new RouterContextProvider();
      context.set(expressContext, { VALUE_FROM_EXPRESS: "Hello from Express" });
      return context;
    },
  }),
);

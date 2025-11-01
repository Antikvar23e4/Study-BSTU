// server.js
import express from "express";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import productRoutes from "./routes/products.js"; // Убедитесь, что имя файла совпадает
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const adapter = new JSONFile(path.join(__dirname, "db.json"));
const db = new Low(adapter, { products: [] });

export const getDb = () => db;

app.use(express.json()); // <--- ВАЖНО: для парсинга JSON тел запросов

app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${
      req.path
    } - Body: ${JSON.stringify(req.body)} - Query: ${JSON.stringify(req.query)}`
  );
  next();
});

app.use("/api/v1/products", productRoutes);

app.use((req, res, next) => {
  res
    .status(404)
    .json({ error: "Not Found - The requested resource does not exist" });
});

app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack || err);
  res
    .status(500)
    .json({ error: "Internal Server Error", message: err.message });
});

const startServer = async () => {
  try {
    await db.read();
    db.data = db.data || { products: [] }; // Гарантируем, что db.data.products существует
    if (!Array.isArray(db.data.products)) {
      // Дополнительная проверка
      console.warn("db.data.products was not an array, re-initializing.");
      db.data.products = [];
    }
    await db.write();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log("API Base URL: /api/v1");
      console.log("Available tokens for X-API-KEY header:");
      console.log("  User: valid-user-token");
      console.log("  Admin: valid-admin-token");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

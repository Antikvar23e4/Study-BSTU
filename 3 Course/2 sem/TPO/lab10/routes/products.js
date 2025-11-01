// routes/products.js
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "../server.js";
import { requireAuth, requireAdminAuth } from "../middleware/auth.js";

const router = Router();

const validateProductInput = (product, isUpdate = false) => {
  const errors = [];
  if (product === undefined || product === null) {
    // Добавлена проверка на undefined/null для product
    errors.push("Request body is missing or malformed.");
    return errors;
  }

  if (
    !isUpdate &&
    (product.name === undefined || product.name === null || product.name === "")
  ) {
    errors.push("name is required");
  }
  if (
    product.name &&
    (typeof product.name !== "string" || product.name.length > 255)
  ) {
    errors.push("name must be a string and less than 256 characters");
  }

  if (!isUpdate && product.price === undefined) {
    errors.push("price is required");
  }
  if (
    product.price !== undefined &&
    (typeof product.price !== "number" || product.price <= 0)
  ) {
    errors.push("price must be a number greater than 0");
  }

  if (!isUpdate && product.stock_quantity === undefined) {
    errors.push("stock_quantity is required");
  }
  if (
    product.stock_quantity !== undefined &&
    (!Number.isInteger(product.stock_quantity) || product.stock_quantity < 0)
  ) {
    errors.push("stock_quantity must be an integer greater than or equal to 0");
  }

  if (product.category && typeof product.category !== "string") {
    errors.push("category must be a string");
  }
  if (product.description && typeof product.description !== "string") {
    errors.push("description must be a string");
  }
  return errors;
};

// 1. POST /products - Создать новый товар
router.post("/", requireAuth, async (req, res) => {
  const db = getDb();
  const productData = req.body;

  // console.log("POST /products - Received body:", productData); // Для отладки

  const validationErrors = validateProductInput(productData);
  if (validationErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Validation failed", details: validationErrors });
  }

  const newProduct = {
    id: uuidv4(),
    name: productData.name, // Явно указываем поля
    price: productData.price,
    stock_quantity: productData.stock_quantity,
    category: productData.category,
    description: productData.description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.data.products.push(newProduct);
  await db.write();
  res.status(201).json(newProduct);
});

// 2. GET /products - Получить список всех товаров
router.get("/", async (req, res) => {
  const db = getDb();
  let { page = 1, limit = 10, category, min_price, max_price } = req.query;

  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;
  min_price = min_price ? parseFloat(min_price) : undefined;
  max_price = max_price ? parseFloat(max_price) : undefined;

  let filteredProducts = [...(db.data.products || [])];

  if (category) {
    filteredProducts = filteredProducts.filter(
      (p) => p.category && p.category.toLowerCase() === category.toLowerCase()
    );
  }
  if (min_price !== undefined) {
    filteredProducts = filteredProducts.filter((p) => p.price >= min_price);
  }
  if (max_price !== undefined) {
    filteredProducts = filteredProducts.filter((p) => p.price <= max_price);
  }

  const total_items = filteredProducts.length;
  const total_pages = Math.ceil(total_items / limit) || 1; // Если 0 товаров, то 1 страница
  const startIndex = (page - 1) * limit;

  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + limit
  );

  res.status(200).json({
    data: paginatedProducts,
    pagination: {
      current_page: page,
      per_page: limit,
      total_items: total_items,
      total_pages: total_pages,
    },
  });
});

// 3. GET /products/{id} - Получить информацию о конкретном товаре
router.get("/:id", async (req, res) => {
  const db = getDb();
  const product = (db.data.products || []).find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.status(200).json(product);
});

// 4. PUT /products/{id} - Обновить существующий товар
router.put("/:id", requireAuth, async (req, res) => {
  const db = getDb();
  const productIndex = (db.data.products || []).findIndex(
    (p) => p.id === req.params.id
  );
  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const productData = req.body;
  const validationErrors = validateProductInput(productData, true);
  if (validationErrors.length > 0) {
    return res
      .status(400)
      .json({ error: "Validation failed", details: validationErrors });
  }

  const updatedProduct = {
    ...db.data.products[productIndex],
    ...productData, // Позволяет обновлять только указанные поля
    updated_at: new Date().toISOString(),
  };
  // Убедимся, что не обновляем ID или created_at через body
  updatedProduct.id = db.data.products[productIndex].id;
  updatedProduct.created_at = db.data.products[productIndex].created_at;

  db.data.products[productIndex] = updatedProduct;
  await db.write();
  res.status(200).json(updatedProduct);
});

// 5. DELETE /products/{id} - Удалить товар
router.delete("/:id", requireAdminAuth, async (req, res) => {
  const db = getDb();
  const productIndex = (db.data.products || []).findIndex(
    (p) => p.id === req.params.id
  );
  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  db.data.products.splice(productIndex, 1);
  await db.write();
  res.status(204).send();
});

export default router;

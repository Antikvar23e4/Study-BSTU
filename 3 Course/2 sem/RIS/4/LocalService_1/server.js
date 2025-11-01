const express = require("express");
const app = express();
const PORT = 3001; // уникальн порт для сервиса

let counter = 0;

// логирование
app.use((req, res, next) => {
  console.log(`[Источник 1] Получен запрос: ${req.method} ${req.url}`);
  next();
});

app.get("/data", (req, res) => {
  counter++;
  if (Math.random() < 0.1) {
    console.log("[Источник 1] Симулируется временная ошибка (500)");
    return res
      .status(500)
      .json({ error: "Симулированная внутренняя ошибка сервера" });
  }

  const data = {
    sourceId: "TI_Service_01",
    timestamp: new Date().toISOString(), // ISO-формат (время по UTC) для согласованности
    measurementId: `m_${Date.now()}_${counter}`,
    value: (Math.random() * 100 + 50).toFixed(2), // случайный показатель
    unit: "kW",
  };
  console.log("[Источник 1] Отправка данных:", data);
  res.json(data);
});

app.listen(PORT, () => {
  console.log(
    `[Источник 1] Сервис телеметрии 1 запущен на http://localhost:${PORT}`
  );
});

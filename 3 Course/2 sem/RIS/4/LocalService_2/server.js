const express = require("express");
const app = express();
const PORT = 3002; // уникальн порт для сервиса

let reading = 200; // началье значение "измерения"

// логирование
app.use((req, res, next) => {
  console.log(`[Источник 2] Получен запрос: ${req.method} ${req.url}`);
  next();
});

app.get("/data", (req, res) => {
  // симуляция колебаний данных
  reading += (Math.random() - 0.5) * 10;
  if (reading < 0) reading = 0;
  // Симуляция случайной "медленной" реакции (15% вероятность)
  const isSlow = Math.random() < 0.15;
  const delay = isSlow ? 3000 : 0; // Задержка 3 секунды

  console.log(`[Источник 2] Запрос получен. Медленный ответ: ${isSlow}`);

  // Отправка данных с задержкой
  setTimeout(() => {
    const data = {
      sourceId: "TI_Service_02",
      timestamp: new Date().toISOString(),
      measurementId: `m_${Date.now()}_${Math.floor(reading)}`,
      value: reading.toFixed(2),
      unit: "m3/h",
    };
    console.log("[Источник 2] Отправка данных:", data);
    res.json(data);
  }, delay);
});

app.listen(PORT, () => {
  console.log(
    `[Источник 2] Сервис телеметрии 2 запущен на http://localhost:${PORT}`
  );
});

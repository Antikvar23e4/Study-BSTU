const express = require("express");
const Database = require("better-sqlite3"); // импорт SQLite драйвера
const path = require("path");

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, "to1.sqlite"); // имя файла БД+
const SERVICE_ID_INTERNAL = "TO_Service_01_SQLite";
const MY_SUB_CODE = "T01REG";
const MY_IST_CODE = "101";
const TABL_CODE = "FACT01";
const GENERATION_INTERVAL_MS = 7000;
const STUDENT_NUMBER = 10;

// инициализация бд
let db;
function initDb() {
  try {
    db = new Database(DB_FILE);
    console.log(`[${MY_SUB_CODE}] База данных SQLite подключена: ${DB_FILE}`);

    db.exec(`
            CREATE TABLE IF NOT EXISTS BODI (
                IST TEXT NOT NULL,      -- Код источника (FK к T_IST)
                TABL TEXT NOT NULL,     -- Код таблицы в ГО
                POK TEXT NOT NULL,      -- Код показателя
                UT TEXT NOT NULL,       -- Код уточнения
                SUB TEXT NOT NULL,      -- Код субъекта-владельца данных (этот ТО)
                OTN TEXT NOT NULL,      -- Код отношения
                OBJ TEXT NOT NULL,      -- Код объекта
                VID TEXT NOT NULL,      -- Код вида информации
                PER TEXT NOT NULL,      -- Код периода
                DATV TEXT NOT NULL,     -- Время значения (ISO 8601 строка)
                DATV_SET TEXT NOT NULL, -- Время занесения (ISO 8601 строка)
                ZNC REAL,               -- Значение (число с плавающей точкой)
                PP TEXT NOT NULL,       -- Признак достоверности
                -- Составной первичный ключ для уникальности записи измерения
                PRIMARY KEY (IST, TABL, POK, UT, SUB, OTN, OBJ, VID, PER, DATV)
            );
        `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bodi_datv ON BODI (DATV);`);
    console.log(`[${MY_SUB_CODE}] Таблица BODI готова.`);

    // запросики
    global.insertBodiStmt = db.prepare(`
            INSERT INTO BODI (IST, TABL, POK, UT, SUB, OTN, OBJ, VID, PER, DATV, DATV_SET, ZNC, PP)
            VALUES (@IST, @TABL, @POK, @UT, @SUB, @OTN, @OBJ, @VID, @PER, @DATV, @DATV_SET, @ZNC, @PP)
        `);
    global.selectBodiSinceStmt = db.prepare(`
            SELECT * FROM BODI WHERE DATV > ? ORDER BY DATV ASC
        `);
    global.countBodiStmt = db.prepare("SELECT COUNT(*) as cnt FROM BODI");
  } catch (err) {
    console.error(`[${MY_SUB_CODE}] ОШИБКА инициализации БД:`, err);
    process.exit(1);
  }
}

// генерация и запись данных
function createAndInsertBodiRecord(objectIdNum) {
  const now = new Date();
  const timestampISO = now.toISOString();
  const baseValue = STUDENT_NUMBER * 10;
  const rangeWidth = STUDENT_NUMBER * 5;
  const randomPart = Math.random() * rangeWidth;
  const generatedValue = parseFloat((baseValue + randomPart).toFixed(2));
  const objectIdStr = String(objectIdNum).padStart(2, "0");
  const pokCode = `PWR${objectIdStr}`; //
  const objCode = `${MY_SUB_CODE}_OBJ_${objectIdStr}`;

  const bodiRecordData = {
    IST: MY_IST_CODE,
    TABL: TABL_CODE,
    POK: pokCode,
    UT: "00",
    SUB: MY_SUB_CODE,
    OTN: "00",
    OBJ: objCode,
    VID: "01",
    PER: "00",
    DATV: timestampISO,
    DATV_SET: timestampISO,
    ZNC: generatedValue,
    PP: "00",
  };

  try {
    global.insertBodiStmt.run(bodiRecordData);
    console.log(
      `[${MY_SUB_CODE}] Запись в БД: IST=${bodiRecordData.IST}, SUB=${bodiRecordData.SUB}, OBJ=${bodiRecordData.OBJ}, ZNC=${bodiRecordData.ZNC}, DATV=${bodiRecordData.DATV}`
    );
  } catch (err) {
    console.error(
      `[${MY_SUB_CODE}] Ошибка записи в BODI:`,
      err.message,
      "Данные:",
      bodiRecordData
    );
  }
}

// начальные 10 объектов
function initialPopulation() {
  console.log(
    `[${MY_SUB_CODE}] Проверка начального заполнения БД (10 объектов)...`
  );
  const count = global.countBodiStmt.get().cnt;
  if (count >= 10) {
    console.log(
      `[${MY_SUB_CODE}] Начальные записи уже существуют (${count} шт.), пропускаем.`
    );
    return;
  }
  console.log(`[${MY_SUB_CODE}] Создание начальных 10 записей...`);
  for (let i = 1; i <= 10; i++) {
    createAndInsertBodiRecord(i);
  }
  console.log(`[${MY_SUB_CODE}] Начальное заполнение БД завершено.`);
}

// генерация новых значений
function generateDataContinuously() {
  const numObjectsToUpdate = Math.floor(Math.random() * 5) + 1; // 1-5 объектов
  console.log(
    `[${MY_SUB_CODE}] Генерация ${numObjectsToUpdate} новых записей в БД...`
  );
  for (let k = 0; k < numObjectsToUpdate; k++) {
    const randomObjectIdNum = Math.floor(Math.random() * 5) + 1; // Случайный объект 1-5
    createAndInsertBodiRecord(randomObjectIdNum);
  }
}

app.use((req, res, next) => {
  console.log(
    `[${MY_SUB_CODE}] Запрос получен: ${req.method} ${req.url} от ${req.ip}`
  );
  next();
});

app.get("/data/since", (req, res) => {
  const lastTimestampStr = req.query.lastTimestamp;
  // такая дата чтобы получить все данные
  let lastTimestampISO = "1970-01-01T00:00:00.000Z";

  if (lastTimestampStr) {
    try {
      const parsedDate = new Date(lastTimestampStr);
      if (isNaN(parsedDate.getTime())) throw new Error("Неверный формат даты");
      lastTimestampISO = parsedDate.toISOString();
      console.log(
        `[${MY_SUB_CODE}] Запрос данных после метки: ${lastTimestampISO}`
      );
    } catch (e) {
      console.error(
        `[${MY_SUB_CODE}] Ошибка парсинга/валидации lastTimestamp: ${lastTimestampStr}`,
        e
      );
      return res.status(400).json({
        error: "Неверный формат lastTimestamp. Ожидается строка ISO 8601.",
      });
    }
  } else {
    console.log(
      `[${MY_SUB_CODE}] Запрос всех данных (lastTimestamp не указан).`
    );
  }

  try {
    // SQL-запрос для получения записей новее указанной метки
    const newData = global.selectBodiSinceStmt.all(lastTimestampISO);
    console.log(
      `[${MY_SUB_CODE}] Найдено ${newData.length} новых записей в БД для отправки.`
    );
    res.json(newData);
  } catch (err) {
    console.error(`[${MY_SUB_CODE}] Ошибка выполнения запроса к BODI:`, err);
    res.status(500).json({ error: "Ошибка сервера при чтении данных" });
  }
});

app.listen(PORT, () => {
  console.log(
    `\n[${SERVICE_ID_INTERNAL}] Сервис источника ТО (${MY_SUB_CODE}) с SQLite запущен`
  );
  initDb(); // инициализация БД
  initialPopulation(); // начальное заполнение
  setInterval(generateDataContinuously, GENERATION_INTERVAL_MS); // генерация
  console.log(`[${MY_SUB_CODE}] Адрес: http://localhost:${PORT}`);
  console.log(
    `[${MY_SUB_CODE}] Запущена непрерывная генерация в БД каждые ${
      GENERATION_INTERVAL_MS / 1000
    } сек`
  );
});

process.on("exit", () => {
  if (db) db.close();
  console.log(`[${MY_SUB_CODE}] Соединение с БД закрыто.`);
});
process.on("SIGHUP", () => process.exit(128 + 1));
process.on("SIGINT", () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));

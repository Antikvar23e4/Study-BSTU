const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
// импорт начальных данных для таблиц конфигурации
const { T_SUB_InitialData, T_IST_InitialData } = require("../service-db");

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, "go.sqlite"); // БД
const MY_SUB_CODE = "GO_CNTR"; // код этого субъекта
const POLLING_INTERVAL_MS = 6000; // Интервал опроса ТО
const REQUEST_TIMEOUT_MS = 4000; // таймаут ожидания ответа от ТО
const LOG_FILE = path.join(__dirname, "replication.log"); // файл логов репликации

let db;
let subjectsToPoll = []; // список для опроса

// --- Функция Логирования ---
function formatTimestamp(date) {
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const DD = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(3, "0");
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}.${ms}`;
}

function log(level, message, subjectCode = null) {
  const timestamp = formatTimestamp(new Date());
  const levelUpper = level.toUpperCase();
  const sourcePrefix = subjectCode ? `[${subjectCode}] ` : `[${MY_SUB_CODE}] `; // Показываем субъект
  const fileMessage = `[${timestamp}] [${levelUpper}] ${sourcePrefix}${message}\n`;
  let consoleColorStart = "";
  const consoleColorEnd = "\x1b[0m"; // Reset color
  switch (levelUpper) {
    case "ERROR":
    case "CRITICAL":
      consoleColorStart = "\x1b[31m";
      break; // Red
    case "WARN":
      consoleColorStart = "\x1b[33m";
      break; // Yellow
    case "SUCCESS":
    case "REPLICA":
      consoleColorStart = "\x1b[32m";
      break; // Green
    case "INFO":
      consoleColorStart = subjectCode ? "\x1b[36m" : "";
      break; // Cyan for TO, default for GO
    default:
      consoleColorStart = "\x1b[90m";
      break; // Grey
  }
  const consoleMessage = `${consoleColorStart}[${timestamp}] [${levelUpper}] ${sourcePrefix}${message}${consoleColorEnd}\n`;
  process.stdout.write(consoleMessage); // Log to console
  // Append to file
  fs.appendFile(LOG_FILE, fileMessage, (err) => {
    if (err) {
      const errorTimestamp = formatTimestamp(new Date());
      process.stdout.write(
        `\x1b[31m[${errorTimestamp}] [ERROR] [${MY_SUB_CODE}] Ошибка записи в лог-файл (${LOG_FILE}): ${err}\x1b[0m\n`
      );
    }
  });
}

function initDb() {
  try {
    db = new Database(DB_FILE);
    log("INFO", `База данных SQLite ГО подключена: ${DB_FILE}`);

    // --- Создание Таблиц ГО ---
    // BODI (Центральное хранилище реплицированных данных)
    db.exec(`
            CREATE TABLE IF NOT EXISTS BODI (
                IST TEXT NOT NULL, TABL TEXT NOT NULL, POK TEXT NOT NULL, UT TEXT NOT NULL,
                SUB TEXT NOT NULL, OTN TEXT NOT NULL, OBJ TEXT NOT NULL, VID TEXT NOT NULL, PER TEXT NOT NULL,
                DATV TEXT NOT NULL, DATV_SET TEXT NOT NULL, ZNC REAL, PP TEXT NOT NULL,
                PRIMARY KEY (IST, TABL, POK, UT, SUB, OTN, OBJ, VID, PER, DATV)
            );
        `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_go_bodi_datv ON BODI (DATV);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_go_bodi_sub ON BODI (SUB);`);

    // BODK (Таблица контроля пакетов репликации)
    db.exec(`
            CREATE TABLE IF NOT EXISTS BODK (
                IST TEXT NOT NULL,      -- Источник данных
                SUB TEXT NOT NULL,      -- Субъект ТО, от которого получен пакет
                DATV_S_ET TEXT NOT NULL,-- Время начала интервала/пакета (маркер)
                KZAP INTEGER NOT NULL,  -- Количество записей в пакете
                PRIMARY KEY (IST, SUB, DATV_S_ET)
            );
        `);

    // T_SUB (Субъекты сети)
    db.exec(`
            CREATE TABLE IF NOT EXISTS T_SUB (
                ACT TEXT NOT NULL,      -- Признак активности ('1' или '0')
                SUB TEXT PRIMARY KEY,   -- Код субъекта (уникальный)
                SUB_NAME TEXT,          -- Имя субъекта
                SUB_ADR TEXT,           -- Адрес для связи
                WITH_PROXY TEXT,        -- Использовать прокси ('Y' или 'N')
                SUB_PORT TEXT,          -- Порт
                SUB_PROXY TEXT,         -- Адрес прокси
                SUB_PATH TEXT,          -- Путь к API
                SUB_PROXY_PORT TEXT     -- Порт прокси
            );
        `);

    // T_IST (Источники данных)
    db.exec(`
            CREATE TABLE IF NOT EXISTS T_IST (
                IST TEXT PRIMARY KEY,   -- Код источника (уникальный)
                PERIOD TEXT,            -- Период (число)
                ED TEXT,                -- Единица периода ('s', 'm', 'h', 'd')
                DT_BEG TEXT,            -- Задержка начала
                DT_END TEXT             -- Задержка окончания
            );
        `);

    // N_TI (Справочник тем измерений - не используется в логике)
    // N_TI
    db.exec(`
            CREATE TABLE IF NOT EXISTS N_TI (
                N_TI INTEGER PRIMARY KEY AUTOINCREMENT, IST TEXT, TABL TEXT,
                POK TEXT, UT TEXT, SUB TEXT, OTN TEXT, OBJ TEXT, VID TEXT, PER TEXT,
                SUB_R TEXT, NAME TEXT, ACT INTEGER
            );
        `);

    // T_SN
    db.exec(`
            CREATE TABLE IF NOT EXISTS T_SN (
                IST TEXT NOT NULL, SUB TEXT NOT NULL, SN TEXT NOT NULL,
                PRIMARY KEY (IST, SUB)
            );
        `);

    log("INFO", `Структура таблиц ГО проверена/создана.`);
    populateConfigTables();
    loadSubjectsToPoll();

    // запросики
    global.insertBodiStmt = db.prepare(`
             INSERT INTO BODI (IST, TABL, POK, UT, SUB, OTN, OBJ, VID, PER, DATV, DATV_SET, ZNC, PP)
             VALUES (@IST, @TABL, @POK, @UT, @SUB, @OTN, @OBJ, @VID, @PER, @DATV, @DATV_SET, @ZNC, @PP)
             ON CONFLICT(IST, TABL, POK, UT, SUB, OTN, OBJ, VID, PER, DATV) DO NOTHING -- Игнорировать дубликаты
         `);
    global.insertBodkStmt = db.prepare(`
            INSERT INTO BODK (IST, SUB, DATV_S_ET, KZAP)
            VALUES (@IST, @SUB, @DATV_S_ET, @KZAP)
             ON CONFLICT(IST, SUB, DATV_S_ET) DO UPDATE SET KZAP = excluded.KZAP -- Обновить счетчик при конфликте
        `);
    //последние 500 записей
    global.selectCentralBodiStmt = db.prepare(
      "SELECT * FROM BODI ORDER BY DATV DESC LIMIT 500"
    );
    global.countCentralBodiStmt = db.prepare(
      "SELECT COUNT(*) as cnt FROM BODI"
    );
  } catch (err) {
    log("ERROR", `ОШИБКА инициализации БД ГО: ${err.message}`);
    process.exit(1);
  }
}

// T_SUB и T_IST
function populateConfigTables() {
  const checkSubStmt = db.prepare("SELECT COUNT(*) as cnt FROM T_SUB");
  const insertSubStmt = db.prepare(
    `INSERT INTO T_SUB (ACT, SUB, SUB_NAME, SUB_ADR, WITH_PROXY, SUB_PORT, SUB_PROXY, SUB_PATH, SUB_PROXY_PORT) VALUES (@ACT, @SUB, @SUB_NAME, @SUB_ADR, @WITH_PROXY, @SUB_PORT, @SUB_PROXY, @SUB_PATH, @SUB_PROXY_PORT)`
  );
  const checkIstStmt = db.prepare("SELECT COUNT(*) as cnt FROM T_IST");
  const insertIstStmt = db.prepare(
    `INSERT INTO T_IST (IST, PERIOD, ED, DT_BEG, DT_END) VALUES (@IST, @PERIOD, @ED, @DT_BEG, @DT_END)`
  );

  const populateSubs = db.transaction(() => {
    if (checkSubStmt.get().cnt === 0) {
      log("INFO", `Заполнение таблицы T_SUB начальными данными...`);
      for (const sub of T_SUB_InitialData) insertSubStmt.run(sub);
      log("INFO", `T_SUB заполнена.`);
    } else {
      log("INFO", `Таблица T_SUB уже содержит данные.`);
    }
  });

  const populateIsts = db.transaction(() => {
    if (checkIstStmt.get().cnt === 0) {
      log("INFO", `Заполнение таблицы T_IST начальными данными...`);
      for (const ist of T_IST_InitialData) insertIstStmt.run(ist);
      log("INFO", `T_IST заполнена.`);
    } else {
      log("INFO", `Таблица T_IST уже содержит данные.`);
    }
  });

  try {
    populateSubs();
    populateIsts();
  } catch (err) {
    log("ERROR", `Ошибка заполнения конфигурационных таблиц: ${err.message}`);
  }
}

//  загрузка списка активных ТО из БД T_SUB
function loadSubjectsToPoll() {
  try {
    // Выбираем всех активных субъектов, кроме самой ГО
    subjectsToPoll = db
      .prepare(`SELECT * FROM T_SUB WHERE ACT = '1' AND SUB != ?`)
      .all(MY_SUB_CODE);
    if (subjectsToPoll.length === 0) {
      log("WARN", "В БД T_SUB не найдено активных субъектов ТО для опроса!");
    } else {
      log(
        "INFO",
        `Будут опрашиваться субъекты ТО из БД: ${subjectsToPoll
          .map((s) => s.SUB)
          .join(", ")}`
      );
      // состояние репликации для загруженных субъектов
      subjectsToPoll.forEach((subject) => {
        if (!(subject.SUB in lastPulledTimestampPerSubject)) {
          lastPulledTimestampPerSubject[subject.SUB] = null;
        }
      });
    }
  } catch (err) {
    log("ERROR", `Ошибка загрузки списка субъектов из T_SUB: ${err.message}`);
    subjectsToPoll = []; // сбрасываем список при ошибке
  }
}

// состояние репликации
const lastPulledTimestampPerSubject = {};

// вытягивающ репликация
async function pullDataFromSubject(subject) {
  const subjectCode = subject.SUB; // код ТО
  const subjectAddress = subject.SUB_ADR; // адрес ТО из T_SUB
  const apiUrl = `${subjectAddress}/data/since`; // API ТО
  const lastTimestamp = lastPulledTimestampPerSubject[subjectCode]; // последняя метка для этого ТО
  const requestUrl = lastTimestamp
    ? `${apiUrl}?lastTimestamp=${encodeURIComponent(lastTimestamp)}`
    : apiUrl;

  log(
    "INFO",
    `Запрос данных с ${
      lastTimestamp ? "метки: " + lastTimestamp : "начала"
    } у ${subjectCode}`,
    subjectCode
  );

  try {
    const response = await axios.get(requestUrl, {
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    const newData = response.data;

    if (!Array.isArray(newData)) {
      log(
        "ERROR",
        `Получен некорректный ответ (не массив) от ${subjectCode}. Тип: ${typeof newData}`,
        subjectCode
      );
      return;
    }
    if (newData.length === 0) {
      log(
        "INFO",
        `Нет новых записей для получения от ${subjectCode}.`,
        subjectCode
      );
      return;
    }

    log(
      "REPLICA",
      `Получено ${newData.length} записей от ${subjectCode}. Первая OBJ: ${
        newData[0]?.OBJ || "N/A"
      }`,
      subjectCode
    );

    // транзакция для получ данных
    let insertedCount = 0;
    let firstRecordTimestamp = null;
    let firstRecordIst = null;
    const insertTransaction = db.transaction(() => {
      for (const record of newData) {
        if (
          !record ||
          typeof record !== "object" ||
          !record.IST ||
          !record.SUB ||
          !record.DATV
        ) {
          log(
            "WARN",
            `Пропущена некорректная запись от ${subjectCode}: ${JSON.stringify(
              record
            )}`,
            subjectCode
          );
          continue;
        }
        if (record.SUB !== subjectCode) {
          log(
            "WARN",
            `Получена запись с неверным SUB (${record.SUB}) от ${subjectCode}. Пропущена.`,
            subjectCode
          );
          continue;
        }

        try {
          // вставка с игнорированием дубликатов
          const result = global.insertBodiStmt.run(record);
          insertedCount += result.changes; // changes будет 1 если вставлено, 0 если дубликат
          if (result.changes > 0 && insertedCount === 1) {
            firstRecordTimestamp = record.DATV;
            firstRecordIst = record.IST;
          }
        } catch (insertErr) {
          log(
            "ERROR",
            `Ошибка вставки записи BODI от ${subjectCode}: ${insertErr.message}`,
            subjectCode
          );
        }
      }
    });

    try {
      insertTransaction();
      if (insertedCount > 0) {
        log(
          "REPLICA",
          `Успешно вставлено ${insertedCount} новых записей в BODI из ${newData.length} полученных от ${subjectCode}.`,
          subjectCode
        );

        // запись  о пакете, если были вставки
        if (firstRecordTimestamp && firstRecordIst) {
          try {
            global.insertBodkStmt.run({
              IST: firstRecordIst,
              SUB: subjectCode,
              DATV_S_ET: firstRecordTimestamp, // маркер пакета
              KZAP: insertedCount,
            });
            log(
              "INFO",
              `Запись о пакете (${insertedCount} шт.) добавлена/обновлена в BODK для ${subjectCode}`,
              subjectCode
            );
          } catch (bodkErr) {
            log(
              "ERROR",
              `Ошибка записи в BODK для ${subjectCode}: ${bodkErr.message}`
            );
          }
        }

        // обновление метки времени
        let latestTimestampInBatch = lastTimestamp || new Date(0).toISOString();
        try {
          newData.sort((a, b) => new Date(a.DATV) - new Date(b.DATV));
          const currentLatest = newData[newData.length - 1].DATV;
          // обновляем, если новая метка больше старой
          if (
            !lastTimestamp ||
            new Date(currentLatest) > new Date(lastTimestamp)
          ) {
            lastPulledTimestampPerSubject[subjectCode] = currentLatest;
            log(
              "INFO",
              `Обновлена последняя метка DATV для ${subjectCode} на: ${currentLatest}`,
              subjectCode
            );
          } else {
            log(
              "INFO",
              `Данные от ${subjectCode} не новее метки DATV (${lastTimestamp}). Метка не обновлена.`,
              subjectCode
            );
          }
        } catch (e) {
          log(
            "ERROR",
            `Ошибка при обработке временных меток DATV от ${subjectCode}: ${e.message}`,
            subjectCode
          );
        }
      } else {
        //  insertedCount === 0 - все полученные записи были дубликатами
        log(
          "INFO",
          `Не было вставлено новых записей от ${subjectCode} (получены дубликаты или ошибки). Метка не обновлена.`,
          subjectCode
        );
      }
    } catch (txErr) {
      log(
        "ERROR",
        `Ошибка транзакции при вставке данных от ${subjectCode}: ${txErr.message}`,
        subjectCode
      );
    }
  } catch (error) {
    let errorLevel = "ERROR";
    let errorDetails = "";
    if (error.code === "ECONNABORTED") {
      errorDetails = `Таймаут запроса (${REQUEST_TIMEOUT_MS}ms)`;
      errorLevel = "WARN";
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      errorDetails = `Сервис недоступен (${error.code})`;
    } else if (error.response) {
      errorDetails = `Сервер ${subjectCode} ответил ${error.response.status}`;
      if (error.response.data?.error) {
        errorDetails += ` - ${error.response.data.error}`;
      }
    } else {
      errorDetails = `Ошибка сети/запроса: ${error.message}`;
    }
    log(errorLevel, `Ошибка репликации: ${errorDetails}`, subjectCode);
  }
}

// цикл опроса
function startReplicationPolling() {
  log(
    "INFO",
    `Запуск цикла репликации каждые ${POLLING_INTERVAL_MS / 1000} сек.`
  );
  const pollCycle = () => {
    log("INFO", "--- Начало нового цикла опроса ТО ---");
    // опрашиваем только активные сервисы
    subjectsToPoll.forEach((subject) => {
      pullDataFromSubject(subject).catch((err) => {
        log(
          "CRITICAL",
          `Неожиданная ошибка pullDataFromSubject для ${subject.SUB}: ${err.message}`,
          subject.SUB
        );
      });
    });
  };
  pollCycle(); // первый запуск
  setInterval(pollCycle, POLLING_INTERVAL_MS); // регулярный запуск
}

app.get("/central-data", (req, res) => {
  log("INFO", "Получен запрос на /central-data");
  if (!db) {
    return res.status(503).json({ error: "База данных не инициализирована" });
  }
  try {
    const records = global.selectCentralBodiStmt.all();
    const total = global.countCentralBodiStmt.get().cnt;
    res.json({
      description: "Центральное хранилище данных ГО (из SQLite)",
      totalRecordsInDb: total,
      showingLastRecords: records.length,
      records: records,
    });
  } catch (err) {
    log("ERROR", `Ошибка API /central-data: ${err.message}`);
    res
      .status(500)
      .json({ error: "Ошибка сервера при чтении центральных данных" });
  }
});

app.get("/", (req, res) => {
  res.send(`
        <h1>Центральный Сервис Репликации (${MY_SUB_CODE})</h1>
        <p>Работает с базой данных SQLite: ${DB_FILE}</p>
        <p>Опрашивает ТО из таблицы T_SUB: ${
          subjectsToPoll.map((s) => s.SUB).join(", ") || "Нет активных ТО"
        }</p>
        <p>Проверьте <a href="/central-data">/central-data</a> для просмотра данных.</p>
        <p>Интервал опроса: ${POLLING_INTERVAL_MS / 1000} секунд</p>
        <p>Логи: консоль и <code>${LOG_FILE}</code></p>
    `);
});

app.listen(PORT, () => {
  initDb();
  log("INFO", `Центральный сервис ГО (${MY_SUB_CODE}) с SQLite запущен`);
  log("INFO", `Адрес: http://localhost:${PORT}`);
  if (subjectsToPoll.length > 0) {
    startReplicationPolling();
  } else {
    log(
      "WARN",
      "Нет активных ТО для опроса в БД T_SUB. Цикл репликации не запущен."
    );
  }
});

process.on("exit", () => {
  if (db) db.close();
  console.log(`[${MY_SUB_CODE}] Соединение с БД ГО закрыто.`);
});
process.on("SIGHUP", () => process.exit(128 + 1));
process.on("SIGINT", () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));

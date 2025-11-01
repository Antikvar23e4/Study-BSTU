const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, "to1.sqlite");
const SERVICE_ID_INTERNAL = "TO_Service_01";
const MY_SUB_CODE = "T01REG";
const CLEAR_DB_ON_START = true;

app.use(express.json({ limit: "5mb" }));

function log(level, message) {
  console.log(
    `[${new Date().toISOString()}] [${level.toUpperCase()}] [${MY_SUB_CODE}] ${message}`
  );
}

let db;
function initDb() {
  try {
    db = new Database(DB_FILE);
    log("INFO", `TO-1 SQLite database connected: ${DB_FILE}`);
    db.exec(`
            CREATE TABLE IF NOT EXISTS BODI (
                IST TEXT NOT NULL, TABL TEXT NOT NULL, POK TEXT NOT NULL, UT TEXT NOT NULL,
                SUB TEXT NOT NULL, OTN TEXT NOT NULL, OBJ TEXT NOT NULL, VID TEXT NOT NULL, PER TEXT NOT NULL,
                DATV TEXT NOT NULL, DATV_SET TEXT NOT NULL, ZNC REAL, PP TEXT NOT NULL,
                PRIMARY KEY (IST, TABL, POK, UT, SUB, OTN, OBJ, VID, PER, DATV)
            );
        `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_bodi_datv ON BODI (DATV);`);
    log("INFO", `TO-1 BODI table ready.`);

    if (CLEAR_DB_ON_START) {
      // очищение бд при запускек
      try {
        log("WARN", "Clearing BODI table on start...");
        const info = db.prepare("DELETE FROM BODI").run();
        log("WARN", `BODI table cleared. Rows deleted: ${info.changes}`);
      } catch (clearErr) {
        log("ERROR", `Error clearing BODI: ${clearErr.message}`);
      }
    } else {
      log(
        "INFO",
        "DB clearing on start is disabled (CLEAR_DB_ON_START=false)."
      );
    }
    // запросы 1) втсавка 2) кол-во записей 3) вывод всех
    global.insertBodiStmt = db.prepare(`
            INSERT INTO BODI (IST, TABL, POK, UT, SUB, OTN, OBJ, VID, PER, DATV, DATV_SET, ZNC, PP)
            VALUES (@IST, @TABL, @POK, @UT, @SUB, @OTN, @OBJ, @VID, @PER, @DATV, @DATV_SET, @ZNC, @PP)
            ON CONFLICT(IST, TABL, POK, UT, SUB, OTN, OBJ, VID, PER, DATV) DO NOTHING
        `);
    global.countBodiStmt = db.prepare("SELECT COUNT(*) as cnt FROM BODI");
    global.selectLocalBodiStmt = db.prepare(
      "SELECT * FROM BODI ORDER BY DATV DESC LIMIT 100"
    );
  } catch (err) {
    log("ERROR", `CRITICAL TO-1 DB INIT ERROR: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

//принимает пост запросы
app.post("/receive-data", (req, res) => {
  const receivedData = req.body; // получаем данные из тела запроса
  const remoteIp = req.ip;

  if (!Array.isArray(receivedData) || receivedData.length === 0) {
    log(
      "WARN",
      `Received invalid request on /receive-data (not array or empty) from ${remoteIp}`
    );
    return res.status(400).json({
      error: "Request body must be a non-empty array of BODI records.",
    });
  }
  const firstRecord = receivedData[0]; // провереям что запись соответсвует коду сервера
  if (!firstRecord || !firstRecord.SUB || firstRecord.SUB !== MY_SUB_CODE) {
    log(
      "WARN",
      `Received data packet not intended for this subject (${
        firstRecord?.SUB || "N/A"
      }) from ${remoteIp}. Rejected.`
    );
    return res
      .status(400)
      .json({ error: `Data not intended for subject ${MY_SUB_CODE}` });
  }

  log(
    "INFO",
    `Received ${receivedData.length} records from GO (IP: ${remoteIp}) on /receive-data`
  );

  let insertedCount = 0;
  // транзакция для вставки данных используя данные полученные из тела запроса
  const insertTransaction = db.transaction(() => {
    for (const record of receivedData) {
      //валидация
      if (
        !record ||
        typeof record !== "object" ||
        !record.IST ||
        !record.DATV ||
        record.SUB !== MY_SUB_CODE
      ) {
        log(
          "WARN",
          `Skipping invalid/mismatched record in batch from GO: ${JSON.stringify(
            record
          )}`
        );
        continue;
      }
      try {
        //вставка и увеличение счетчика вставленных
        const result = global.insertBodiStmt.run(record);
        insertedCount += result.changes;
      } catch (insertErr) {
        log(
          "ERROR",
          `Error inserting BODI record from GO: ${insertErr.message}`
        );
      }
    }
  });

  try {
    insertTransaction();
    log(
      "INFO",
      `Processed ${receivedData.length} records from GO, successfully inserted ${insertedCount} new records.`
    );
    // Отправляем ответ с данными.
    res.status(200).json({
      message: `Data received and processed by ${MY_SUB_CODE}`,
      received: receivedData.length,
      inserted: insertedCount,
    });
  } catch (txErr) {
    log(
      "ERROR",
      `Transaction error while saving data from GO: ${txErr.message}`
    );
    res.status(500).json({ error: "Server error saving received data" });
  }
});

app.listen(PORT, () => {
  initDb();
  console.log(
    `\n[${SERVICE_ID_INTERNAL}] TO Service (${MY_SUB_CODE}) SQLite Receiver (Clear=${CLEAR_DB_ON_START}) started`
  );
  console.log(`[${MY_SUB_CODE}] Address: http://localhost:${PORT}`);
  console.log(
    `[${MY_SUB_CODE}] Waiting for POST requests on /receive-data from GO...`
  );
});

app.get("/local-data", (req, res) => {
  log("INFO", "Request received for /local-data (JSON)");
  if (!db) {
    return res.status(503).json({ error: "База данных не инициализирована" });
  }
  try {
    const records = db
      .prepare("SELECT * FROM BODI ORDER BY DATV DESC LIMIT 100")
      .all();
    const total = db.prepare("SELECT COUNT(*) as cnt FROM BODI").get().cnt;
    res.json({
      description: `Локальные данные ТО ${MY_SUB_CODE} (получены от ГО)`,
      totalRecordsInDb: total,
      showingLastRecords: records.length,
      records: records,
    });
  } catch (err) {
    log("ERROR", `API /local-data error: ${err.message}`);
    res
      .status(500)
      .json({ error: "Ошибка сервера при чтении локальных данных" });
  }
});

process.on("SIGINT", () => {
  log("INFO", "Shutting down...");
  db?.close();
  process.exit(0);
});

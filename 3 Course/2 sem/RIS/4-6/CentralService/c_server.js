const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { T_SUB_InitialData, T_IST_InitialData } = require("../service-db");

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, "go.sqlite");
const MY_SUB_CODE = "GO_CNTR";
const PUSH_INTERVAL_MS = 10000;
const PUSH_BATCH_LIMIT = 100;
const GENERATION_INTERVAL_MS = 10000;
const LOG_FILE = path.join(__dirname, "replication.log");
const STUDENT_NUMBER = 10;

let db;
let subjectsToPushTo = [];
const lastPushedTimestampPerSubject = {};
let isPushing = false;

// формат времени
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

//логи
function log(level, message, subjectCode = null) {
  const timestamp = formatTimestamp(new Date());
  const levelUpper = level.toUpperCase();
  const sourcePrefix = subjectCode ? `[${subjectCode}] ` : `[${MY_SUB_CODE}] `;
  const fileMessage = `[${timestamp}] [${levelUpper}] ${sourcePrefix}${message}\n`;
  let consoleColorStart = "";
  const consoleColorEnd = "\x1b[0m";
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
      break; // Cyan or default
    default:
      consoleColorStart = "\x1b[90m";
      break; // Grey
  }
  const consoleMessage = `${consoleColorStart}[${timestamp}] [${levelUpper}] ${sourcePrefix}${message}${consoleColorEnd}\n`;
  process.stdout.write(consoleMessage);
  fs.appendFile(LOG_FILE, fileMessage, (err) => {
    if (err) {
      const errorTimestamp = formatTimestamp(new Date());
      process.stdout.write(
        `\x1b[31m[${errorTimestamp}] [ERROR] [${MY_SUB_CODE}] Log file write error (${LOG_FILE}): ${err}\x1b[0m\n`
      );
    }
  });
}

//запросы 1) проверка есть ли записи 2)вствка
function populateConfigTables() {
  if (!db) {
    log("ERROR", "DB not initialized for populating config tables!");
    return;
  }

  const checkSubStmt = db.prepare("SELECT COUNT(*) as cnt FROM T_SUB");
  const insertSubStmt = db.prepare(
    `INSERT INTO T_SUB (ACT, SUB, SUB_NAME, SUB_ADR, WITH_PROXY, SUB_PORT, SUB_PROXY, SUB_PATH, SUB_PROXY_PORT) VALUES (@ACT, @SUB, @SUB_NAME, @SUB_ADR, @WITH_PROXY, @SUB_PORT, @SUB_PROXY, @SUB_PATH, @SUB_PROXY_PORT)`
  );

  const checkIstStmt = db.prepare("SELECT COUNT(*) as cnt FROM T_IST");
  const insertIstStmt = db.prepare(
    `INSERT INTO T_IST (IST, PERIOD, ED, DT_BEG, DT_END) VALUES (@IST, @PERIOD, @ED, @DT_BEG, @DT_END)`
  );
  // для табл T_SUB
  const populateSubs = db.transaction(() => {
    if (checkSubStmt.get().cnt === 0) {
      log("INFO", `Populating T_SUB table with initial data...`);
      for (const sub of T_SUB_InitialData) insertSubStmt.run(sub);
      log("INFO", `T_SUB populated.`);
    } else {
      log("INFO", `T_SUB table already contains data.`);
    }
  });
  // для табл T_IST
  const populateIsts = db.transaction(() => {
    if (checkIstStmt.get().cnt === 0) {
      log("INFO", `Populating T_IST table with initial data...`);
      for (const ist of T_IST_InitialData) insertIstStmt.run(ist);
      log("INFO", `T_IST populated.`);
    } else {
      log("INFO", `T_IST table already contains data.`);
    }
  });

  try {
    populateSubs();
    populateIsts();
  } catch (err) {
    log("ERROR", `Error populating config tables: ${err.message}`);
  }
}

// загружаем из кофигураций наши сервера
function loadSubjectsToPushTo() {
  if (!db) {
    log("ERROR", "DB not initialized for loading subjects!");
    return;
  }
  try {
    //выбираем активные сервера
    subjectsToPushTo = db
      .prepare(`SELECT * FROM T_SUB WHERE ACT = '1' AND SUB != ?`)
      .all(MY_SUB_CODE);
    if (subjectsToPushTo.length === 0) {
      log("WARN", "No active TO subjects found in T_SUB to push data to!");
    } else {
      log(
        "INFO",
        `Will push data to TOs: ${subjectsToPushTo
          .map((s) => s.SUB)
          .join(", ")}`
      );
      //усстанавливаем первоначальную временную метку
      subjectsToPushTo.forEach((subject) => {
        if (!(subject.SUB in lastPushedTimestampPerSubject)) {
          lastPushedTimestampPerSubject[subject.SUB] =
            "1970-01-01T00:00:00.000Z";
        }
      });
    }
  } catch (err) {
    log("ERROR", `Error loading subject list from T_SUB: ${err.message}`);
    subjectsToPushTo = [];
  }
}

//создаем бд, таблицы и запросы для вставки данных
function initDb() {
  try {
    db = new Database(DB_FILE);
    log("INFO", `GO SQLite database connected: ${DB_FILE}`);
    db.exec(
      `CREATE TABLE IF NOT EXISTS BODI (IST TEXT NOT NULL, TABL TEXT NOT NULL, POK TEXT NOT NULL, UT TEXT NOT NULL, SUB TEXT NOT NULL, OTN TEXT NOT NULL, OBJ TEXT NOT NULL, VID TEXT NOT NULL, PER TEXT NOT NULL, DATV TEXT NOT NULL, DATV_SET TEXT NOT NULL, ZNC REAL, PP TEXT NOT NULL, PRIMARY KEY (IST, TABL, POK, UT, SUB, OTN, OBJ, VID, PER, DATV) );`
    );
    db.exec(`CREATE INDEX IF NOT EXISTS idx_go_bodi_datv ON BODI (DATV);`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_go_bodi_sub ON BODI (SUB);`);
    db.exec(
      `CREATE TABLE IF NOT EXISTS BODK ( IST TEXT NOT NULL, SUB TEXT NOT NULL, DATV_S_ET TEXT NOT NULL, KZAP INTEGER NOT NULL, PRIMARY KEY (IST, SUB, DATV_S_ET) );`
    );
    db.exec(
      `CREATE TABLE IF NOT EXISTS T_SUB ( ACT TEXT NOT NULL, SUB TEXT PRIMARY KEY, SUB_NAME TEXT, SUB_ADR TEXT, WITH_PROXY TEXT, SUB_PORT TEXT, SUB_PROXY TEXT, SUB_PATH TEXT, SUB_PROXY_PORT TEXT );`
    );
    db.exec(
      `CREATE TABLE IF NOT EXISTS T_IST ( IST TEXT PRIMARY KEY, PERIOD TEXT, ED TEXT, DT_BEG TEXT, DT_END TEXT );`
    );
    db.exec(
      `CREATE TABLE IF NOT EXISTS N_TI ( N_TI INTEGER PRIMARY KEY AUTOINCREMENT, IST TEXT, TABL TEXT, POK TEXT, UT TEXT, SUB TEXT, OTN TEXT, OBJ TEXT, VID TEXT, PER TEXT, SUB_R TEXT, NAME TEXT, ACT INTEGER );`
    );
    db.exec(
      `CREATE TABLE IF NOT EXISTS T_SN ( IST TEXT NOT NULL, SUB TEXT NOT NULL, SN TEXT NOT NULL, PRIMARY KEY (IST, SUB) );`
    );
    log("INFO", `GO table structure verified/created.`);

    populateConfigTables();
    loadSubjectsToPushTo();

    global.insertBodiStmt = db.prepare(
      `INSERT INTO BODI (IST, TABL, POK, UT, SUB, OTN, OBJ, VID, PER, DATV, DATV_SET, ZNC, PP) VALUES (@IST, @TABL, @POK, @UT, @SUB, @OTN, @OBJ, @VID, @PER, @DATV, @DATV_SET, @ZNC, @PP) ON CONFLICT(IST, TABL, POK, UT, SUB, OTN, OBJ, VID, PER, DATV) DO NOTHING`
    );
    global.insertBodkStmt = db.prepare(
      `INSERT INTO BODK (IST, SUB, DATV_S_ET, KZAP) VALUES (@IST, @SUB, @DATV_S_ET, @KZAP) ON CONFLICT(IST, SUB, DATV_S_ET) DO UPDATE SET KZAP = excluded.KZAP`
    );
    global.selectNewBodiForSubjectStmt = db.prepare(
      `SELECT * FROM BODI WHERE SUB = ? AND DATV > ? ORDER BY DATV ASC LIMIT ?`
    );
    global.selectCentralBodiStmt = db.prepare(
      "SELECT * FROM BODI ORDER BY DATV DESC LIMIT 500"
    );
    global.countCentralBodiStmt = db.prepare(
      "SELECT COUNT(*) as cnt FROM BODI"
    );
  } catch (err) {
    log("ERROR", `CRITICAL GO DB INIT ERROR: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// создание и вствка записей
function createAndInsertGoBodiRecord(globalObjectIdNum) {
  if (!db) return;

  const now = new Date();
  const timestampISO = now.toISOString();

  let targetSubjectCode = "";
  let pokCode = "";
  let value = 0;
  const globalObjCode = `GO_CNTR`;

  if (globalObjectIdNum >= 1 && globalObjectIdNum <= 5) {
    targetSubjectCode = "T01REG";
    pokCode = `PWR`;
    value = parseFloat(
      (STUDENT_NUMBER * 10 + Math.random() * STUDENT_NUMBER * 5).toFixed(3)
    );
  } else if (globalObjectIdNum >= 6 && globalObjectIdNum <= 10) {
    targetSubjectCode = "T02REG";
    pokCode = `FLW`;
    value = parseFloat(
      (STUDENT_NUMBER * 20 + Math.random() * STUDENT_NUMBER * 8).toFixed(3)
    );
  } else {
    log(
      "WARN",
      `[GENERATION] Invalid global objectIdNum: ${globalObjectIdNum} passed to createAndInsert.`
    );
    return;
  }

  const record = {
    IST: "101",
    TABL: "FACTDATA",
    POK: pokCode,
    UT: "00",
    SUB: targetSubjectCode,
    OTN: "00",
    OBJ: globalObjCode,
    VID: "01",
    PER: "00",
    DATV: timestampISO,
    DATV_SET: timestampISO,
    ZNC: value,
    PP: "00",
  };

  try {
    //вставка записи
    const info = global.insertBodiStmt.run(record);
  } catch (genInsertErr) {
    log(
      "WARN",
      `[GENERATION] Error inserting generated record for OBJ ${record.OBJ}: ${genInsertErr.message}`
    );
  }
}

//начальная вставка данных
function initialPopulationGo() {
  if (!db) {
    log("ERROR", "[GENERATION] DB not ready for initial population.");
    return;
  }
  log("INFO", "[GENERATION] Checking GO DB initial population...");
  //текущ кол-во записей
  const count = global.countCentralBodiStmt.get().cnt;
  //кол-во записей для вставки
  const expectedInitialCount = subjectsToPushTo.length * 10;
  if (count >= expectedInitialCount && expectedInitialCount > 0) {
    log(
      "INFO",
      `[GENERATION] Initial GO records seem to exist (${count} >= ${expectedInitialCount}). Skipping.`
    );
    return;
  }
  log(
    "INFO",
    `[GENERATION] Creating initial ${expectedInitialCount} records in GO DB...`
  );
  //вставка новых записей
  const initialGenTransaction = db.transaction(() => {
    subjectsToPushTo.forEach((subject) => {
      for (let i = 1; i <= 10; i++) {
        const now = new Date();
        now.setSeconds(now.getSeconds() - (11 - i));
        const timestampISO = now.toISOString();
        createAndInsertGoBodiRecord(subject.SUB, i);
      }
    });
  });
  try {
    initialGenTransaction();
    log("INFO", "[GENERATION] Initial GO DB population complete.");
  } catch (err) {
    log(
      "ERROR",
      `[GENERATION] Error during initial GO population: ${err.message}`
    );
  }
}

function generateDataContinuouslyGo() {
  if (!db) {
    log("ERROR", "[GENERATION] DB not ready for continuous generation.");
    return;
  }
  if (subjectsToPushTo.length === 0) {
    log(
      "WARN",
      "[GENERATION] No active TOs to generate data for. Skipping generation cycle."
    );
    return;
  }

  log(
    "INFO",
    `[GENERATION] Starting scheduled generation: 5 records for each active TO...`
  );

  subjectsToPushTo.forEach((subjectInfo) => {
    const subjectCode = subjectInfo.SUB;
    log("INFO", `[GENERATION] Generating 5 records for ${subjectCode}...`);

    let startTi = 0;
    let endTi = 0;

    if (subjectCode === "T01REG") {
      startTi = 1;
      endTi = 5;
    } else if (subjectCode === "T02REG") {
      startTi = 6;
      endTi = 10;
    } else {
      log(
        "WARN",
        `[GENERATION] Unknown subject code '${subjectCode}' encountered in generation loop. No TI range defined. Skipping.`
      );
      return;
    }
    // создаем записи для каждого TI
    for (
      let globalTiNumber = startTi;
      globalTiNumber <= endTi;
      globalTiNumber++
    ) {
      createAndInsertGoBodiRecord(globalTiNumber);
    }
    log(
      "INFO",
      `[GENERATION] Finished generating 5 records for ${subjectCode}.`
    );
  });

  log("INFO", `[GENERATION] Scheduled generation cycle complete.`);
}

//  функция для отправки данных
async function pushDataToSubject(subjectInfo) {
  // получаем код и адрес
  const subjectCode = subjectInfo.SUB;
  const subjectAddress = subjectInfo.SUB_ADR;

  //URL для отправки данных
  const pushUrlPath = "/receive-data";
  const pushUrl = `${subjectAddress}${pushUrlPath}`;
  const lastPushedTime =
    lastPushedTimestampPerSubject[subjectCode] || "1970-01-01T00:00:00.000Z";

  log(
    "INFO",
    `Checking for new data to push to ${subjectCode} (since ${lastPushedTime})`,
    subjectCode
  );

  let recordsToPush = [];
  try {
    //получаем новые записи из дб
    recordsToPush = global.selectNewBodiForSubjectStmt.all(
      subjectCode,
      lastPushedTime,
      PUSH_BATCH_LIMIT
    );
  } catch (err) {
    log(
      "ERROR",
      `Error reading new data from GO DB for ${subjectCode}: ${err.message}`,
      subjectCode
    );
    return;
  }

  if (recordsToPush.length === 0) {
    log("INFO", `No new data to push to ${subjectCode}.`, subjectCode);
    return;
  }

  log(
    "REPLICA",
    `Found ${recordsToPush.length} records to push to ${subjectCode} at ${pushUrl}`,
    subjectCode
  );

  try {
    // если такие есть то отправляем их
    const response = await axios.post(pushUrl, recordsToPush, {
      timeout: 5000,
    });

    if (response.status >= 200 && response.status < 300) {
      const latestTimestampInBatch =
        recordsToPush[recordsToPush.length - 1].DATV;
      // если все ок - обновляем временную метку
      lastPushedTimestampPerSubject[subjectCode] = latestTimestampInBatch;
      log(
        "SUCCESS",
        `Successfully pushed ${recordsToPush.length} records to ${subjectCode}. Last timestamp updated to: ${latestTimestampInBatch}`,
        subjectCode
      );
      if (response.data?.message)
        log(
          "INFO",
          `Response from ${subjectCode}: ${response.data.message}`,
          subjectCode
        );
    } else {
      log(
        "ERROR",
        `Push error: ${subjectCode} responded with status ${response.status}. Data not confirmed sent.`,
        subjectCode
      );
    }
  } catch (error) {
    let errMsg = error.message;
    if (error.response) {
      errMsg = `${subjectCode} responded ${error.response.status} - ${
        error.response.data?.error || error.response.statusText
      }`;
    } else if (error.request) {
      errMsg = `No response from ${subjectCode} (${error.code || "Timeout?"}).`;
    }
    log(
      "ERROR",
      `Failed to push data to ${subjectCode}: ${errMsg}`,
      subjectCode
    );
  }
}

function startPushReplicationCycle() {
  if (isPushing || subjectsToPushTo.length === 0) {
    if (isPushing) log("WARN", "Push cycle already running.");
    return;
  }
  isPushing = true;

  log(
    "INFO",
    `Starting push replication cycle every ${PUSH_INTERVAL_MS / 1000} sec.`
  );
  // цикл для отправки данных
  const pushCycle = () => {
    log("INFO", "--- Starting new push cycle to TOs ---");
    subjectsToPushTo.forEach((subjectInfo) => {
      pushDataToSubject(subjectInfo).catch((err) => {
        log(
          "CRITICAL",
          `Unexpected error in pushDataToSubject for ${subjectInfo.SUB}: ${err.message}`,
          subjectInfo.SUB
        );
      });
    });
  };
  pushCycle();
  setInterval(pushCycle, PUSH_INTERVAL_MS);
}

app.get("/central-data", (req, res) => {
  log("INFO", "Request received for /central-data");
  if (!db) {
    return res.status(503).json({ error: "Database not initialized" });
  }
  try {
    // кол-во записей в бд
    const records = global.selectCentralBodiStmt.all();
    const total = global.countCentralBodiStmt.get().cnt;
    res.json({
      description: "Central GO Data Storage (from SQLite)",
      totalRecordsInDb: total,
      showingLastRecords: records.length,
      records: records,
    });
  } catch (err) {
    log("ERROR", `API /central-data error: ${err.message}`);
    res.status(500).json({ error: "Server error reading central data" });
  }
});

app.get("/", (req, res) => {
  res.send(`
        <h1>Central Service (${MY_SUB_CODE}) - PUSH to TO Mode (Lab 6)</h1>
        <p>Using SQLite DB: ${DB_FILE}</p>
        <p>Pushing data to TOs listed in T_SUB: ${
          subjectsToPushTo.map((s) => s.SUB).join(", ") || "None active"
        }</p>
        <p>Check <a href="/central-data">/central-data</a> to view data in GO DB.</p>
        <p>Push Interval: ${PUSH_INTERVAL_MS / 1000} seconds</p>
        <p>GO Data Generation Interval: ${
          GENERATION_INTERVAL_MS / 1000
        } seconds</p>
        <p>Logs: console and <code>${LOG_FILE}</code></p>
    `);
});

app.listen(PORT, () => {
  initDb();
  initialPopulationGo();
  setInterval(generateDataContinuouslyGo, GENERATION_INTERVAL_MS);
  log(
    "INFO",
    `Central Service GO (${MY_SUB_CODE}) with SQLite (Generator + PUSH to TO) started`
  );
  log("INFO", `Address: http://localhost:${PORT}`);
  log(
    "INFO",
    `Data generation into GO DB started (every ${
      GENERATION_INTERVAL_MS / 1000
    } sec).`
  );

  if (subjectsToPushTo.length > 0) {
    startPushReplicationCycle();
  } else {
    log("WARN", "No active TOs found to push data to. Push cycle not started.");
  }
});

process.on("SIGINT", () => {
  log("INFO", "Shutting down...");
  db?.close();
  process.exit(0);
});

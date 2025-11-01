const express = require("express");
const axios = require("axios"); // для выполнения HTTP-запросов
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const POLLING_INTERVAL_MS = 5000; // опрос каждые 5 секунд
const REQUEST_TIMEOUT_MS = 2000; // ожидание ответа макс. 2 секунды
const LOG_FILE = path.join(__dirname, "polling.log");

// конфигурация
const sources = [
  { id: "TI_Service_01", url: "http://localhost:3001/data" },
  { id: "TI_Service_02", url: "http://localhost:3002/data" },

  { id: "TI_Service_NonExistent", url: "http://localhost:9999/data" }, // для тестирования недоступности
];

// хранение статуса каждого источника
// статус может быть 'ok', 'error', 'timeout', 'unreachable', 'unknown'
const sourceStatus = {};
sources.forEach((source) => {
  sourceStatus[source.id] = {
    status: "unknown", // Текущий статус
    lastCheck: null, // Время последней проверки
    lastSuccess: null, // Время последней успешной проверки
    lastError: null, // Время последней ошибки
    lastData: null, // Последние полученные данные
    errorDetails: null, // Детали последней ошибки
    url: source.url, // URL источника
  };
});

//  логирование
// форматирует временную метку для логов
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

// основная функция логирования
function log(level, message, sourceId = null) {
  const timestamp = formatTimestamp(new Date());
  const levelUpper = level.toUpperCase();
  const sourcePrefix = sourceId ? `[${sourceId}] ` : "";
  // сообщение для файла (без цвета)
  const fileMessage = `[${timestamp}] [${levelUpper}] ${sourcePrefix}${message}\n`;

  // определяем цвет для консоли
  let consoleColorStart = "";
  const consoleColorEnd = "\x1b[0m"; // Сброс цвета
  switch (levelUpper) {
    case "ERROR":
    case "CRITICAL":
      consoleColorStart = "\x1b[31m"; // красный
      break;
    case "WARN":
      consoleColorStart = "\x1b[33m"; // желтый
      break;
    case "SUCCESS":
      consoleColorStart = "\x1b[32m"; // зеленый
      break;
    case "INFO":
      consoleColorStart = sourceId ? "\x1b[36m" : "";
      break;
    default:
      consoleColorStart = "\x1b[90m"; // серый
      break;
  }

  const consoleMessage = `${consoleColorStart}[${timestamp}] [${levelUpper}] ${sourcePrefix}${message}${consoleColorEnd}\n`;
  process.stdout.write(consoleMessage);

  fs.appendFile(LOG_FILE, fileMessage, (err) => {
    if (err) {
      const errorTimestamp = formatTimestamp(new Date());
      process.stdout.write(
        `\x1b[31m[${errorTimestamp}] [ERROR] Ошибка записи в лог-файл (${LOG_FILE}): ${err}\x1b[0m\n`
      );
    }
  });
}

log("INFO", "Центральный сервис запускается...");

async function pollSource(source) {
  const sourceId = source.id;
  const url = source.url;
  const status = sourceStatus[sourceId];
  status.lastCheck = new Date().toISOString(); // храним в ISO для совместимости

  log("INFO", `Попытка опроса по адресу ${url}`, sourceId);

  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: function (status) {
        return status >= 200 && status < 600;
      },
    });

    if (response.status >= 200 && response.status < 300 && response.data) {
      status.status = "ok";
      status.lastSuccess = status.lastCheck;
      status.lastData = response.data;
      status.lastError = null;
      status.errorDetails = null;
      log(
        "SUCCESS",
        `Успешный опрос. Данные: ${JSON.stringify(response.data)}`,
        sourceId
      );
    } else {
      status.status = "error";
      status.lastError = status.lastCheck;
      status.errorDetails = `Сервер ответил со статусом ${response.status}`;
      log("ERROR", `Сервер ответил со статусом ${response.status}`, sourceId);
      status.lastData = null; // очищаем последние данные при ошибке
    }
  } catch (error) {
    status.lastError = status.lastCheck;
    status.lastData = null;

    if (error.code === "ECONNABORTED") {
      status.status = "timeout";
      status.errorDetails = `Запрос превысил таймаут ${REQUEST_TIMEOUT_MS}ms`;
      log("WARN", `Таймаут запроса (${REQUEST_TIMEOUT_MS}ms)`, sourceId);
    } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      status.status = "unreachable";
      status.errorDetails = `Сервис недоступен (${error.code})`;
      log("ERROR", `Сервис недоступен (${error.code})`, sourceId);
    } else if (error.response) {
      status.status = "error";
      status.errorDetails = `Сервер ответил со статусом ${error.response.status}`;
      log(
        "ERROR",
        `Необработанная ошибка ответа сервера, статус ${error.response.status}`,
        sourceId
      );
    } else {
      status.status = "error";
      status.errorDetails = `Ошибка настройки/сети: ${error.message}`;
      log(
        "ERROR",
        `Ошибка настройки запроса или сети: ${error.message}`,
        sourceId
      );
    }
  }
}

function startPolling() {
  log("INFO", `Запуск цикла опроса каждые ${POLLING_INTERVAL_MS} мс`);
  sources.forEach((source) =>
    pollSource(source).catch((err) => {
      log(
        "CRITICAL",
        `Непредвиденная ошибка при первоначальном опросе: ${err.message}`,
        source.id
      );
    })
  );

  setInterval(() => {
    log("INFO", "--- Начало нового цикла опроса ---");
    // опрашиваем все источники параллельно
    sources.forEach((source) => {
      pollSource(source).catch((err) => {
        log(
          "CRITICAL",
          `Неожиданная ошибка во время pollSource: ${err.message}`,
          source.id
        );
      });
    });
  }, POLLING_INTERVAL_MS);
}

app.get("/status", (req, res) => {
  log("INFO", "Получен запрос на /status");
  res.json(sourceStatus);
});

app.get("/", (req, res) => {
  res.send(`
        <h1>Центральный Сервис Опроса</h1>
        <p>Этот сервис опрашивает источники телеметрии.</p>
        <p>Проверьте <a href="/status">/status</a> для получения текущего состояния отслеживаемых источников.</p>
        <p>Интервал опроса: ${POLLING_INTERVAL_MS / 1000} секунд</p>
        <p>Логи записываются в консоль и в файл <code>${LOG_FILE}</code></p>
    `);
});

app.listen(PORT, () => {
  log("INFO", `Центральный сервис запущен на http://localhost:${PORT}`);
  startPolling();
});

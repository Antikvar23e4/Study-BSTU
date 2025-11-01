const http = require("http");
const fs = require("fs");
const url = require("url");
const readline = require("readline");

var data = require("./db.js"); //импортим модуль
var db = new data.DB(); //создаем объект бд

let requestCount = 0;
let commitCount = 0;

let timerSd = null;
let timerSc = null;
let timerSs = null;

let startTime = null;
let endTime = null;

let collectingStats = false;

process.stdin.unref();

db.on("GET", () => {
  if (collectingStats) requestCount++;
});
db.on("POST", () => {
  if (collectingStats) requestCount++;
});
db.on("PUT", () => {
  if (collectingStats) requestCount++;
});
db.on("DELETE", () => {
  if (collectingStats) requestCount++;
});
db.on("COMMIT", () => {
  if (collectingStats) commitCount++;
});

db.on("GET", (request, response) => {
  console.log("DB - GET");
  response.end(JSON.stringify(db.select()));
});

db.on("POST", (request, response) => {
  console.log("DB - POST");
  request.on("data", (data) => {
    let row = JSON.parse(data);
    row.id = db.getIndex();
    response.end(JSON.stringify(db.insert(row)));
  });
});

db.on("PUT", (request, response) => {
  console.log("DB - PUT");
  request.on("data", (data) => {
    let row = JSON.parse(data);
    response.end(JSON.stringify(db.update(row)));
  });
});

db.on("DELETE", (request, response) => {
  console.log("DB - DELETE");
  const query = url.parse(request.url, true).query;

  if (query.id === undefined) {
    response.end('{"Ошибка": "параметр не указан"}');
  } else {
    let id = +query.id;
    if (Number.isInteger(id)) {
      response.end(JSON.stringify(db.delete(id)));
    } else {
      response.end('{"Ошибка": "неверный формат id"}');
    }
  }
});

db.on("COMMIT", (request, response) => {
  console.log("DB - COMMIT");
  db.commit();
});

const server = http
  .createServer(function (request, response) {
    const parsedUrl = url.parse(request.url, true);
    if (parsedUrl.pathname === "/api/db") {
      if (request.method === "GET") {
        db.emit("GET", request, response);
      } else if (request.method === "POST") {
        db.emit("POST", request, response);
      } else if (request.method === "PUT") {
        db.emit("PUT", request, response);
      } else if (request.method === "DELETE") {
        db.emit("DELETE", request, response);
      } else if (request.method === "HEAD") {
        db.emit("COMMIT", request, response);
      } else {
        response.statusCode = 405;
        response.setHeader("Content-Type", "application/json");
        response.end('{"Ошибка": "Метод не поддерживается"}');
      }
    } else if (parsedUrl.pathname === "/api/ss" && request.method === "GET") {
      const stats = getStats();
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(stats));
    } else {
      response.statusCode = 404;
      response.setHeader("Content-Type", "application/json");
      response.end('{"Ошибка": "Маршрут не найден"}');
    }
  })
  .listen(5000);
console.log("Сервер начал прослушивание запросов на порту 5000");
//http://localhost:5000/api/db

process.stdin.setEncoding("utf8");
process.stdin.on("readable", () => {
  let command = null;
  while ((command = process.stdin.read()) != null) {
    if (command.trim().startsWith("sd")) {
      let sec = Number(command.trim().replace(/[^\d]/g, ""));
      if (sec) {
        console.log(`Сервер будет остановлен через ${sec} секунд`);
        clearTimeout(timerSd);
        timerSd = setTimeout(() => {
          closeServer(() => console.log("Сервер остановлен"));
        }, sec * 1000);
        timerSd.unref();
      }
      if (!sec && command.trim().length > 2) {
        console.error("ERROR: параметр не является целым числом");
      }
      if (command.trim().length === 2) {
        clearTimeout(timerSd);
        console.log("Остановка сервера отменена");
      }
    }

    if (command.trim().startsWith("sc")) {
      let sec = Number(command.trim().replace(/[^\d]/g, ""));
      if (sec) {
        clearInterval(timerSc);
        console.log(
          `Фиксация состояния БД будет выполняться каждые ${sec} секунд`
        );
        timerSc = setInterval(() => {
          db.emit("COMMIT");
        }, sec * 1000);
        timerSc.unref();
      }
      if (!sec && command.trim().length > 2) {
        console.error("ERROR: параметр не является целым числом");
      }
      if (command.trim().length === 2) {
        clearInterval(timerSc);
        console.log("Периодическая фиксация состояния БД отменена");
      }
    }
    if (command.trim().startsWith("ss")) {
      let sec = Number(command.trim().replace(/[^\d]/g, ""));
      if (sec) {
        clearTimeout(timerSs);
        requestCount = 0;
        commitCount = 0;
        startTime = new Date();
        collectingStats = true;
        console.log(`Сбор статистики запущен на ${sec} секунд`);
        timerSs = setTimeout(() => {
          endTime = new Date();
          collectingStats = false;
          const stats = getStats();
          process.stdout.write(JSON.stringify(stats));
          console.log();
        }, sec * 1000);
        timerSs.unref();
      }
      if (!sec && command.trim().length > 2) {
        console.error("ERROR: параметр не является целым числом");
      }
      if (command.trim().length === 2) {
        clearTimeout(timerSs);
        endTime = new Date();
        collectingStats = false;
        console.log("Сбор статистики отменен");
      }
    }
  }
});

let closeServer = (callback) => {
  if (timerSc) {
    clearInterval(timerSc);
  }
  console.log("Все подключения закрыты");
  server.close(callback);
  console.log("Сервер завершил работу");
};

function getStats() {
  return {
    start: startTime,
    end: endTime,
    requests: requestCount,
    commits: commitCount,
  };
}

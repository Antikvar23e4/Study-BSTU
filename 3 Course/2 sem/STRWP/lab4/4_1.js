const http = require("http");
const fs = require("fs");
const url = require("url");

var data = require("./db.js"); //импортим модуль
var db = new data.DB(); //создаем объект бд

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

http
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
      } else {
        response.statusCode = 405;
        response.setHeader("Content-Type", "application/json");
        response.end('{"Ошибка": "Метод не поддерживается"}');
      }
    } else {
      response.statusCode = 404;
      response.setHeader("Content-Type", "application/json");
      response.end('{"Ошибка": "Маршрут не найден"}');
    }
  })
  .listen(5000);
console.log("Сервер начал прослушивание запросов на порту 5000");
//http://localhost:5000/api/db

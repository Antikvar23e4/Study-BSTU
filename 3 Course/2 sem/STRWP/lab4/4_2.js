const http = require("http");
const fs = require("fs");
const url = require("url");

let data = require("./db.js");
let db = new data.DB();

db.on("GET", (request, response) => {
  console.log("GET called");
  response.end(JSON.stringify(db.select()));
});

db.on("POST", (request, response) => {
  console.log("POST called");
  request.on("data", (data) => {
    let row = JSON.parse(data);
    row.id = db.getIndex();
    response.end(JSON.stringify(db.insert(row)));
  });
});

db.on("PUT", (request, response) => {
  console.log("PUT called");
  request.on("data", (data) => {
    let row = JSON.parse(data);
    response.end(JSON.stringify(db.update(row)));
  });
});

db.on("DELETE", (request, response) => {
  console.log("DELETE called");
  if (url.parse(request.url, true).query.id === undefined) {
    response.end('{"ERROR": "parameter not provided"}');
  }
  if (url.parse(request.url, true).query.id !== null) {
    let id = +url.parse(request.url, true).query.id;
    if (Number.isInteger(id)) {
      response.end(JSON.stringify(db.delete(id)));
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
    } else if (parsedUrl.pathname === "/") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(
        fs.readFileSync("D:\\University\\2sem\\STRWP\\Labs\\lab4\\4_2.html")
      );
    } else {
      response.statusCode = 404;
      response.setHeader("Content-Type", "application/json");
      response.end('{"Ошибка": "Маршрут не найден"}');
    }
  })
  .listen(5000);
console.log("Сервер начал прослушивание запросов на порту 5000");
//http://localhost:5000/

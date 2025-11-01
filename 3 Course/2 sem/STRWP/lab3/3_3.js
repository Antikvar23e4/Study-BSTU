const http = require("http");
const url = require("url");
const fs = require("fs");

function factorial(n) {
  return n === 0 ? 1 : n * factorial(n - 1);
}

http
  .createServer((request, response) => {
    const parsedUrl = url.parse(request.url, true);

    if (parsedUrl.pathname === "/") {
      fs.readFile("./factorial.html", (err, data) => {
        if (err) {
          response.writeHead(500, { "Content-Type": "text/plain" });
          response.end("Ошибка загрузки страницы");
        } else {
          response.writeHead(200, { "Content-Type": "text/html" });
          response.end(data);
        }
      });
    } else if (parsedUrl.pathname === "/fact") {
      const k = parseInt(parsedUrl.query.k);
      if (!isNaN(k) && k >= 0) {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ k, fact: factorial(k) }));
      } else {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({ error: "Введите неотрицательное число (k)" })
        );
      }
    } else {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("Страница не найдена");
    }
  })
  .listen(4000);
console.log("Сервер работает на порту 5000");

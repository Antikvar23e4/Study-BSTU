const http = require("http");
const url = require("url");
const fs = require("fs");

function factorialAsync(n, callback, acc = 1) {
  if (n === 0 || n === 1) return callback(1);
  if (n === 2) return callback(acc * 2);

  setImmediate(() => {
    factorialAsync(n - 1, (result) => callback(result * n), acc);
  });
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
        factorialAsync(k, (fact) => {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ k, fact }));
        });
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

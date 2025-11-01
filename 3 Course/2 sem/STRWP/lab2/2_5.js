const http = require("http");
const fs = require("fs");

http
  .createServer((request, response) => {
    if (request.url === "/fetch") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(fs.readFileSync("./fetch.html"));
    } else if (request.url === "/api/name") {
      response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Немкович Анастасия Вадимовна");
    } else {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Страница не найдена");
    }
  })
  .listen(5000);
console.log("Сервер начал прослушивание запросов на порту 5000");

//http://localhost:5000/fetch

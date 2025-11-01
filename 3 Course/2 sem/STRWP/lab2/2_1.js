const http = require("http");
const fs = require("fs");

http
  .createServer((request, response) => {
    let html = fs.readFileSync("./index.html");
    if (request.url === "/html") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(html);
    } else {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Страница не найдена");
    }
  })
  .listen(3000);
console.log("Сервер начал прослушивание запросов на порту 3000");

///http://localhost:3000/html

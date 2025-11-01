const http = require("http");
const fs = require("fs");

http
  .createServer((request, response) => {
    const fname = "./img.png";
    let jpg = null;
    if (request.url === "/png") {
      jpg = fs.readFileSync(fname);
      response.writeHead(200, { "content-type": "image/jpeg" });
      response.end(jpg, "binary");
    } else {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Страница не найдена");
    }
  })
  .listen(3000);
console.log("Сервер начал прослушивание запросов на порту 3000");

///http://localhost:3000/png

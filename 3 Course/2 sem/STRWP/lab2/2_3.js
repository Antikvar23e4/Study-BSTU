const http = require("http");

http
  .createServer((request, response) => {
    if (request.url === "/api/name" && request.method === "GET") {
      response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Немкович Анастасия Вадимовна");
    } else {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Страница не найдена");
    }
  })
  .listen(5000);
console.log("Сервер начал прослушивание запросов на порту 5000");

//http://localhost:5000/api/name

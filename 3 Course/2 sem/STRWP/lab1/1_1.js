var http = require("http");

http
  .createServer(function (request, response) {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end("<h1>Hello World</h1>\n");
  })
  .listen(3000);
console.log("Сервер начал прослушивание запросов на порту 3000");

//http://localhost:3000/

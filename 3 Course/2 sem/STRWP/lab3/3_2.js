const http = require("http");
const url = require("url");

function factorial(n) {
  return n === 0 ? 1 : n * factorial(n - 1);
}

http
  .createServer((request, response) => {
    const query = url.parse(request.url, true).query;
    const k = parseInt(query.k);

    if (request.url.startsWith("/fact") && !isNaN(k) && k >= 0) {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ k, fact: factorial(k) }));
    } else {
      response.writeHead(400, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({ error: "Введите неотрицательное число (k)" })
      );
    }
  })
  .listen(4000);
console.log("Сервер работает на порту 5000");

//http://localhost:5000/fact?k=10

const http = require("http");
const readline = require("readline");

let state = "norm";

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(`<h1>Текущее состояние: ${state}</h1>`);
});

server.listen(5000);
console.log("Сервер работает на порту 5000");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: `Текущее состояние: ${state} > `,
});

rl.prompt();

rl.on("line", (input) => {
  input = input.trim();

  if (["norm", "stop", "test", "idle"].includes(input)) {
    state = input;
    console.log(`Состояние изменено: ${state}`);
  } else if (input === "exit") {
    console.log("Завершение работы...");
    rl.close();
    server.close();
    process.exit(0);
  } else {
    console.log(`"${input}" - неизвестное состояние`);
  }

  rl.setPrompt(`Текущее состояние: ${state} > `);
  rl.prompt();
});

const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

app.use(express.static(__dirname));

app.listen(port, () => {
  console.log(`Сервер Задания 02 запущен на http://localhost:${port}`);
  console.log(`Откройте в браузере: http://localhost:${port}/index_task2.html`);
  console.log(
    `WASM файл доступен по адресу: http://localhost:${port}/my_functions.wasm`
  );
});

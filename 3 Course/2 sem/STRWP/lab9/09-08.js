const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const SERVER_URL = "http://localhost:3000";
const TASK_ID = "Задание 08";

const printResult = (task, response, data) => {
  if (response) {
    console.log("Статус:", response.status, response.statusText);
    console.log("Content-Type:", response.headers["content-type"]);
    console.log(
      "Content-Disposition:",
      response.headers["content-disposition"]
    );
  }
  console.log("Результат:", data);
};

const printError = (task, error) => {
  if (error.response) {
    console.error("Статус:", error.response.status);
    console.error("Данные:", error.response.data);
  } else if (error.request) {
    console.error("Ответ не получен:", error.code);
  } else {
    console.error("Ошибка:", error.message);
  }
};

async function runTask08() {
  console.log(`Выполнение ${TASK_ID}...`);
  const savePath = path.join(__dirname, "file.txt");

  try {
    const response = await axios.get(`${SERVER_URL}/download`, {
      responseType: "stream",
    });

    const writer = fs.createWriteStream(savePath);
    // Передаём поток данных ответа в файл
    response.data.pipe(writer);
    // Ждём завершения записи
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", (err) => {
        console.error("Ошибка записи в файл:", err);
        reject(err);
      });
      response.data.on("error", (err) => {
        console.error("Ошибка загрузки потока:", err);
        reject(err);
      });
    });
    printResult(
      TASK_ID,
      response,
      `Файл успешно загружен и сохранён по пути: ${savePath}`
    );
  } catch (error) {
    if (!error.response || (error.response && error.response.status !== 200)) {
      printError(TASK_ID, error);
    } else {
      console.error("Ошибка при загрузке файла (stream):", error.message);
    }
    if (fs.existsSync(savePath)) {
      try {
        fs.unlinkSync(savePath);
        console.log("Удалён неполный файл.");
      } catch {}
    }
  }
}

runTask08();

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { URL } = require("url");

const SERVER_URL = "http://localhost:3000";
const TASK_ID = "Задание 06";

const printResult = (task, response, data) => {
  if (response) {
    console.log("Статус:", response.status, response.statusText);
  }
  console.log("Данные:", data);
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

async function runTask06() {
  console.log(`Выполнение ${TASK_ID}...`);
  const filePath = path.join(__dirname, "MyFile.txt");

  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(
        filePath,
        "Это содержимое файла MyFile.txt для Лабораторной №9, Задание 06."
      );
      console.log(`Создан тестовый файл: ${filePath}`);
    }

    const form = new FormData();
    form.append("myFile", fs.createReadStream(filePath));

    const response = await axios.post(`${SERVER_URL}/upload`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    printResult(TASK_ID, response, response.data);
  } catch (error) {
    printError(TASK_ID, error);
  }
}

runTask06();

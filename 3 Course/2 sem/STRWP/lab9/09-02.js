const axios = require("axios");
const { URL } = require("url");

const SERVER_URL = "http://localhost:3000";
const TASK_ID = "Задание 02";

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

async function runTask02() {
  console.log(`Выполнение ${TASK_ID}...`);
  try {
    const response = await axios.get(`${SERVER_URL}/task02`, {
      params: { x: 30, y: 15 },
    });
    printResult(TASK_ID, response, response.data);
  } catch (error) {
    printError(TASK_ID, error);
  }
}

runTask02();

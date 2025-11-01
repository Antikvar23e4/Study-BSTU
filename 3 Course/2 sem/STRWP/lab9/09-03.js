const axios = require("axios");
const { URLSearchParams } = require("url");
const { URL } = require("url");

const SERVER_URL = "http://localhost:3000";
const TASK_ID = "Задание 03";

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

async function runTask03() {
  console.log(`Выполнение ${TASK_ID}...`);
  try {
    const params = new URLSearchParams();
    params.append("x", "ParamX_123");
    params.append("y", "55");
    params.append("s", "Test string");

    const response = await axios.post(`${SERVER_URL}/task03`, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    printResult(TASK_ID, response, response.data);
  } catch (error) {
    printError(TASK_ID, error);
  }
}

runTask03();

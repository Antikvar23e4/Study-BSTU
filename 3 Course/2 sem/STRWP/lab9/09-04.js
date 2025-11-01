const axios = require("axios");
const { URL } = require("url");

const SERVER_URL = "http://localhost:3000";
const TASK_ID = "Задание 04";

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

async function runTask04() {
  console.log(`Выполнение ${TASK_ID}...`);
  try {
    const jsonData = {
      __comment: "Запрос клиента",
      x: 25,
      y: 5,
      s: "Строка запроса",
      m: ["node", "js", "axios", "xml"],
      o: { surname: "Немкович", name: "Анастасия" },
    };

    console.log("Отправка JSON:", JSON.stringify(jsonData, null, 2));
    const response = await axios.post(`${SERVER_URL}/task04`, jsonData);
    printResult(TASK_ID, response, response.data);
  } catch (error) {
    printError(TASK_ID, error);
  }
}

runTask04();

const axios = require("axios");
const { URL } = require("url");

const SERVER_URL = "http://localhost:3000";
const TASK_ID = "Задание 5";

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

async function runTask05() {
  console.log(`Выполнение ${TASK_ID}...`);
  try {
    const xmlData = `
<request id="ReqLab9Task5">
    <x value="100"/>
    <x value="200"/>
    <x value="-50"/>
    <m value="first"/>
    <m value="second"/>
    <m value="third"/>
    <m value="fourth"/>
</request>
        `;
    console.log("Отправка XML:", xmlData);
    const response = await axios.post(`${SERVER_URL}/task05`, xmlData, {
      headers: { "Content-Type": "application/xml" },
    });
    printResult(TASK_ID, response, response.data);
  } catch (error) {
    printError(TASK_ID, error);
  }
}
runTask05();

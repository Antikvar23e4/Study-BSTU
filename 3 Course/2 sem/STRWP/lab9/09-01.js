const axios = require("axios");

const SERVER_URL = "http://localhost:3000";
const TASK_ID = "Задание 01";

const printResult = (task, response, data) => {
  if (response) {
    console.log("Статус:", response.status, response.statusText);
    const urlInfo = new URL(response.config.url);
    console.log("Хост сервера:", urlInfo.hostname);
    console.log(
      "Порт сервера:",
      urlInfo.port || (urlInfo.protocol === "https:" ? "443" : "80")
    );
    const remoteAddress = response?.request?.socket?.remoteAddress;
    const remotePort = response?.request?.socket?.remotePort;
    console.log("Тело ответа:", response.data);
    console.log(
      `(Приблизительно) Удалённый адрес: ${remoteAddress || "Н/Д"}, Порт: ${
        remotePort || "Н/Д"
      }`
    );
  } else {
    console.log("Данные:", data);
  }
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

async function runTask01() {
  try {
    const response = await axios.get(`${SERVER_URL}/task01`);
    const printData = {
      message: "Смотрите подробности выше.",
    };
    printResult(TASK_ID, response, printData);
  } catch (error) {
    printError(TASK_ID, error);
  }
}

runTask01();

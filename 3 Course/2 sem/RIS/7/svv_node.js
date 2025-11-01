const dgram = require("dgram");
const fs = require("fs");
const {
  getFormattedTime,
  updateCoordinatorConfig,
  ipToNumber,
  sendUdpMessage,
  UDP_PORT,
  COORDINATOR_CONFIG_PATH,
} = require("./utils");

const CLUSTER_CONFIG_PATH = "./cluster_config.json";
const HEALTH_CHECK_INTERVAL_MS = 5000;
const RESPONSE_TIMEOUT_MS = 1500;
const FAILED_CHECK_THRESHOLD = 3;

let myIp = null;
let allNodeIps = [];
let higherNodeIps = [];
let isCoordinator = false;
let currentCoordinatorIp = null;
let healthCheckTimer = null;
let failedChecks = 0;
let electionInProgress = false;
let electionResponseTimeout = null;
let awaitingHealthResponse = false;
let healthResponseTimeout = null;

const socket = dgram.createSocket("udp4");

function log(message) {
  console.log(`[${myIp}] ${message}`);
}

function stopHealthCheck() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
  clearTimeout(healthResponseTimeout);
  awaitingHealthResponse = false;
}

//проверка работает ли координатор
function startHealthCheck() {
  stopHealthCheck();
  if (isCoordinator) return; //координатор сам себя не проверяет

  log(`Запуск проверки здоровья координатора ${currentCoordinatorIp}`);
  // если координатор не установлен
  healthCheckTimer = setInterval(() => {
    if (
      !currentCoordinatorIp ||
      isCoordinator ||
      electionInProgress ||
      awaitingHealthResponse
    ) {
      return;
    }

    log(`Проверка доступности ${currentCoordinatorIp}`);
    //ожидается ответ
    awaitingHealthResponse = true;
    sendUdpMessage("ARE_YOU_ALIVE?", currentCoordinatorIp, socket);

    clearTimeout(healthResponseTimeout);
    healthResponseTimeout = setTimeout(() => {
      //если ответа нет
      if (awaitingHealthResponse) {
        awaitingHealthResponse = false;
        failedChecks++;
        log(
          `Координатор ${currentCoordinatorIp} не ответил. Ошибки: ${failedChecks}/${FAILED_CHECK_THRESHOLD}`
        );
        if (failedChecks >= FAILED_CHECK_THRESHOLD) {
          log(
            `Координатор ${currentCoordinatorIp} предположительно недоступен. Начинаем выборы.`
          );
          startElection();
        }
      }
    }, RESPONSE_TIMEOUT_MS);
  }, HEALTH_CHECK_INTERVAL_MS);
}

//выбор координатора
function startElection() {
  if (electionInProgress) {
    log("Выборы уже запущены.");
    return;
  }

  log("Запуск процедуры выборов...");
  electionInProgress = true;
  isCoordinator = false;
  currentCoordinatorIp = null;
  stopHealthCheck();
  failedChecks = 0;

  //сортируем и проверяем айпишники, higherNodeIps в initialSetup
  if (higherNodeIps.length === 0) {
    log("Нет узлов с более высоким IP. Назначаю себя координатором.");
    becomeCoordinator();
  } else {
    //отправляем сообщение всем у кого айпишник больше
    log(`Отправка сообщений ELECTION узлам: ${higherNodeIps.join(", ")}`);
    higherNodeIps.forEach((nodeIp) => {
      sendUdpMessage("ELECTION", nodeIp, socket);
    });
    //ждем ответов
    clearTimeout(electionResponseTimeout);
    electionResponseTimeout = setTimeout(() => {
      if (electionInProgress) {
        log("Не получили ответов на выборы. Назначаю себя координатором.");
        becomeCoordinator();
      }
    }, RESPONSE_TIMEOUT_MS * 1.5);
  }
}

// сделать себя координатором
function becomeCoordinator() {
  log("Я стал новым координатором.");
  isCoordinator = true;
  electionInProgress = false;
  currentCoordinatorIp = myIp;
  //ф-я из utils перезапись файла конфигурации
  updateCoordinatorConfig(myIp);
  stopHealthCheck();
  failedChecks = 0;
  //отправляем остальным сообщение что мол я координатор
  const otherNodes = allNodeIps.filter((ip) => ip !== myIp);
  log(
    `Уведомление других узлов: ${otherNodes.join(", ") || "нет других узлов"}`
  );
  otherNodes.forEach((nodeIp) => {
    sendUdpMessage(`COORDINATOR ${myIp}`, nodeIp, socket);
  });
  clearTimeout(electionResponseTimeout);
}

//обработка входящих сообщений
socket.on("message", (msg, rinfo) => {
  const message = msg.toString();
  const senderIp = rinfo.address;
  //т.к в функции определения мы отправлем такое сообщение то нужно и обрабатывать его
  if (message.startsWith("COORDINATOR ")) {
    const newCoordinatorIp = message.split(" ")[1];
    //если новый координатор отличается от текущего
    if (newCoordinatorIp !== currentCoordinatorIp) {
      log(`Объявлен новый координатор: ${newCoordinatorIp}`);
      currentCoordinatorIp = newCoordinatorIp;
      isCoordinator = currentCoordinatorIp === myIp;
      electionInProgress = false;
      clearTimeout(electionResponseTimeout);
      failedChecks = 0;
      awaitingHealthResponse = false;
      clearTimeout(healthResponseTimeout);
      if (!isCoordinator) {
        startHealthCheck();
      } else {
        log("Я — новый координатор.");
        stopHealthCheck();
        //ф-я из utils перезапись файла конфигурации
        updateCoordinatorConfig(myIp);
      }
    }
    //если сервер отвечает что жив то очищаем тайм аут ну и счетчик неудач
  } else if (senderIp === currentCoordinatorIp && message === "I_AM_ALIVE") {
    failedChecks = 0;
    awaitingHealthResponse = false;
    clearTimeout(healthResponseTimeout);
  } else {
    switch (message) {
      case "GET_TIME":
        if (isCoordinator) {
          const time = getFormattedTime();
          log(`Ответ на запрос времени от ${senderIp}:${rinfo.port}`);
          sendUdpMessage(time, senderIp, socket);
        } else {
          log("Игнорирую GET_TIME, я не координатор.");
        }
        break;
      case "ARE_YOU_ALIVE?":
        log(`Получен запрос на здоровье от ${senderIp}. Отправляю I_AM_ALIVE.`);
        sendUdpMessage("I_AM_ALIVE", senderIp, socket);
        break;
      case "ELECTION":
        log(`Получено сообщение ELECTION от ${senderIp}. Отправляю OK.`);
        sendUdpMessage("OK", senderIp, socket);
        if (!electionInProgress) {
          log(`Запускаю выборы в ответ на сообщение от ${senderIp}.`);
          startElection();
        }
        break;
      case "OK":
        log(`Получено OK от ${senderIp}. Жду нового координатора.`);
        electionInProgress = false;
        clearTimeout(electionResponseTimeout);
        currentCoordinatorIp = null;
        stopHealthCheck();
        failedChecks = 0;
        awaitingHealthResponse = false;
        clearTimeout(healthResponseTimeout);
        break;
      default:
        log(`Получено неизвестное сообщение: "${message}" от ${senderIp}`);
    }
  }
});

socket.on("listening", () => {
  const address = socket.address();
  log(`UDP-сервер запущен на ${address.address}:${address.port}`);
  initialSetup();
});

socket.on("error", (err) => {
  log(`Ошибка сервера UDP:\n${err.stack}`);
  socket.close();
  process.exit(1);
});

function initialSetup() {
  try {
    //чтение файла конфига
    const configData = fs.readFileSync(CLUSTER_CONFIG_PATH);
    const config = JSON.parse(configData);
    //сортируем по возрастанию айпи
    allNodeIps = config.nodes.sort((a, b) => ipToNumber(a) - ipToNumber(b));
    log(`Загружены IP-адреса кластера: ${allNodeIps.join(", ")}`);
  } catch (err) {
    log(`ОШИБКА: не удалось прочитать конфиг: ${err}`);
    process.exit(1);
  }

  if (!allNodeIps.includes(myIp)) {
    log(`ОШИБКА: мой IP (${myIp}) не найден в конфиге!`);
    process.exit(1);
  }

  //делаем список из айпишников которые больше текущего
  higherNodeIps = allNodeIps.filter((ip) => ipToNumber(ip) > ipToNumber(myIp));
  const highestIp = allNodeIps[allNodeIps.length - 1];
  log(
    `Мой IP: ${myIp}, более высокие узлы: ${higherNodeIps.join(", ") || "нет"}`
  );
  if (myIp === highestIp) {
    log("У меня самый высокий IP. Становлюсь координатором.");
    becomeCoordinator();
  } else {
    log(`Начальный координатор — ${highestIp}.`);
    currentCoordinatorIp = highestIp;
    isCoordinator = false;
    startHealthCheck();
  }
}

if (process.argv.length < 3) {
  console.error("Использование: node svv_node.js <ваш_IP_адрес>");
  process.exit(1);
}
myIp = process.argv[2];
socket.bind(UDP_PORT, myIp);

process.on("SIGINT", () => {
  log("Завершение работы...");
  stopHealthCheck();
  clearTimeout(electionResponseTimeout);
  clearTimeout(healthResponseTimeout);
  socket.close(() => {
    log("Сокет закрыт.");
    process.exit(0);
  });
});

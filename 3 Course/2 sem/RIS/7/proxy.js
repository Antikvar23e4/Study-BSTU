const dgram = require("dgram");
const fs = require("fs");

const {
  readCoordinatorConfig,
  UDP_PORT,
  COORDINATOR_CONFIG_PATH,
  sendUdpMessage,
} = require("./utils");

let myIp = null;
let currentCoordinatorIp = null;
const socket = dgram.createSocket("udp4");

// Хранилище запросов от клиентов (ключ — ip:порт клиента)
const pendingClientRequests = new Map();

function log(message) {
  console.log(`[Proxy ${myIp}] ${message}`);
}

//проверка кто координатор каждые 3 сек
function checkCoordinatorConfig() {
  const coordinatorIpFromConfig = readCoordinatorConfig();
  if (
    coordinatorIpFromConfig &&
    coordinatorIpFromConfig !== currentCoordinatorIp
  ) {
    log(`Обнаружен новый координатор в конфиге: ${coordinatorIpFromConfig}`);
    //устнавливаем того что в конфиге
    currentCoordinatorIp = coordinatorIpFromConfig;
  } else if (!coordinatorIpFromConfig && currentCoordinatorIp) {
    log(`IP координатора удалён из конфигурации.`);
    currentCoordinatorIp = null;
  }
  setTimeout(checkCoordinatorConfig, 3000);
}

// обработка входящих сообщений
socket.on("message", (msg, rinfo) => {
  const message = msg.toString();
  const sourceIp = rinfo.address;
  const sourcePort = rinfo.port;

  //если у клиента и прокси один айпи,
  // поэтому чтобы не было ошибок делаем игнорирование сообщений от самих себя
  const myAddress = socket.address();
  if (sourceIp === myAddress.address && sourcePort === myAddress.port) {
    return;
  }
  console.log(
    `[DEBUG] Получено сообщение: "${message}" от ${sourceIp}:${sourcePort}`
  );

  //если сообщение от координатора
  const clientKey = `${sourceIp}:${sourcePort}`;
  if (currentCoordinatorIp && sourceIp === currentCoordinatorIp) {
    log(
      `Ответ от координатора: "${message.substring(0, 30)}${
        message.length > 30 ? "..." : ""
      }"`
    );
    //пересылаем ответ клиенту
    const clientInfo = pendingClientRequests.get("client_request");
    if (clientInfo) {
      log(`Пересылаем ответ клиенту ${clientInfo.ip}:${clientInfo.port}`);
      sendUdpMessage(message, clientInfo.ip, socket, clientInfo.port);
      // удаляем запрос из очереди,
      pendingClientRequests.delete("client_request");
    } else {
      log(`ВНИМАНИЕ: Получен ответ от координатора, но клиент не найден.`);
    }

    //если сообщение от клиента
  } else {
    log(`Получен запрос "${message}" от клиента ${clientKey}`);
    if (currentCoordinatorIp) {
      log(`Пересылаем запрос координатору ${currentCoordinatorIp}`);
      pendingClientRequests.set("client_request", {
        ip: sourceIp,
        port: sourcePort,
      });
      // отправляем запрос координатору и ждем ответа
      sendUdpMessage(message, currentCoordinatorIp, socket);
      setTimeout(() => {
        if (pendingClientRequests.has("client_request")) {
          const clientInfo = pendingClientRequests.get("client_request");
          if (clientInfo.ip === sourceIp && clientInfo.port === sourcePort) {
            log(`Координатор не ответил ${clientKey} вовремя.`);
            pendingClientRequests.delete("client_request");
          }
        }
      }, 3000);
    } else {
      log("Координатор не найден. Невозможно переслать запрос.");
      sendUdpMessage(
        "ERROR: Координатор недоступен",
        sourceIp,
        socket,
        sourcePort
      );
    }
  }
});

socket.on("listening", () => {
  const address = socket.address();
  log(`Прокси запущен на ${address.address}:${address.port}`);
  checkCoordinatorConfig();
});

socket.on("error", (err) => {
  log(`Ошибка UDP-сервера:\n${err.stack}`);
  socket.close();
  process.exit(1);
});

if (process.argv.length < 3) {
  console.error("Использование: node proxy.js <ваш_ip_адрес>");
  process.exit(1);
}

myIp = process.argv[2];
socket.bind(UDP_PORT, myIp); //привязка сокета

process.on("SIGINT", () => {
  log("Завершение работы прокси...");
  socket.close(() => {
    log("Сокет прокси закрыт.");
    process.exit(0);
  });
});

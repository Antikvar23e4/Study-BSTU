const fs = require("fs");
const dgram = require("dgram");

const COORDINATOR_CONFIG_PATH = "./coordinator_config.json";
const UDP_PORT = 5555;

//для формата времени
function getFormattedTime() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${day}${month}${year}:${hours}:${minutes}:${seconds}`;
}

// оьновляет айпи координатора в файле
function updateCoordinatorConfig(newCoordinatorIp) {
  try {
    const config = { coordinatorIp: newCoordinatorIp };
    fs.writeFileSync(COORDINATOR_CONFIG_PATH, JSON.stringify(config, null, 2)); // Запись файла JSON
  } catch (err) {
    console.error(`Ошибка при записи конфигурации координатора: ${err}`);
  }
}

function readCoordinatorConfig() {
  try {
    if (fs.existsSync(COORDINATOR_CONFIG_PATH)) {
      const data = fs.readFileSync(COORDINATOR_CONFIG_PATH);
      const config = JSON.parse(data);
      return config.coordinatorIp; // из файла мы получаем айпи координатора
    }
  } catch (err) {
    console.error(`Ошибка при чтении конфигурации координатора: ${err}`);
  }
  return null;
}

//преобразование IP-адрес в число для сравнения
function ipToNumber(ip) {
  return ip
    .split(".")
    .reduce((res, octet) => (res << 8) | parseInt(octet, 10), 0);
}

//для отправки сообщений
function sendUdpMessage(
  message,
  targetIp,
  sourceSocket,
  targetPort = UDP_PORT
) {
  const buffer = Buffer.from(message);
  sourceSocket.send(buffer, 0, buffer.length, targetPort, targetIp, (err) => {
    if (err) {
      console.error(
        `Ошибка при отправке UDP-сообщения на ${targetIp}:${targetPort}: ${err}`
      );
    }
  });
}

module.exports = {
  getFormattedTime,
  updateCoordinatorConfig,
  readCoordinatorConfig,
  ipToNumber,
  sendUdpMessage,
  UDP_PORT,
  COORDINATOR_CONFIG_PATH,
};

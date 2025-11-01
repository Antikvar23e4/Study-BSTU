const dgram = require("dgram");
const { UDP_PORT } = require("./utils");

if (process.argv.length < 3) {
  console.error("Использование: node client.js <proxy_ip> [client_bind_ip]");
  process.exit(1);
}

const proxyIp = process.argv[2];
const clientBindIp = process.argv[3] || undefined;

const client = dgram.createSocket("udp4");

client.bind({ address: clientBindIp }, () => {
  const bindInfo = client.address();
  console.log(`[Client] Сокет привязан к ${bindInfo.address}:${bindInfo.port}`);

  const MESSAGE = "GET_TIME";
  const buffer = Buffer.from(MESSAGE);
  console.log(
    `[Client] Отправка "${MESSAGE}" на прокси ${proxyIp}:${UDP_PORT}`
  );
  //отправляем запрос на прокси
  client.send(buffer, UDP_PORT, proxyIp, (err) => {
    if (err) {
      console.error(`[Client] Не удалось отправить сообщение: ${err}`);
      client.close();
    }
  });

  setTimeout(() => {
    try {
      client.address();
      console.log("[Client] Таймаут: Ответ не получен.");
      client.close();
    } catch (e) {}
  }, 10000);
});

client.on("message", (msg, rinfo) => {
  console.log(
    `[Client] Получено от ${rinfo.address}:${rinfo.port}: ${msg.toString()}`
  );
  client.close();
});

client.on("error", (err) => {
  console.error(`[Client] Ошибка: ${err.stack}`);
  client.close();
  process.exit(1);
});

client.on("close", () => {
  console.log("[Client] Сокет закрыт.");
});

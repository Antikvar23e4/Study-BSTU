const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");
const { formidable } = require("formidable");
const xml2js = require("xml2js");

const { STATUS_CODES } = http;
const PORT = 3000;
const UPLOAD_DIR = path.join(__dirname, "upload");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
  console.log(`Создана папка: ${UPLOAD_DIR}`);
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  const method = req.method;

  console.log(`[${new Date().toISOString()}] Запрос: ${method} ${req.url}`);

  const sendJson = (statusCode, data) => {
    res.writeHead(statusCode, {
      "Content-Type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify(data));
  };

  const sendText = (statusCode, text) => {
    res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(text);
  };

  const sendXml = (statusCode, xmlString) => {
    res.writeHead(statusCode, {
      "Content-Type": "application/xml; charset=utf-8",
    });
    res.end(xmlString);
  };
  //1 задание
  if (pathname === "/task01" && method === "GET") {
    console.log("Task 01");
    sendText(200, "Ответ сервера для 1го задания.");
  }

  //2 задание
  else if (pathname === "/task02" && method === "GET") {
    console.log("Task 02");
    const x = parseInt(query.x, 10);
    const y = parseInt(query.y, 10);
    if (isNaN(x) || isNaN(y)) {
      return sendJson(400, { error: "Параметры должны быть числами." });
    }
    const sum = x + y;
    sendJson(200, { message: `Sum of ${x} and ${y} is ${sum}`, sum: sum });
  }
  //3 задание
  else if (pathname === "/task03" && method === "POST") {
    console.log("Task 03");
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (
        req.headers["content-type"]?.includes(
          "application/x-www-form-urlencoded"
        )
      ) {
        try {
          const formData = querystring.parse(body);
          const { x, y, s } = formData;
          if (x === undefined || y === undefined || s === undefined) {
            return sendText(400, "Ошибка: отсутствуют параметры x, y или s.");
          }

          sendText(200, `Задание 03 получено: x=${x}, y=${y}, s='${s}'`);
        } catch (e) {
          console.error("Задание 03 — ошибка при разборе формы:", e);
          sendText(400, "Ошибка при разборе данных формы.");
        }
      } else {
        sendText(
          415,
          `Неподдерживаемый тип данных. Ожидался application/x-www-form-urlencoded.`
        );
      }
    });

    req.on("error", (err) => {
      console.error("Задание 03 — ошибка чтения запроса:", err);
      if (!res.headersSent) sendText(500, "Ошибка сервера при чтении запроса.");
    });
  }

  //4 задание
  else if (pathname === "/task04" && method === "POST") {
    console.log("Task 04");
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      if (req.headers["content-type"]?.includes("application/json")) {
        try {
          const reqJson = JSON.parse(body);
          console.log("Task 04 полученный JSON:", JSON.stringify(reqJson));

          if (
            typeof reqJson !== "object" ||
            reqJson === null ||
            typeof reqJson.x !== "number" ||
            typeof reqJson.y !== "number" ||
            typeof reqJson.s !== "string" ||
            !Array.isArray(reqJson.m) ||
            typeof reqJson.o !== "object" ||
            reqJson.o === null ||
            typeof reqJson.o.surname !== "string" ||
            typeof reqJson.o.name !== "string"
          ) {
            throw new Error("Недопустимая структура JSON.");
          }

          const sumResult = reqJson.x + reqJson.y;
          const concatResult = `${reqJson.s}: ${reqJson.o.surname}, ${reqJson.o.name}`;
          const lengthResult = reqJson.m.length;

          const resJson = {
            __comment: "Ответ. Лабораторная работа 8/10",
            x_plus_y: sumResult,
            Concatination_s_o: concatResult,
            Length_m: lengthResult,
          };

          sendJson(200, resJson);
        } catch (e) {
          console.error("Task 04 JSON Error:", e);
          sendJson(400, {
            error: "Недопустимая структура JSON.",
            details: e.message,
          });
        }
      } else {
        sendText(
          415,
          `Неподдерживаемый формат данных. Ожидается application/json.`
        );
      }
    });
    req.on("error", (err) => {
      console.error("Task 04 Read Error:", err);
      if (!res.headersSent) sendJson(500, { error: "Ошибка при чтении." });
    });
  }

  //5 задание
  else if (pathname === "/task05" && method === "POST") {
    console.log("Task 05");

    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      if (
        req.headers["content-type"]?.includes("application/xml") ||
        req.headers["content-type"]?.includes("text/xml")
      ) {
        xml2js.parseString(body, { explicitArray: true }, (err, result) => {
          if (err) {
            console.error("Задание 05 — ошибка при разборе XML:", err);
            return sendXml(
              400,
              "<error><message>Неверный формат XML</message></error>"
            );
          }

          try {
            console.log(
              "Задание 05 — разобранный XML:",
              JSON.stringify(result, null, 2)
            );

            if (
              !result ||
              !result.request ||
              !result.request.$ ||
              !result.request.$.id ||
              !Array.isArray(result.request.x) ||
              !Array.isArray(result.request.m)
            ) {
              throw new Error("Неверная структура XML.");
            }

            const requestId = result.request.$.id;
            const xElements = result.request.x;
            const mElements = result.request.m;

            let sumResult = 0;
            xElements.forEach((elem) => {
              if (elem && elem.$ && elem.$.value !== undefined) {
                const numValue = parseFloat(elem.$.value);
                if (!isNaN(numValue)) {
                  sumResult += numValue;
                } else {
                  console.warn(
                    `Задание 05: Неверное числовое значение в элементе x: ${elem.$.value}`
                  );
                }
              }
            });

            let concatResult = "";
            mElements.forEach((elem) => {
              if (elem && elem.$ && typeof elem.$.value === "string") {
                concatResult += elem.$.value;
              }
            });

            const builder = new xml2js.Builder();
            const resObj = {
              response: {
                $: { id: "33", request: requestId },
                sum: { $: { element: "x", result: String(sumResult) } },
                concat: { $: { element: "m", result: concatResult } },
              },
            };
            const resXml = builder.buildObject(resObj);
            sendXml(200, resXml);
          } catch (e) {
            console.error("Задание 05 — ошибка обработки XML:", e);
            sendXml(
              400,
              `<error><message>Ошибка обработки XML: ${e.message.replace(
                /</g,
                "<"
              )}</message></error>`
            );
          }
        });
      } else {
        sendText(
          415,
          "Неподдерживаемый тип данных. Ожидался application/xml или text/xml."
        );
      }
    });

    req.on("error", (err) => {
      console.error("Задание 05 — ошибка при чтении запроса:", err);
      if (!res.headersSent)
        sendXml(
          500,
          "<error><message>Ошибка сервера при чтении запроса</message></error>"
        );
    });
  }

  //6 и 7
  else if (pathname === "/upload" && method === "POST") {
    console.log("Task 06/07");
    // Создаем экземпляр formidable
    const form = formidable({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
      multiples: false,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Ошибка загрузки:", err);
        let statusCode = err.httpCode || 500;
        let message = "Ошибка сервера во время загрузки.";
        if (err.code === 1009 || err.message.includes("maxFileSize")) {
          statusCode = 413;
          message = `Файл слишком большой. Limit: ${
            form.options.maxFileSize / 1024 / 1024
          } MB.`;
        }
        return sendText(statusCode, message);
      }

      const uploadedFile = files.myFile;
      if (!uploadedFile || uploadedFile.length === 0) {
        return sendText(400, 'Файл не загружен или пустой - "myFile".');
      }
      const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

      console.log(
        `Файл загружен: ${file.originalFilename} -> ${file.newFilename}, Size: ${file.size}`
      );
      sendText(
        200,
        `File '${file.originalFilename}' успешно загружен ${file.newFilename}`
      );
    });
  }

  //8 задание
  else if (pathname === "/download" && method === "GET") {
    console.log("Task 08");
    const filePath = path.join(__dirname, "downloadable_content.txt");
    const fileName = path.basename(filePath);

    if (!fs.existsSync(filePath)) {
      try {
        fs.writeFileSync(
          filePath,
          "This is the content to be downloaded for Lab 9 Task 08."
        );
        console.log(`Создан файл для скачивания: ${filePath}`);
      } catch (writeErr) {
        console.error("Ошибка при создании файла для скачивания:", writeErr);
        return sendText(
          500,
          "Ошибка сервера при подготовке файла для скачивания."
        );
      }
    }

    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (err) {
        console.error(
          `Файл для скачивания не найден/не доступен для чтения: ${filePath}`
        );
        return sendText(404, "Файл для скачивания не найден.");
      }
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
      readStream.on("error", (streamErr) => {
        console.error(`Ошибка при передаче файла для скачивания:`, streamErr);
        if (!res.writableEnded) res.end();
      });
    });
  } else {
    console.log(`Not Found: ${method} ${req.url}`);
    sendText(404, `404 Not Found: ${method} ${req.url}`);
  }
});

server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Error: Port ${PORT} is already in use.`);
  } else {
    console.error("Server Error:", err);
  }
  process.exit(1);
});

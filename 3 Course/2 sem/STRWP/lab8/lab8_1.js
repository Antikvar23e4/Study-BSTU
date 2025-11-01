// 08-00.js
const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const querystring = require("querystring");
const { formidable } = require("formidable");
const xml2js = require("xml2js");

const { STATUS_CODES } = http;
const PORT = 3000;
const STATIC_DIR = path.join(__dirname, "static");

let server;

server = http
  .createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;
    const method = req.method;

    console.log(`Запрос: ${method} ${req.url}`);

    // Задание 01
    //http://localhost:3000/connection
    //http://localhost:3000/connection?set=1000

    if (pathname === "/connection") {
      if (query.set !== undefined) {
        // Устанавливаем KeepAliveTimeout
        const newTimeout = parseInt(query.set);
        if (!isNaN(newTimeout) && newTimeout >= 0) {
          server.keepAliveTimeout = newTimeout;
          res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(
            `Установлено новое значение параметра KeepAliveTimeout = ${server.keepAliveTimeout}`
          );
          console.log(
            `KeepAliveTimeout установлен в ${server.keepAliveTimeout}`
          );
        } else {
          res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
          res.end('Ошибка: значение "set" должно быть неотрицательным числом.');
        }
      } else {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(
          `Текущее значение KeepAliveTimeout = ${server.keepAliveTimeout}`
        );
      }
    }

    // Задание 02
    //http://localhost:3000/headers
    else if (pathname === "/headers" && method === "GET") {
      res.setHeader("CustomHeader", "Value for header");

      let responseBody = "<h1>Заголовки</h1>";
      responseBody += "<h2>Заголовки Запроса (Request Headers):</h2><pre>";
      for (const [key, value] of Object.entries(req.headers)) {
        responseBody += `${key}: ${value}\n`;
      }
      responseBody += "</pre>";

      responseBody += "<h2>Заголовки Ответа (Response Headers):</h2><pre>";
      const responseHeaders = res.getHeaders();
      for (const [key, value] of Object.entries(responseHeaders)) {
        responseBody += `${key}: ${value}\n`;
      }
      responseBody += "</pre>";

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); // Устанавливаем Content-Type для HTML
      res.end(responseBody);
    }

    // Задание 03
    //http://localhost:3000/parameter?x=x&y=y
    //http://localhost:3000/parameter?x=1&y=4
    else if (
      pathname === "/parameter" &&
      method === "GET" &&
      query.x !== undefined &&
      query.y !== undefined
    ) {
      const x = parseFloat(query.x);
      const y = parseFloat(query.y);

      if (!isNaN(x) && !isNaN(y)) {
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(
          `Параметры: x = ${x}, y = ${y}\n` +
            `Сумма (x + y): ${x + y}\n` +
            `Разность (x - y): ${x - y}\n` +
            `Произведение (x * y): ${x * y}\n` +
            `Частное (x / y): ${y !== 0 ? x / y : "Деление на ноль!"}`
        );
      } else {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(
          `Ошибка: Один или оба параметра не являются числами (x=${query.x}, y=${query.y}).`
        );
      }
    }

    // Задание 04
    //http://localhost:3000/parameter/x/y
    //http://localhost:3000/parameter/1/4
    else if (pathname.startsWith("/parameter/") && method === "GET") {
      const params = pathname.split("/");
      if (params.length === 4 && params[2] && params[3]) {
        const xStr = params[2];
        const yStr = params[3];
        const x = parseFloat(xStr);
        const y = parseFloat(yStr);

        if (!isNaN(x) && !isNaN(y)) {
          res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(
            `Параметры из URI: x = ${x}, y = ${y}\n` +
              `Сумма (x + y): ${x + y}\n` +
              `Разность (x - y): ${x - y}\n` +
              `Произведение (x * y): ${x * y}\n` +
              `Частное (x / y): ${y !== 0 ? x / y : "Деление на ноль!"}`
          );
        } else {
          res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(
            `Ошибка: Параметры в URI не являются числами. Запрошенный URI: ${req.url}`
          );
        }
      } else {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(
          `Неверный формат URI. Ожидается /parameter/число1/число2. Получено: ${req.url}`
        );
      }
    }

    // Задание 05
    //http://localhost:3000/close
    else if (pathname === "/close" && method === "GET") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Сервер будет остановлен через 10 секунд.");
      console.log("Получен запрос /close. Сервер остановится через 10 секунд.");
      setTimeout(() => {
        server.close((err) => {
          if (err) {
            console.error("Ошибка при закрытии сервера:", err);
            process.exit(1);
          } else {
            console.log("Сервер успешно остановлен.");
            process.exit(0);
          }
        });
      }, 10000);
    }

    // Задание 06
    //http://localhost:3000/socket
    else if (pathname === "/socket" && method === "GET") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(
        `Информация о соединении:\n` +
          `IP-адрес клиента: ${req.socket.remoteAddress}\n` +
          `Порт клиента: ${req.socket.remotePort}\n` +
          `IP-адрес сервера: ${req.socket.localAddress}\n` +
          `Порт сервера: ${req.socket.localPort}\n`
      );
    }
    // Задание 07
    //http://localhost:3000/req-data
    //postman
    else if (pathname === "/req-data") {
      let receivedData = "";
      let chunkCount = 0;
      console.log(`\n[${method} /req-data] Ожидание данных...`);

      req.on("data", (chunk) => {
        chunkCount++;
        receivedData += chunk;
        console.log(` -> Получен чанк #${chunkCount} (${chunk.length} байт)`);
      });

      req.on("end", () => {
        const totalSize = Buffer.byteLength(receivedData);
        console.log(
          ` -> Конец данных. Всего чанков: ${chunkCount}, Общий размер: ${totalSize} байт.`
        );
        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(
          `Сервер получил ${chunkCount} чанк(ов) общим размером ${totalSize} байт методом ${method}.`
        );
      });

      req.on("error", (err) => {
        console.error("[req-data] Ошибка чтения запроса:", err);
        if (!res.headersSent) {
          res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Ошибка сервера при чтении запроса.");
        }
      });
    }
    // Задание 08
    //http://localhost:3000/resp-status
    //http://localhost:3000/resp-status?code=200?mess=OK
    else if (pathname === "/resp-status" && method === "GET") {
      const statusCode = parseInt(query.code);
      const statusMessageInput = query.mess;

      if (!isNaN(statusCode) && statusCode >= 100 && statusCode < 600) {
        const finalStatusMessage = statusMessageInput
          ? statusMessageInput
          : STATUS_CODES[statusCode] || "Неизвестный статус";

        res.writeHead(statusCode, finalStatusMessage, {
          "Content-Type": "text/plain; charset=utf-8",
        });
        res.end(`Ответ со статусом ${statusCode} (${finalStatusMessage}).`);
      } else {
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(
          'Ошибка: Параметр "code" не указан, не является числом или находится вне допустимого диапазона (100-599).'
        );
      }
    }

    // Задание 09
    //http://localhost:3000/formparameter
    else if (pathname === "/formparameter") {
      if (method === "GET") {
        const filePath = path.join(__dirname, "form.html");
        fs.readFile(filePath, "utf8", (err, data) => {
          if (err) {
            console.error("Ошибка чтения HTML файла:", err);
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Ошибка сервера при загрузке формы.");
          } else {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(data);
          }
        });
      } else if (method === "POST") {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          console.log("Получено тело формы (raw):", body);
          const contentType = req.headers["content-type"];
          if (
            contentType &&
            contentType.includes("application/x-www-form-urlencoded")
          ) {
            try {
              const formData = querystring.parse(body);
              res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.write("<h1>Полученные параметры формы:</h1>");
              res.write("<pre>");
              res.write(JSON.stringify(formData, null, 2));
              res.write("</pre>");
              res.end();
            } catch (e) {
              console.error("Ошибка парсинга данных формы:", e);
              res.writeHead(400, {
                "Content-Type": "text/plain; charset=utf-8",
              });
              res.end("Ошибка разбора данных формы.");
            }
          }
        });
        req.on("error", (err) => {
          console.error("Ошибка при чтении POST /formparameter:", err);
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Ошибка сервера при чтении запроса формы.");
          }
        });
      } else {
        res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`Метод ${method} не поддерживается для /formparameter.`);
      }
    }
    // Задание 10
    //постман
    else if (pathname === "/json" && method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        console.log("Получено тело JSON (raw):", body);
        const contentType = req.headers["content-type"];
        if (contentType && contentType.includes("application/json")) {
          try {
            const requestJson = JSON.parse(body);
            console.log("Распарсенный JSON запроса:", requestJson);
            if (
              typeof requestJson !== "object" ||
              requestJson === null ||
              typeof requestJson.x !== "number" ||
              typeof requestJson.y !== "number" ||
              typeof requestJson.s !== "string" ||
              !Array.isArray(requestJson.m) ||
              typeof requestJson.o !== "object" ||
              requestJson.o === null ||
              typeof requestJson.o.surname !== "string" ||
              typeof requestJson.o.name !== "string"
            ) {
              throw new Error("Неверная структура JSON запроса.");
            }

            const responseJson = {
              __comment: "Ответ. Лабораторная работа 8/10",
              x_plus_y: requestJson.x + requestJson.y,
              Concatination_s_o: `${requestJson.s}: ${requestJson.o.surname}, ${requestJson.o.name}`,
              Length_m: requestJson.m.length,
            };

            res.writeHead(200, {
              "Content-Type": "application/json; charset=utf-8",
            });
            res.end(JSON.stringify(responseJson));
          } catch (e) {
            console.error("Ошибка обработки JSON запроса:", e);
            res.writeHead(400, {
              "Content-Type": "application/json; charset=utf-8",
            });
            res.end(
              JSON.stringify({
                error: "Ошибка разбора JSON или неверная структура.",
                message: e.message,
              })
            );
          }
        } else {
          res.writeHead(415, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(
            `Неподдерживаемый тип контента: ${contentType}. Ожидается application/json.`
          );
        }
      });
      req.on("error", (err) => {
        console.error("Ошибка при чтении POST /json:", err);
        if (!res.headersSent) {
          res.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(
            JSON.stringify({ error: "Ошибка сервера при чтении JSON запроса." })
          );
        }
      });
    }

    // Задание 11
    //постман
    else if (pathname === "/xml" && method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        console.log("Получено тело XML (raw):", body);
        const contentType = req.headers["content-type"];
        if (
          contentType &&
          (contentType.includes("application/xml") ||
            contentType.includes("text/xml"))
        ) {
          xml2js.parseString(body, { explicitArray: true }, (err, result) => {
            if (err) {
              console.error("Ошибка парсинга XML:", err);
              res.writeHead(400, {
                "Content-Type": "application/xml; charset=utf-8",
              });
              res.end("<error><message>Ошибка разбора XML</message></error>");
              return;
            }
            try {
              console.log("Распарсенный XML:", JSON.stringify(result, null, 2));
              if (
                !result ||
                !result.request ||
                !result.request.$ ||
                !result.request.$.id
              ) {
                throw new Error(
                  "Неверная структура XML: отсутствует <request> с атрибутом id."
                );
              }
              const requestId = result.request.$.id;
              const elementsX = result.request.x;
              const elementsM = result.request.m;

              let sum = 0;
              if (Array.isArray(elementsX)) {
                elementsX.forEach((elem) => {
                  if (
                    elem &&
                    elem.$ &&
                    elem.$.value &&
                    !isNaN(Number(elem.$.value))
                  ) {
                    sum += Number(elem.$.value);
                  } else {
                    console.warn(
                      "Найден некорректный элемент 'x' или его атрибут 'value':",
                      elem
                    );
                  }
                });
              }

              let concat = "";
              if (Array.isArray(elementsM)) {
                elementsM.forEach((elem) => {
                  if (elem && elem.$ && typeof elem.$.value === "string") {
                    concat += elem.$.value;
                  } else {
                    console.warn(
                      "Найден некорректный элемент 'm' или его атрибут 'value':",
                      elem
                    );
                  }
                });
              }
              const builder = new xml2js.Builder();
              const responseObj = {
                response: {
                  $: { id: "33", request: requestId },
                  sum: { $: { element: "x", result: String(sum) } },
                  concat: { $: { element: "m", result: concat } },
                },
              };
              const responseXml = builder.buildObject(responseObj);

              res.writeHead(200, {
                "Content-Type": "application/xml; charset=utf-8",
              });
              res.end(responseXml);
            } catch (e) {
              console.error("Ошибка обработки XML данных:", e);
              res.writeHead(400, {
                "Content-Type": "application/xml; charset=utf-8",
              });
              res.end(
                `<error><message>Ошибка обработки данных XML: ${e.message
                  .replace(/</g, "<")
                  .replace(/>/g, ">")}</message></error>`
              );
            }
          });
        } else {
          res.writeHead(415, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(
            `Неподдерживаемый тип контента: ${contentType}. Ожидается application/xml или text/xml.`
          );
        }
      });
      req.on("error", (err) => {
        console.error("Ошибка при чтении POST /xml:", err);
        if (!res.headersSent) {
          res.writeHead(500, {
            "Content-Type": "application/xml; charset=utf-8",
          });
          res.end(
            "<error><message>Ошибка сервера при чтении XML запроса.</message></error>"
          );
        }
      });
    }
    // Задание 12
    //http://localhost:3000/files
    else if (pathname === "/files" && method === "GET") {
      fs.readdir(STATIC_DIR, (err, files) => {
        if (err) {
          console.error("Ошибка чтения директории static:", err);
          res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Внутренняя ошибка сервера при доступе к файловой системе.");
          return;
        }
        let fileCount = 0;
        let checkedCount = 0;
        if (files.length === 0) {
          res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Static-Files-Count": 0,
          });
          res.end("Директория static пуста.");
          return;
        }
        files.forEach((file) => {
          fs.stat(path.join(STATIC_DIR, file), (statErr, stats) => {
            checkedCount++;
            if (statErr) {
              console.error(
                `Ошибка получения стат для файла ${file}:`,
                statErr
              );
            } else if (stats.isFile()) {
              fileCount++;
            }
            if (checkedCount === files.length) {
              res.writeHead(200, {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Static-Files-Count": fileCount,
              });
              res.end(`Количество файлов в директории static: ${fileCount}`);
            }
          });
        });
      });

      // Задание 13
      //http://localhost:3000/files/image.png
      //http://localhost:3000/files/data.json
      //http://localhost:3000/files/style.css
    } else if (pathname.startsWith("/files/") && method === "GET") {
      const filename = path.basename(pathname);
      const filePath = path.join(STATIC_DIR, filename);

      if (!filePath.startsWith(STATIC_DIR)) {
        console.warn(`Попытка доступа за пределы static: ${pathname}`);
        res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Некорректный путь к файлу.");
        return;
      }

      fs.access(filePath, fs.constants.R_OK, (err) => {
        if (err) {
          console.log(`Файл не найден или недоступен: ${filePath}`);
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(`404 - Файл '${filename}' не найден в директории static.`);
        } else {
          let contentType = "application/octet-stream";
          const ext = path.extname(filename).toLowerCase();
          if (ext === ".txt") contentType = "text/plain; charset=utf-8";
          else if (ext === ".html") contentType = "text/html; charset=utf-8";
          else if (ext === ".css") contentType = "text/css";
          else if (ext === ".js") contentType = "application/javascript";
          else if (ext === ".json") contentType = "application/json";
          else if (ext === ".png") contentType = "image/png";
          else if (ext === ".xml") contentType = "application/xml";

          res.writeHead(200, { "Content-Type": contentType });
          const readStream = fs.createReadStream(filePath);
          readStream.pipe(res);

          readStream.on("error", (streamErr) => {
            console.error(
              `Ошибка чтения файла ${filename} во время стриминга:`,
              streamErr
            );
            res.end();
          });
        }
      });
    }
    // Задание 14:
    //http://localhost:3000/upload
    else if (pathname === "/upload") {
      if (method === "GET") {
        const filePath = path.join(__dirname, "upload.html");
        fs.readFile(filePath, "utf8", (err, data) => {
          if (err) {
            console.error("Ошибка при чтении upload.html:", err);
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Ошибка сервера при загрузке формы загрузки файла.");
          } else {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(data);
          }
        });
      } else if (method === "POST") {
        const form = formidable({
          uploadDir: STATIC_DIR, //куда сохранить
          keepExtensions: true, //сохран расширения
          maxFileSize: 20 * 1024 * 1024,
        });

        form.parse(req, (err, fields, files) => {
          if (err) {
            console.error("Ошибка загрузки файла:", err);
            let statusCode = err.httpCode || 500;
            let message = "Ошибка сервера при загрузке файла.";
            if (err.code === 1009 || err.message.includes("maxFileSize")) {
              statusCode = 413;
              message = `Ошибка: Файл слишком большой. Лимит: ${
                form.options.maxFileSize / 1024 / 1024
              } MB.`;
            }
            res.writeHead(statusCode, {
              "Content-Type": "text/plain; charset=utf-8",
            });
            res.end(message);
            return;
          }

          const uploadedFileArray = files.uploaded_file;
          if (!uploadedFileArray || uploadedFileArray.length === 0) {
            res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
            res.end(
              'Файл не был загружен. Убедитесь, что поле называется "uploaded_file".'
            );
            return;
          }
          const file = uploadedFileArray[0];

          console.log("Поля формы (если были):", fields);
          console.log("Информация о загруженном файле:", file);
          console.log(`Файл '${file.originalFilename}' успешно загружен.`);
          console.log(`Сохранен как: ${file.newFilename} в ${STATIC_DIR}`);
          console.log(`Путь: ${file.filepath}`);

          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(
            `<h1>Успех!</h1><p>Файл "<b>${file.originalFilename}</b>" (${
              file.mimetype
            }, ${
              file.size
            } байт) успешно загружен и сохранен в директории static.</p><p><a href="/upload">Загрузить еще</a></p><p><a href="/files/${encodeURIComponent(
              file.newFilename
            )}" target="_blank">Посмотреть загруженный файл (если возможно)</a></p>`
          );
        });
      } else {
        res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(`Метод ${method} не поддерживается для /upload.`);
      }
    } else {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(`404 - Ресурс не найден по адресу: ${req.url}`);
    }
  })
  .listen(PORT, () => {
    console.log(`Сервер запущен`);
    console.log(`Адрес: http://localhost:${PORT}`);
    console.log(
      `Текущий KeepAliveTimeout сервера: ${server.keepAliveTimeout} миллисекунд.`
    );
  });

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Ошибка: Порт ${PORT} уже используется другой программой!`);
  } else {
    console.error("Ошибка при запуске сервера:", err);
  }
  process.exit(1);
});

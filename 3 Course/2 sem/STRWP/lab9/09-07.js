const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const { URL } = require("url");

const SERVER_URL = "http://localhost:3000";
const TASK_ID = "Задание 07";

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

function createDummyPng(filename, sizeBytes) {
  if (fs.existsSync(filename) && fs.statSync(filename).size >= sizeBytes) {
    console.log(`Используется существующий большой файл: ${filename}`);
    return true;
  }

  console.log(`Создание PNG-файла > ${sizeBytes / 1024}KB: ${filename}`);
  try {
    // PNG-заголовок
    const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    // Конечный chunk PNG (IEND)
    const iendChunk = Buffer.from([
      0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
    ]);
    // Минимальные накладные расходы для PNG (заголовки и служебные блоки)
    const minOverhead = pngHeader.length + iendChunk.length + 12 * 2;
    // Вычисляем размер фиктивных данных, чтобы общий размер файла соответствовал требуемому
    const desiredDataSize =
      sizeBytes - minOverhead > 0 ? sizeBytes - minOverhead : 1;

    // Тип блока данных (IDAT)
    const dataChunkType = Buffer.from("IDAT", "ascii");
    const dummyData = Buffer.alloc(desiredDataSize, "x"); // Заполняем данные символами "x"
    const dummyCRC = Buffer.from([0, 0, 0, 0]); // Фиктивная контрольная сумма

    const dataChunkLength = Buffer.alloc(4);
    dataChunkLength.writeUInt32BE(desiredDataSize, 0); // Записываем длину блока данных

    const fileStream = fs.createWriteStream(filename);
    fileStream.write(pngHeader); // Заголовок PNG
    fileStream.write(dataChunkLength); // Длина IDAT
    fileStream.write(dataChunkType); // Тип блока
    fileStream.write(dummyData); // Сами данные
    fileStream.write(dummyCRC); // CRC (фиктивный)

    // Добавим ещё текстовый блок tEXt
    const textChunkType = Buffer.from("tEXt");
    const textData = Buffer.from("Comment\0Dummy", "ascii");
    const textChunkLength = Buffer.alloc(4);
    textChunkLength.writeUInt32BE(textData.length, 0);

    fileStream.write(textChunkLength);
    fileStream.write(textChunkType);
    fileStream.write(textData);
    fileStream.write(dummyCRC); // CRC тоже фиктивный

    // Записываем финальный IEND chunk
    fileStream.write(iendChunk);
    fileStream.end();

    console.log(`Файл ${filename} успешно создан.`);
    return true;
  } catch (err) {
    console.error("Ошибка при создании PNG-файла:", err);
    return false;
  }
}

async function runTask07() {
  console.log(`Выполнение ${TASK_ID}...`);

  const filePath = path.join(__dirname, "MyFile.png");
  const minSize = 500 * 1024 + 1; //> 0.5 МБ

  try {
    if (!createDummyPng(filePath, minSize)) {
      throw new Error("Не удалось создать или проверить PNG-файл.");
    }
    const form = new FormData();
    form.append("myFile", fs.createReadStream(filePath));

    const response = await axios.post(`${SERVER_URL}/upload`, form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    printResult(TASK_ID, response, response.data);
  } catch (error) {
    printError(TASK_ID, error);
  }
}

runTask07();

const fs = require("fs").promises;
const path = require("path");

async function runWasmInNode() {
  console.log("--- Задание 03: Запуск WASM в Node.js ---");
  try {
    const wasmFilePath = path.join(__dirname, "my_functions.wasm");

    console.log(`[Node.js] Загрузка WASM файла из: ${wasmFilePath}`);
    const wasmBuffer = await fs.readFile(wasmFilePath);
    console.log(
      `[Node.js] WASM-файл прочитан (размер: ${wasmBuffer.byteLength} байт).`
    );

    console.log("\n[Node.js] Содержимое WASM-файла (HEX):");

    const bytesPerLine = 16;
    for (let i = 0; i < wasmBuffer.byteLength; i += bytesPerLine) {
      const address = i.toString(16).padStart(8, "0");
      const chunk = wasmBuffer.subarray(
        i,
        Math.min(i + bytesPerLine, wasmBuffer.byteLength)
      );

      let hexLine = "";
      for (let j = 0; j < chunk.byteLength; j++) {
        hexLine += chunk[j].toString(16).padStart(2, "0") + " ";
      }

      while (hexLine.length < bytesPerLine * 3) {
        hexLine += "   ";
      }

      let asciiLine = "";
      for (let j = 0; j < chunk.byteLength; j++) {
        const charCode = chunk[j];
        asciiLine +=
          charCode >= 32 && charCode <= 126
            ? String.fromCharCode(charCode)
            : ".";
      }

      console.log(`${address}: ${hexLine} |${asciiLine}|`);
    }

    console.log("[Node.js] Компиляция WASM-модуля...");
    const wasmModule = await WebAssembly.compile(wasmBuffer);
    console.log("[Node.js] WASM-модуль скомпилирован. Инстанцирование...");

    const instance = await WebAssembly.instantiate(wasmModule, {});
    console.log("[Node.js] WASM-модуль инстанцирован.");

    const { sum, mul, sub } = instance.exports;

    if (!sum || !mul || !sub) {
      const errorMsg =
        "Ошибка: Одна или несколько требуемых WASM функций (sum, mul, sub) не найдены в экспортах.";
      console.error(errorMsg);
      console.log("Доступные экспорты:", instance.exports);
      return;
    }
    console.log("[Node.js] Экспортированные функции успешно извлечены.");

    const x = 100;
    const y = 25;

    console.log(`\n[Node.js] Тестирование WASM функций:`);
    console.log(`Входные данные: x = ${x}, y = ${y}`);

    const sumResult = sum(x, y);
    console.log(`  sum(${x}, ${y}) = ${sumResult}`);

    const mulResult = mul(x, y);
    console.log(`  mul(${x}, ${y}) = ${mulResult}`);

    const subResult = sub(x, y);
    console.log(`  sub(${x}, ${y}) = ${subResult}`);
  } catch (error) {
    console.error("[Node.js] Ошибка при выполнении WASM:", error);
  }
}

runWasmInNode();

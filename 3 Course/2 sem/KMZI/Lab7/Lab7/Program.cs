using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text; 

namespace Lab7_Interleaving
{
    class Utils
    {
        private static readonly Random random = new Random();

        public static int[] GenerateRandomBits(int length)
        {
            Console.WriteLine($"Генерация случайной последовательности из {length} бит...");
            int[] bits = new int[length];
            for (int i = 0; i < length; i++)
            {
                bits[i] = random.Next(0, 2);
            }
            return bits;
        }

        public static int[] PadBits(int[] data, int desiredLength, int padValue = 0)
        {
            if (data.Length >= desiredLength)
            {
                return data;
            }
            Console.WriteLine($"Дополнение данных с {data.Length} бит до {desiredLength} бит (добавление {desiredLength - data.Length} нулей).");
            int[] paddedData = new int[desiredLength];
            Array.Copy(data, paddedData, data.Length);
            for (int i = data.Length; i < desiredLength; i++)
            {
                paddedData[i] = padValue;
            }
            return paddedData;
        }

        public static int[] RemovePadding(int[] data, int originalLength)
        {
            if (originalLength > data.Length)
            {
                throw new ArgumentException("Оригинальная длина не может быть больше длины данных с дополнением.");
            }
            if (originalLength == data.Length)
            {
                return data;
            }
            Console.WriteLine($"Удаление дополнения: возврат от {data.Length} бит к исходным {originalLength} битам.");
            int[] originalData = new int[originalLength];
            Array.Copy(data, originalData, originalLength);
            return originalData;
        }

        public static void PrintArray(int[] array, string label = "Массив данных", int maxElements = 50)
        {
            Console.WriteLine($"{label} (Длина={array.Length}):");
            Console.Write("["); 
            for (int i = 0; i < Math.Min(array.Length, maxElements); i++)
            {
                Console.Write(array[i]); 
            }

            if (array.Length > maxElements)
            {
                Console.Write("..."); 
            }

            Console.WriteLine("]"); 
        }

        public static int[] InjectBurstError(int[] data, int burstLength, int trialNum = -1)
        {
            if (burstLength <= 0 || data == null || data.Length == 0) return data;
            if (burstLength > data.Length) burstLength = data.Length; // Ограничиваем длину ошибки

            int[] corruptedData = (int[])data.Clone(); // Работаем с копией
            int startPosition = random.Next(0, corruptedData.Length - burstLength + 1);

            string trialInfo = trialNum >= 0 ? $"(Попытка {trialNum}) " : "";
            Console.WriteLine($"{trialInfo}Внесение пакетной ошибки длиной {burstLength} бит начиная с позиции {startPosition}.");

            for (int i = 0; i < burstLength; i++)
            {
                int index = startPosition + i;
                corruptedData[index] = 1 - corruptedData[index]; // Инвертируем бит
            }
            return corruptedData;
        }
    }

    class Interleaver
    {
        public static (int[] interleavedData, int paddedLength, int rows, int cols) Interleave(int[] data, int numColumns, int trialNum = -1)
        {
            if (data == null || data.Length == 0 || numColumns <= 0)
            {
                throw new ArgumentException("Неверные входные данные для перемежения.");
            }

            int originalLength = data.Length;
            int numRows = (int)Math.Ceiling((double)originalLength / numColumns);
            int paddedLength = numRows * numColumns;
            string trialInfo = trialNum >= 0 ? $"(Попытка {trialNum}) " : "";

            Console.WriteLine($"{trialInfo}Перемежение: Исходная длина = {originalLength}, Столбцов = {numColumns}.");
            Console.WriteLine($"Требуемая матрица: {numRows} строк x {numColumns} столбцов (Всего ячеек = {paddedLength}).");

            int[] paddedData = Utils.PadBits(data, paddedLength); 

            int[,] matrix = new int[numRows, numColumns];

            Console.WriteLine("Запись данных в матрицу перемежения (построчно)...");
            int k = 0;
            for (int i = 0; i < numRows; i++)
            {
                for (int j = 0; j < numColumns; j++)
                {
                    matrix[i, j] = paddedData[k++];
                }
            }

            Console.WriteLine("Чтение данных из матрицы перемежения (постолбцово)...");
            int[] interleavedData = new int[paddedLength];
            k = 0;
            for (int j = 0; j < numColumns; j++)
            {
                for (int i = 0; i < numRows; i++)
                {
                    interleavedData[k++] = matrix[i, j];
                }
            }
            Console.WriteLine($"Перемежение завершено. Длина перемешанных данных: {interleavedData.Length}.");
            return (interleavedData, paddedLength, numRows, numColumns);
        }

        public static int[] Deinterleave(int[] interleavedData, int numRows, int numColumns, int originalUnpaddedLength, int trialNum = -1)
        {
            if (interleavedData == null || interleavedData.Length != numRows * numColumns || numRows <= 0 || numColumns <= 0)
            {
                throw new ArgumentException("Неверные входные данные для деперемежения.");
            }

            string trialInfo = trialNum >= 0 ? $"(Попытка {trialNum}) " : "";
            Console.WriteLine($"{trialInfo}Деперемежение: Входная длина = {interleavedData.Length}. Используется матрица {numRows}x{numColumns}.");

            int[,] matrix = new int[numRows, numColumns];

            Console.WriteLine("Запись данных в матрицу деперемежения (постолбцово)...");
            int k = 0;
            for (int j = 0; j < numColumns; j++)
            {
                for (int i = 0; i < numRows; i++)
                {
                    matrix[i, j] = interleavedData[k++];
                }
            }

            Console.WriteLine("Чтение данных из матрицы деперемежения (построчно)...");
            int[] paddedData = new int[numRows * numColumns];
            k = 0;
            for (int i = 0; i < numRows; i++)
            {
                for (int j = 0; j < numColumns; j++)
                {
                    paddedData[k++] = matrix[i, j];
                }
            }
            Console.WriteLine($"Данные после чтения матрицы (с дополнением): {paddedData.Length} бит.");
            return Utils.RemovePadding(paddedData, originalUnpaddedLength);
        }
    }


    class Hemming
    {
        public static (int[,] H, int r, int n) GenerateMatrix(int k)
        {
            if (k <= 0) throw new ArgumentException("k должно быть положительным");

            Console.WriteLine($"--- Генерация матрицы Хемминга для k={k} ---");
            int r = CalculateRedundantBits(k);
            int n = k + r;

            Console.WriteLine($"Рассчитанные параметры: k={k} (информационные), r={r} (проверочные), n={n} (длина кодового слова).");

            int[,] iMatrix = CreateMatr_I(r); // Единичная матрица Ir (r x r)
            int[,]? pMatrix = CreateMatr_P(k, r); // Подматрица P (r x k)
            if (pMatrix == null) throw new InvalidOperationException("Не удалось сгенерировать матрицу P.");

            // Формируем проверочную матрицу H = [P | Ir] (r x n)
            int[,] H = ConcatenateMatrices(pMatrix, iMatrix);

            if (H.GetLength(0) != r || H.GetLength(1) != n)
            {
                // Эта проверка не должна срабатывать, если P и I правильные
                Console.WriteLine($"Внимание: Размер сгенерированной матрицы H ({H.GetLength(0)}x{H.GetLength(1)}) не совпадает с ожидаемым ({r}x{n}).");
            }

            Console.WriteLine("Сгенерированная проверочная матрица H:");
            PrintMatrix(H);

            return (H, r, n);
        }

        private static int CalculateRedundantBits(int k)
        {
            // 2^r >= k + r + 1
            int r = 0;
            while ((1 << r) < (k + r + 1))
            {
                r++;
            }
            Console.WriteLine($"Для k={k} необходимо r={r} проверочных бит.");
            return r;
        }

        private static int[,] CreateMatr_I(int r) 
        {
            Console.WriteLine($"Создание единичной матрицы I размерностью {r}x{r}...");
            int[,] identityMatrix = new int[r, r];
            for (int i = 0; i < r; i++) identityMatrix[i, i] = 1;
            PrintMatrix(identityMatrix);
            return identityMatrix;
        }

        private static int[,]? CreateMatr_P(int k, int r) 
        {
            Console.WriteLine($"Создание подматрицы P размерностью {r}x{k}...");
            List<int[]> possibleColumns = new List<int[]>();
            int n_total = k + r; // Длина кодового слова
            // Ищем столбцы с весом >= 2 (не степени двойки)
            for (int i = 1; i <= n_total; i++)
            {
                // Пропускаем степени двойки (они для единичной части)
                if ((i & (i - 1)) == 0) continue;

                // Преобразуем индекс в бинарный столбец длины r
                int[] column = new int[r];
                int weight = 0;
                for (int bit = 0; bit < r; ++bit)
                {
                    if (((i >> bit) & 1) == 1)
                    {
                        column[bit] = 1;
                        weight++;
                    }
                }
                // Добавляем, если вес >= 2
                if (weight >= 2)
                {
                    possibleColumns.Add(column);
                }
            }

            if (possibleColumns.Count < k)
            {
                Console.WriteLine($"Ошибка: Найдено только {possibleColumns.Count} подходящих столбцов для P, а нужно {k}. Невозможно построить код Хемминга.");
                return null;
            }

            Console.WriteLine($"Найдено {possibleColumns.Count} возможных столбцов для P. Выбираем первые {k}.");
            int[,] pMatrix = new int[r, k];
            for (int j = 0; j < k; j++) // Индекс столбца в P
            {
                for (int i = 0; i < r; i++) // Индекс строки в P
                {
                    pMatrix[i, j] = possibleColumns[j][i];
                }
            }
            PrintMatrix(pMatrix);
            return pMatrix;
        }

        private static int[,] ConcatenateMatrices(int[,] matrixA, int[,] matrixB) // Горизонтальное объединение
        {
            int rowsA = matrixA.GetLength(0); int colsA = matrixA.GetLength(1);
            int rowsB = matrixB.GetLength(0); int colsB = matrixB.GetLength(1);
            if (rowsA != rowsB) throw new ArgumentException("Матрицы должны иметь одинаковое количество строк для горизонтального объединения.");

            int[,] result = new int[rowsA, colsA + colsB];
            for (int i = 0; i < rowsA; i++)
            {
                for (int j = 0; j < colsA; j++) result[i, j] = matrixA[i, j];
                for (int j = 0; j < colsB; j++) result[i, colsA + j] = matrixB[i, j];
            }
            Console.WriteLine($"Получена объединенная матрица ({result.GetLength(0)}x{result.GetLength(1)}).");
            return result;
        }

        public static void PrintMatrix(int[,] matrix)
        {
            int rows = matrix.GetLength(0);
            int cols = matrix.GetLength(1);
            for (int i = 0; i < rows; i++)
            {
                Console.Write("  [ ");
                for (int j = 0; j < cols; j++) Console.Write(matrix[i, j] + " ");
                Console.WriteLine("]");
            }
            Console.WriteLine(); // Добавляем пустую строку для читаемости
        }

        public static int[] Encode(int[] infoBits, int[,] H, int k, int r, int n)
        {
            if (infoBits.Length != k) throw new ArgumentException($"Ошибка кодирования: Длина инф. блока ({infoBits.Length}) не равна k ({k}).");
            if (H.GetLength(0) != r || H.GetLength(1) != n) throw new ArgumentException("Ошибка кодирования: Неверные размеры матрицы H.");

            //Console.WriteLine($"Кодирование Хеммингом блока из {k} бит...");
            int[] codeword = new int[n];
            Array.Copy(infoBits, codeword, k); // Копируем Xk в начало кодового слова

            // Вычисляем проверочные биты Xr
            int[] parityBits = new int[r];
            int[,] P = new int[r, k]; // Извлекаем P из H = [P | Ir]
            for (int i = 0; i < r; ++i) for (int j = 0; j < k; ++j) P[i, j] = H[i, j];

            // Вычисляем Xr = P * Xk (mod 2) --- Умножение матрицы P (r x k) на вектор Xk (k x 1)
            for (int i = 0; i < r; i++) // Для каждого проверочного бита
            {
                int sum = 0;
                for (int j = 0; j < k; j++) // Суммируем по информационным битам
                {
                    sum += P[i, j] * infoBits[j];
                }
                parityBits[i] = sum % 2;
            }

            // Копируем Xr в конец кодового слова
            Array.Copy(parityBits, 0, codeword, k, r);
            //Console.WriteLine($"Кодирование завершено. Получено кодовое слово длиной {n} бит.");
            return codeword;
        }

        public static (int[] correctedInfoBits, bool success) Decode(int[] receivedWord, int[,] H, int k, int r, int n, int blockNum = -1, int trialNum = -1)
        {
            if (receivedWord.Length != n) throw new ArgumentException($"Ошибка декодирования: Длина принятого слова ({receivedWord.Length}) не равна n ({n}).");
            if (H.GetLength(0) != r || H.GetLength(1) != n) throw new ArgumentException("Ошибка декодирования: Неверные размеры матрицы H.");

            string contextInfo = "";
            if (trialNum >= 0 && blockNum >= 0) contextInfo = $"(Попытка {trialNum}, Блок {blockNum}) ";
            else if (blockNum >= 0) contextInfo = $"(Блок {blockNum}) ";

            int[] syndrome = new int[r];
            for (int i = 0; i < r; i++) // Для каждой строки H (каждого проверочного уравнения)
            {
                int sum = 0;
                for (int j = 0; j < n; j++) // Суммируем по битам кодового слова
                {
                    sum += H[i, j] * receivedWord[j];
                }
                syndrome[i] = sum % 2;
            }


            bool isZeroSyndrome = syndrome.All(bit => bit == 0);

            if (isZeroSyndrome)
            {
                int[] infoBits = new int[k];
                Array.Copy(receivedWord, infoBits, k);
                return (infoBits, true); // Успешно (нет ошибок)
            }
            else
            {
                int errorPosition = -1; // Индекс (0-based)
                for (int j = 0; j < n; j++) // Проверяем каждый столбец H
                {
                    bool columnMatchesSyndrome = true;
                    for (int i = 0; i < r; i++)
                    {
                        if (H[i, j] != syndrome[i])
                        {
                            columnMatchesSyndrome = false;
                            break;
                        }
                    }
                    if (columnMatchesSyndrome)
                    {
                        //Console.WriteLine($"{contextInfo}Синдром совпал со столбцом {j} матрицы H.");
                        errorPosition = j;
                        break;
                    }
                }

                if (errorPosition != -1)
                {
                    // Одиночная ошибка найдена и локализована
                    Console.WriteLine($"{contextInfo}Найдена и исправлена одиночная ошибка в позиции {errorPosition}.");
                    int[] correctedWord = (int[])receivedWord.Clone();
                    correctedWord[errorPosition] = 1 - correctedWord[errorPosition]; // Инвертируем бит

                    int[] correctedInfoBits = new int[k];
                    Array.Copy(correctedWord, correctedInfoBits, k); // Извлекаем исправленные инф. биты
                    return (correctedInfoBits, true); // Успешно исправлено
                }
                else
                {
                    Console.WriteLine($"{contextInfo}ОШИБКА: Синдром [{string.Join("", syndrome)}] не совпал ни с одним столбцом H. Обнаружена неисправляемая (множественная) ошибка!");
                    int[] infoBits = new int[k];
                    Array.Copy(receivedWord, infoBits, k); // Возвращаем исходные (неисправленные) инф. биты
                    return (infoBits, false); // Исправление не удалось
                }
            }
        }
    }

    class Program
    {
            static void Main(string[] args)
            {
                Console.OutputEncoding = System.Text.Encoding.UTF8; // Для корректного отображения кириллицы

                // --- Параметры варианта 10 ---
                const int K_INFO_BITS = 5;
                const int MESSAGE_LENGTH_BYTES = 14;
                const int INTERLEAVER_COLUMNS = 9;
                int[] BURST_LENGTHS = { 4, 6, 8 };
                const int NUM_TRIALS = 30;

                const int MESSAGE_LENGTH_BITS = MESSAGE_LENGTH_BYTES * 8; // 112 бит

                Console.WriteLine($"Вариант 10: k={K_INFO_BITS}, Длина сообщения={MESSAGE_LENGTH_BYTES} байт ({MESSAGE_LENGTH_BITS} бит), Столбцов перемежителя={INTERLEAVER_COLUMNS}");
                Console.WriteLine($"Тестируемые длины пакетных ошибок: {string.Join(", ", BURST_LENGTHS)}");
                Console.WriteLine($"Количество попыток для каждой длины: {NUM_TRIALS}");
                Console.WriteLine("================================================================");

                // 1. Подготовка исходных данных
                Console.WriteLine("1. ПОДГОТОВКА ИСХОДНЫХ ДАННЫХ");
                int[] originalInfoData = Utils.GenerateRandomBits(MESSAGE_LENGTH_BITS);
                Utils.PrintArray(originalInfoData, "Сгенерированные исходные информационные биты", 120);

                // Дополнение данных до кратности k
                int paddedInfoLength = (int)Math.Ceiling((double)MESSAGE_LENGTH_BITS / K_INFO_BITS) * K_INFO_BITS;
                int numInfoBlocks = paddedInfoLength / K_INFO_BITS;
                int[] paddedOriginalInfoData = Utils.PadBits(originalInfoData, paddedInfoLength);
                Console.WriteLine($"Информационные данные дополнены до {paddedInfoLength} бит ({numInfoBlocks} блоков по {K_INFO_BITS} бит).");
                Utils.PrintArray(paddedOriginalInfoData, "Информационные данные после дополнения", 120);
                Console.WriteLine("----------------------------------------------------------------");

                // 2. Настройка Хемминга
                Console.WriteLine("2. ГЕНЕРАЦИЯ ПАРАМЕТРОВ И МАТРИЦЫ ХЕММИНГА");
                var (H, r, n) = Hemming.GenerateMatrix(K_INFO_BITS); // n = k+r
                Console.WriteLine("----------------------------------------------------------------");


                // 3. Кодирование Хеммингом всех блоков
                Console.WriteLine("3. КОДИРОВАНИЕ ХЕММИНГОМ ВСЕХ ИНФОРМАЦИОННЫХ БЛОКОВ");
                int totalEncodedBits = numInfoBlocks * n;
                Console.WriteLine($"Ожидаемая длина закодированных данных: {numInfoBlocks} блоков * {n} бит/блок = {totalEncodedBits} бит.");
                int[] fullEncodedData = new int[totalEncodedBits];
                for (int i = 0; i < numInfoBlocks; i++)
                {
                    int[] currentInfoBlock = new int[K_INFO_BITS];
                    Array.Copy(paddedOriginalInfoData, i * K_INFO_BITS, currentInfoBlock, 0, K_INFO_BITS);
                    int[] currentCodeword = Hemming.Encode(currentInfoBlock, H, K_INFO_BITS, r, n);
                    Array.Copy(currentCodeword, 0, fullEncodedData, i * n, n);
                }
                Utils.PrintArray(fullEncodedData, "Полные данные после кодирования Хеммингом", 160);
                Console.WriteLine("----------------------------------------------------------------");


                // --- Цикл симуляции ---
                Console.WriteLine("4. ПЕРЕДАА С ОШИБКАМИ");
                Console.WriteLine("================================================================");

                Dictionary<int, int> results = new Dictionary<int, int>();

                foreach (int burstLength in BURST_LENGTHS)
                {
                    Console.WriteLine($"\n--- ТЕСТИРОВАНИЕ ДЛЯ ПАКЕТНОЙ ОШИБКИ ДЛИНОЙ: {burstLength} БИТ ---");
                    int successCount = 0;

                    for (int trial = 1; trial <= NUM_TRIALS; trial++) 
                    {
                        Console.WriteLine($"\n--- Попытка {trial}/{NUM_TRIALS} (Длина ошибки={burstLength}) ---"); 
                        Console.WriteLine($"\nПеремежение данных ({totalEncodedBits} бит)..."); 
                        var (interleavedData, interleavedPaddedLength, numRows, numCols) = Interleaver.Interleave(fullEncodedData, INTERLEAVER_COLUMNS, -1); 
                        Console.WriteLine($"\nВнесение пакетной ошибки..."); 
                        int[] corruptedInterleavedData = Utils.InjectBurstError(interleavedData, burstLength, -1); 
                        Console.WriteLine($"\nДеперемежение данных ({corruptedInterleavedData.Length} бит)..."); 
                        int[] deinterleavedData = Interleaver.Deinterleave(corruptedInterleavedData, numRows, numCols, totalEncodedBits, -1);                                              

                        Console.WriteLine($"\nДекодирование Хеммингом ({numInfoBlocks} блоков по {n} бит)..."); 
                        int[] reconstructedPaddedInfoData = new int[paddedInfoLength];
                        bool trialOverallSuccess = true;
                        for (int i = 0; i < numInfoBlocks; i++)
                        {
                            int blockNum = i + 1;
                            int[] receivedCodeword = new int[n];
                            Array.Copy(deinterleavedData, i * n, receivedCodeword, 0, n);
                            var (correctedInfoBits, decodeSuccess) = Hemming.Decode(receivedCodeword, H, K_INFO_BITS, r, n, -1, -1); 

                            if (!decodeSuccess)
                            {
                                trialOverallSuccess = false;
                                Console.WriteLine($"!!! Попытка {trial}: Не удалось исправить ошибку в блоке {blockNum}!");
                            }
                            Array.Copy(correctedInfoBits, 0, reconstructedPaddedInfoData, i * K_INFO_BITS, K_INFO_BITS);
                        }
                       Console.WriteLine($"Декодирование всех блоков завершено. Общий успех декодирования в попытке {trial}: {trialOverallSuccess}");

                        int[] finalInfoData = Utils.RemovePadding(reconstructedPaddedInfoData, MESSAGE_LENGTH_BITS);

                        bool dataMatches = finalInfoData.SequenceEqual(originalInfoData);
                        Console.WriteLine($"Данные совпадают с оригиналом: {dataMatches}. Все блоки успешно декодированы: {trialOverallSuccess}"); 

                        if (dataMatches && trialOverallSuccess)
                        {
                            successCount++;
                           Console.WriteLine($"Попытка {trial}: УСПЕШНО");
                        }
                        else
                        {
                        Console.WriteLine($"Попытка {trial}: НЕУДАЧНО");
                        }
                        Console.WriteLine("---------------------------------------");

                    } 

                    results[burstLength] = successCount;
                    Console.WriteLine($"\nТестирование для длины {burstLength} завершено."); 

                } 
                Console.WriteLine("\n\n================================================================");
                Console.WriteLine("                  ИТОГОВАЯ СТАТИСТИКА");
                Console.WriteLine("================================================================");
                Console.WriteLine($"Параметры: Код Хемминга(k={K_INFO_BITS}, n={n}), Перемежитель({INTERLEAVER_COLUMNS} столбцов)");
                Console.WriteLine($"Объем исходных данных: {MESSAGE_LENGTH_BYTES} байт ({MESSAGE_LENGTH_BITS} бит)");
                Console.WriteLine($"Количество попыток на каждую длину ошибки: {NUM_TRIALS}");
                Console.WriteLine("----------------------------------------------------------------");

                var sortedBurstLengths = results.Keys.ToList();
                sortedBurstLengths.Sort();

                foreach (int burstLength in sortedBurstLengths)
                {
                    int currentSuccessCount = results[burstLength];
                    double successRate = (double)currentSuccessCount / NUM_TRIALS * 100.0;
                    Console.WriteLine($"Длина пакетной ошибки: {burstLength} бит");
                    Console.WriteLine($"  Успешно исправлено: {currentSuccessCount} из {NUM_TRIALS} попыток.");
                    Console.WriteLine($"  Процент успеха: {successRate:F2}%.");
                    Console.WriteLine("----------------------------------------------------------------");
                }
            }
        }
    }
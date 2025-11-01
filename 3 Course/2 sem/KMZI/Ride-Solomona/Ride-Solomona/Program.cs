using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using STH1123.ReedSolomon; 

class Program
{
    const int dataBlockSize = 223;     // K: Количество символов данных
    const int totalBlockSize = 255;    // N: Общее количество символов в кодовом слове
    const int paritySize = totalBlockSize - dataBlockSize; // N - K: Количество символов четности
    // Способность к исправлению:
    // - До floor(paritySize / 2) ошибок (если позиции неизвестны)
    // - До paritySize стираний (если позиции известны)
    // - Или комбинация 2*t_actual + e_actual <= paritySize

    static readonly Random rnd = new Random();
    const byte ERASURE_MARKER_BYTE = 0xEE; // Байт, которым будем помечать стертые символы 

    static void Main()
    {
        string inputPath = "input.txt";
        string encodedBinaryPath = "encoded.bin"; 
        string encodedTextPath = "encoded.txt";   
        string corruptedPath = "corrupted.bin";
        string decodedPath = "decoded.txt";

        string originalText = File.ReadAllText(inputPath, Encoding.UTF8);
        byte[] originalBytes = Encoding.UTF8.GetBytes(originalText);
        Console.WriteLine("=== 1. Исходный текст ===");
        Console.WriteLine(originalText);
        Console.WriteLine($"[Длина: {originalBytes.Length} байт]\n");
        Console.WriteLine($"--- Параметры RS: Data(K)={dataBlockSize}, Parity(N-K)={paritySize}, Total(N)={totalBlockSize} ---");
        Console.WriteLine($"--- Может исправить: до {paritySize / 2} ошибок ИЛИ до {paritySize} стираний (или комбинацию) на блок ---\n");


        // 2. Кодирование
        Console.WriteLine("=== 2. Кодирование (детальный поблочный вывод ниже) ==="); // Заголовок для всего этапа кодирования
        byte[] encodedBytes = EncodeRS(originalBytes); // EncodeRS теперь будет выводить все детали поблочно
        File.WriteAllBytes(encodedBinaryPath, encodedBytes);

        // --- ОБЩИЙ ВЫВОД ПОСЛЕ ЗАВЕРШЕНИЯ ВСЕГО КОДИРОВАНИЯ ---
        Console.WriteLine("\n\n=== ОБЩИЙ РЕЗУЛЬТАТ ПОСЛЕ ВСЕГО КОДИРОВАНИЯ ===");
        Console.WriteLine("--- Полностью закодированные данные (байты, первые 256 если длиннее): ---");
        Console.WriteLine(FormatBytes(encodedBytes, 0, Math.Min(256, encodedBytes.Length)) + (encodedBytes.Length > 256 ? "..." : ""));
        Console.WriteLine($"[Общая длина закодированных данных: {encodedBytes.Length} байт]");

        Console.WriteLine("\n--- Полностью закодированные данные (символьный вид UTF-8, непечатаемые заменены на '.'): ---");
        string fullEncodedText = BytesToPrintableString(encodedBytes, Encoding.UTF8);
        Console.WriteLine(fullEncodedText);
        //Точки . в выводе означают, что на этом месте в байтовом потоке находится:
        //Управляющий символ ASCII
        //Байт или последовательность байтов, которые не могут быть декодированы в валидный символ UTF-8.
        //Нулевой байт(NUL), который используется для заполнения(паддинга).

        try
        {
            File.WriteAllText(encodedTextPath, fullEncodedText, Encoding.UTF8);
            Console.WriteLine($"\n[Закодированные данные в символьном виде также записаны в файл: {encodedTextPath}]");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n[Ошибка при записи в файл {encodedTextPath}: {ex.Message}]");
        }
        Console.WriteLine(); 

        int numEncodedBlocks = (encodedBytes.Length + totalBlockSize - 1) / totalBlockSize;
        int errorsToIntroducePerBlock = paritySize / 4;
        int erasuresToIntroducePerBlock = paritySize / 4;

        Console.WriteLine($"--- Вносим примерно по {errorsToIntroducePerBlock} ошибок и {erasuresToIntroducePerBlock} стираний в каждый из {numEncodedBlocks} блоков ---");
        Console.WriteLine($"--- Теоретический предел на блок: 2*Ошибок + Стираний <= {paritySize} ---\n");

        var corruptionResult = CorruptDataWithErrorsAndErasures(encodedBytes, errorsToIntroducePerBlock, erasuresToIntroducePerBlock);
        byte[] corruptedBytes = corruptionResult.CorruptedData;
        List<int[]> erasureLocationsPerBlock = corruptionResult.ErasureLocationsPerBlock;
        File.WriteAllBytes(corruptedPath, corruptedBytes);

        Console.WriteLine("=== 3. Данные после внесения ошибок и стираний (поблочно) ===");
        for (int i = 0; i < encodedBytes.Length; i += totalBlockSize)
        {
            int blockNum = i / totalBlockSize;
            Console.WriteLine($"--- Блок {blockNum} (байт {i} - {Math.Min(i + totalBlockSize - 1, encodedBytes.Length - 1)}) ---");

            int currentBlockLength = Math.Min(totalBlockSize, encodedBytes.Length - i);
            byte[] originalBlockSegment = new byte[currentBlockLength];
            Array.Copy(encodedBytes, i, originalBlockSegment, 0, currentBlockLength);

            byte[] corruptedBlockSegment = new byte[currentBlockLength];
            int lenToCopyForCorrupted = Math.Min(currentBlockLength, corruptedBytes.Length - i);
            if (lenToCopyForCorrupted > 0)
            {
                Array.Copy(corruptedBytes, i, corruptedBlockSegment, 0, lenToCopyForCorrupted);
            }

            ConsoleColor currentConsoleColor = Console.ForegroundColor;
            Console.Write("Оригинальный закодированный блок (Данные ");
            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.Write("СЕРЫМ");
            Console.ForegroundColor = currentConsoleColor;
            Console.Write(" | Четность ");
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.Write("ГОЛУБЫМ");
            Console.ForegroundColor = currentConsoleColor;
            Console.WriteLine("):");

            FormatBytesWithColor(originalBlockSegment, 0, currentBlockLength,
                                 dataBlockSize,
                                 (currentBlockLength > dataBlockSize ? Math.Min(paritySize, currentBlockLength - dataBlockSize) : 0),
                                 ConsoleColor.DarkGray, ConsoleColor.Cyan);

            Console.WriteLine("Искаженный блок (с маркерами стираний 0xEE) - байты:");
            Console.WriteLine(FormatBytes(corruptedBlockSegment, 0, lenToCopyForCorrupted));

            Console.WriteLine("Искаженный блок в символьном виде (UTF-8, непечатаемые '.', маркеры стираний могут быть видны):");
            Console.Write("  [");
            int dataPartLengthInCorrupted = Math.Min(dataBlockSize, lenToCopyForCorrupted);
            int parityPartLengthInCorrupted = Math.Max(0, lenToCopyForCorrupted - dataPartLengthInCorrupted);

            if (dataPartLengthInCorrupted > 0)
            {
                Console.ForegroundColor = ConsoleColor.DarkGray;
                Console.Write(BytesToPrintableString(corruptedBlockSegment, 0, dataPartLengthInCorrupted, Encoding.UTF8));
                Console.ForegroundColor = currentConsoleColor;
            }
            if (parityPartLengthInCorrupted > 0)
            {
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.Write(BytesToPrintableString(corruptedBlockSegment, dataPartLengthInCorrupted, parityPartLengthInCorrupted, Encoding.UTF8));
                Console.ForegroundColor = currentConsoleColor;
            }
            Console.WriteLine("]");

            int actualErrorsInBlock = 0;
            int actualErasuresInBlock = (blockNum < erasureLocationsPerBlock.Count && erasureLocationsPerBlock[blockNum] != null) ? erasureLocationsPerBlock[blockNum].Length : 0;
            List<int> errorPositionsInBlockForDisplay = new List<int>();

            for (int j = 0; j < lenToCopyForCorrupted; j++)
            {
                bool isErasure = (blockNum < erasureLocationsPerBlock.Count &&
                                  erasureLocationsPerBlock[blockNum] != null &&
                                  erasureLocationsPerBlock[blockNum].Contains(j));

                if (j < originalBlockSegment.Length && originalBlockSegment[j] != corruptedBlockSegment[j] && !isErasure)
                {
                    actualErrorsInBlock++;
                    errorPositionsInBlockForDisplay.Add(j);
                }
            }

            Console.WriteLine($"  Обнаружено в блоке: {actualErrorsInBlock} ошибок (в позициях: {string.Join(", ", errorPositionsInBlockForDisplay)}), {actualErasuresInBlock} стираний (в позициях: {(actualErasuresInBlock > 0 && blockNum < erasureLocationsPerBlock.Count && erasureLocationsPerBlock[blockNum] != null ? string.Join(", ", erasureLocationsPerBlock[blockNum]) : "нет")}).");
            int damageScore = 2 * actualErrorsInBlock + actualErasuresInBlock;
            Console.WriteLine($"  Оценка повреждений для декодера: 2 * {actualErrorsInBlock} + {actualErasuresInBlock} = {damageScore}. (Предел: {paritySize})");
            if (damageScore > paritySize)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"  ВНИМАНИЕ: Повреждений ({damageScore}) БОЛЬШЕ, чем может быть исправлено ({paritySize}) в этом блоке!");
                Console.ResetColor();
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"  Повреждений ({damageScore}) В ПРЕДЕЛАХ исправительной способности ({paritySize}). Ожидается успешное восстановление.");
                Console.ResetColor();
            }
            Console.WriteLine();
        }

        Console.WriteLine("\n=== 4. Декодирование (с использованием информации о стираниях) ===");
        byte[] decodedBytes = DecodeRS(corruptedBytes, originalBytes.Length, erasureLocationsPerBlock);
        string decodedText = Encoding.UTF8.GetString(decodedBytes);
        File.WriteAllText(decodedPath, decodedText, Encoding.UTF8);
        Console.WriteLine("\n--- Восстановленный текст ---");
        Console.WriteLine(decodedText);
        Console.WriteLine($"[Длина: {decodedBytes.Length} байт]\n");

        Console.WriteLine("=== 5. Сравнение оригинала и восстановления ===");
        bool success = originalText == decodedText && originalBytes.SequenceEqual(decodedBytes);
        if (success)
        {
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("Восстановление УСПЕШНО: текст и байтовые массивы совпадают.");
            Console.ResetColor();
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("НЕУДАЧА восстановления: текст или байтовые массивы НЕ совпадают.");
            Console.ResetColor();
            if (originalText.Length != decodedText.Length)
            {
                Console.WriteLine($"  Разная длина текста: оригинал {originalText.Length}, восстановлено {decodedText.Length}");
            }
            if (originalBytes.Length != decodedBytes.Length)
            {
                Console.WriteLine($"  Разная длина байтов: оригинал {originalBytes.Length}, восстановлено {decodedBytes.Length}");
            }

            Console.WriteLine("  Первое найденное отличие в тексте:");
            int maxCheck = Math.Min(originalText.Length, decodedText.Length);
            for (int i = 0; i < maxCheck; i++)
            {
                if (originalText[i] != decodedText[i])
                {
                    Console.WriteLine($"  Позиция {i}: оригинал '{originalText[i]}' ({(int)originalText[i]:X2}), восстановлено '{decodedText[i]}' ({(int)decodedText[i]:X2})");
                    break;
                }
            }
            if (maxCheck < originalText.Length) Console.WriteLine($"  Оригинальный текст длиннее на {originalText.Length - maxCheck} символов.");
            if (maxCheck < decodedText.Length) Console.WriteLine($"  Восстановленный текст длиннее на {decodedText.Length - maxCheck} символов.");
        }

        Console.WriteLine("\nГотово. Результаты записаны в 'decoded.txt'.");
    }


    static byte[] EncodeRS(byte[] input)
    {
        var field = new GenericGF(285, 256, 0);
        var encoder = new ReedSolomonEncoder(field);
        using var ms = new MemoryStream();
        int blockNum = 0;

        Console.WriteLine("--- Детали кодирования поблочно: ---");
        for (int i = 0; i < input.Length; i += dataBlockSize)
        {
            Console.WriteLine($"--- Блок {blockNum} (исходные данные с байта {i}) ---");
            int currentDataBlockSize = Math.Min(dataBlockSize, input.Length - i);

            byte[] dataPortionForDisplay = new byte[currentDataBlockSize];
            Array.Copy(input, i, dataPortionForDisplay, 0, currentDataBlockSize);
            Console.WriteLine($"Данные для кодирования ({currentDataBlockSize} байт):");
            Console.WriteLine(FormatBytes(dataPortionForDisplay));
            Console.WriteLine($"Данные в символьном виде (UTF-8, непечатаемые заменены на '.'):");
            Console.WriteLine(BytesToPrintableString(dataPortionForDisplay, Encoding.UTF8));

            int[] blockToEncodeInts = new int[totalBlockSize];
            for (int j = 0; j < currentDataBlockSize; j++)
            {
                blockToEncodeInts[j] = input[i + j];
            }

            encoder.Encode(blockToEncodeInts, paritySize);

            byte[] encodedBlockBytes = new byte[totalBlockSize];
            for (int k = 0; k < totalBlockSize; k++) encodedBlockBytes[k] = (byte)blockToEncodeInts[k];

            ConsoleColor currentConsoleColor = Console.ForegroundColor;
            Console.Write("Закодированный блок (Данные ");
            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.Write("СЕРЫМ");
            Console.ForegroundColor = currentConsoleColor;
            Console.Write(" | Паддинг "); 
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.Write("ЖЕЛТЫМ");
            Console.ForegroundColor = currentConsoleColor;
            Console.Write(" | Четность ");
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.Write("ГОЛУБЫМ");
            Console.ForegroundColor = currentConsoleColor;
            Console.WriteLine(") - байты:");
            FormatBytesWithColor(encodedBlockBytes, 0, totalBlockSize,
                                 dataBlockSize, paritySize, 
                                 ConsoleColor.DarkGray, ConsoleColor.Cyan);

            Console.WriteLine("Закодированный блок - символьный вид (UTF-8, '.' для непечатаемых):");
            Console.Write("  [");
            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.Write(BytesToPrintableString(encodedBlockBytes, 0, currentDataBlockSize, Encoding.UTF8));

            if (dataBlockSize > currentDataBlockSize)
            {
                Console.ForegroundColor = ConsoleColor.Yellow; // Паддинг
                Console.Write(BytesToPrintableString(encodedBlockBytes, currentDataBlockSize, dataBlockSize - currentDataBlockSize, Encoding.UTF8));
            }

            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.Write(BytesToPrintableString(encodedBlockBytes, dataBlockSize, paritySize, Encoding.UTF8));

            Console.ForegroundColor = currentConsoleColor; 
            Console.WriteLine("]");

            for (int j = 0; j < totalBlockSize; j++)
            {
                ms.WriteByte((byte)blockToEncodeInts[j]);
            }
            blockNum++;
            Console.WriteLine(); 
        }
        return ms.ToArray();
    }

    public static string BytesToPrintableString(byte[] bytes, Encoding encoding, char replacementChar = '.')
    {
        if (bytes == null) return string.Empty;
        return BytesToPrintableString(bytes, 0, bytes.Length, encoding, replacementChar);
    }

    public static string BytesToPrintableString(byte[] bytes, int offset, int count, Encoding encoding, char replacementChar = '.')
    {
        if (bytes == null || count <= 0) return string.Empty;
        if (offset < 0 || count < 0 || offset > bytes.Length - count)
        {
            if (offset >= bytes.Length || count <= 0) return "";
            count = Math.Max(0, bytes.Length - offset);
            if (count <= 0) return "";
        }

        Decoder decoder = encoding.GetDecoder();
        decoder.Fallback = new DecoderReplacementFallback(replacementChar.ToString());

        char[] chars = new char[decoder.GetCharCount(bytes, offset, count)];
        decoder.GetChars(bytes, offset, count, chars, 0);

        for (int i = 0; i < chars.Length; i++)
        {
            if (char.IsControl(chars[i]) && !(chars[i] == '\t' || chars[i] == '\n' || chars[i] == '\r'))
            {
                chars[i] = replacementChar;
            }
        }
        return new string(chars);
    }

    public class CorruptionResult
    {
        public byte[] CorruptedData { get; set; }
        public List<int[]> ErasureLocationsPerBlock { get; set; }
    }

    static byte[] DecodeRS(byte[] inputCorrupted, int originalDataLength, List<int[]> erasureLocationsPerBlock)
    {
        var field = new GenericGF(285, 256, 0);
        var decoder = new ReedSolomonDecoder(field);
        using var msDecodedData = new MemoryStream();
        int blockNum = 0;
        int totalDataBytesDecoded = 0;
        int successfullyDecodedBlocks = 0;
        int failedToDecodeBlocks = 0;

        for (int i = 0; i < inputCorrupted.Length; i += totalBlockSize)
        {
            Console.WriteLine($"--- Декодирование блока {blockNum} (искаженные данные с байта {i}) ---");
            int currentTotalBlockSizeInStream = Math.Min(totalBlockSize, inputCorrupted.Length - i);

            if (currentTotalBlockSizeInStream <= paritySize && currentTotalBlockSizeInStream < totalBlockSize)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("ОШИБКА: Недостаточно данных в блоке для декодирования или блок неполный. Пропускаем.");
                Console.ResetColor();
                int bytesToWriteForThisBlock = Math.Min(dataBlockSize, originalDataLength - totalDataBytesDecoded);
                for (int k = 0; k < bytesToWriteForThisBlock; k++) msDecodedData.WriteByte(0);
                totalDataBytesDecoded += bytesToWriteForThisBlock;
                failedToDecodeBlocks++;
                blockNum++;
                if (totalDataBytesDecoded >= originalDataLength) break;
                continue;
            }

            var blockToDecode = new int[totalBlockSize];
            for (int j = 0; j < currentTotalBlockSizeInStream; j++)
            {
                blockToDecode[j] = inputCorrupted[i + j];
            }

            int[] erasuresForThisBlock = null;
            if (erasureLocationsPerBlock != null && blockNum < erasureLocationsPerBlock.Count && erasureLocationsPerBlock[blockNum] != null)
            {
                erasuresForThisBlock = erasureLocationsPerBlock[blockNum];
                if (erasuresForThisBlock.Length == 0) erasuresForThisBlock = null;
            }
            Console.WriteLine($" Переданы стирания декодеру: {(erasuresForThisBlock == null ? "нет" : string.Join(", ", erasuresForThisBlock))}");

            try
            {
                decoder.Decode(blockToDecode, paritySize, erasuresForThisBlock);
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("  Блок успешно декодирован (или не требовал исправлений).");
                Console.ResetColor();
                successfullyDecodedBlocks++;

                int bytesFromThisBlockToWrite = dataBlockSize;
                if (totalDataBytesDecoded + dataBlockSize > originalDataLength)
                {
                    bytesFromThisBlockToWrite = originalDataLength - totalDataBytesDecoded;
                }
                for (int j = 0; j < bytesFromThisBlockToWrite; j++)
                {
                    msDecodedData.WriteByte((byte)blockToDecode[j]);
                }
                totalDataBytesDecoded += bytesFromThisBlockToWrite;
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"  ОШИБКА ДЕКОДИРОВАНИЯ БЛОКА {blockNum}: {ex.Message}. Слишком много ошибок/стираний.");
                Console.ResetColor();
                failedToDecodeBlocks++;
                int bytesFromThisBlockToWrite = dataBlockSize;
                if (totalDataBytesDecoded + dataBlockSize > originalDataLength)
                {
                    bytesFromThisBlockToWrite = originalDataLength - totalDataBytesDecoded;
                }
                for (int j = 0; j < bytesFromThisBlockToWrite; j++)
                {
                    msDecodedData.WriteByte((byte)blockToDecode[j]);
                }
                totalDataBytesDecoded += bytesFromThisBlockToWrite;
            }
            blockNum++;
            if (totalDataBytesDecoded >= originalDataLength) break;
        }
        Console.WriteLine($"\n--- Статистика декодирования блоков: Успешно - {successfullyDecodedBlocks}, Ошибок - {failedToDecodeBlocks} ---");
        return msDecodedData.ToArray();
    }

    static CorruptionResult CorruptDataWithErrorsAndErasures(byte[] data, int errorsPerBlockTarget, int erasuresPerBlockTarget)
    {
        byte[] corrupted = new byte[data.Length];
        Array.Copy(data, corrupted, data.Length);
        List<int[]> allErasures = new List<int[]>();

        if (data.Length == 0) return new CorruptionResult { CorruptedData = corrupted, ErasureLocationsPerBlock = allErasures };

        for (int blockStartByte = 0; blockStartByte < data.Length; blockStartByte += totalBlockSize)
        {
            List<int> erasuresInThisBlock = new List<int>();
            HashSet<int> modifiedIndicesInBlock = new HashSet<int>();

            int blockLength = Math.Min(totalBlockSize, data.Length - blockStartByte);

            for (int k = 0; k < erasuresPerBlockTarget && erasuresInThisBlock.Count < erasuresPerBlockTarget; k++)
            {
                if (modifiedIndicesInBlock.Count >= blockLength) break;
                int attempts = 10;
                int erasurePosInBlock;
                do
                {
                    erasurePosInBlock = rnd.Next(blockLength);
                    attempts--;
                } while (modifiedIndicesInBlock.Contains(erasurePosInBlock) && attempts > 0);

                if (!modifiedIndicesInBlock.Contains(erasurePosInBlock))
                {
                    corrupted[blockStartByte + erasurePosInBlock] = ERASURE_MARKER_BYTE;
                    erasuresInThisBlock.Add(erasurePosInBlock);
                    modifiedIndicesInBlock.Add(erasurePosInBlock);
                }
            }
            allErasures.Add(erasuresInThisBlock.ToArray());

            int actualErrorsMade = 0;
            for (int k = 0; k < errorsPerBlockTarget && actualErrorsMade < errorsPerBlockTarget; k++)
            {
                if (modifiedIndicesInBlock.Count >= blockLength) break;
                int attempts = 10;
                int errorPosInBlock;
                do
                {
                    errorPosInBlock = rnd.Next(blockLength);
                    attempts--;
                } while (modifiedIndicesInBlock.Contains(errorPosInBlock) && attempts > 0);

                if (!modifiedIndicesInBlock.Contains(errorPosInBlock))
                {
                    byte originalByteInCorrupted = corrupted[blockStartByte + errorPosInBlock];
                    byte newByte;
                    do
                    {
                        newByte = (byte)rnd.Next(256);
                    } while (newByte == originalByteInCorrupted);
                    corrupted[blockStartByte + errorPosInBlock] = newByte;
                    modifiedIndicesInBlock.Add(errorPosInBlock);
                    actualErrorsMade++;
                }
            }
        }
        return new CorruptionResult { CorruptedData = corrupted, ErasureLocationsPerBlock = allErasures };
    }

    static void FormatBytesWithColor(byte[] bytes, int offset, int count,
                                     int highlightStartOffsetInDisplayedData, int highlightLength,
                                     ConsoleColor defaultColor, ConsoleColor highlightColor)
    {
        if (bytes == null) { Console.WriteLine("null"); return; }

        if (offset < 0 || count < 0 || offset > bytes.Length - count)
        {
            if (offset >= bytes.Length || count == 0)
            {
                Console.WriteLine();
                return;
            }
        }
        int actualCountToDisplay = Math.Min(count, bytes.Length - offset);
        if (actualCountToDisplay <= 0) { Console.WriteLine(); return; }

        ConsoleColor originalConsoleColor = Console.ForegroundColor;

        for (int i = 0; i < actualCountToDisplay; i++)
        {
            int currentByteAbsoluteIndex = offset + i;
            bool isHighlighted = (i >= highlightStartOffsetInDisplayedData &&
                                  i < highlightStartOffsetInDisplayedData + highlightLength &&
                                  highlightLength > 0);

            Console.ForegroundColor = isHighlighted ? highlightColor : defaultColor;
            Console.Write($"{bytes[currentByteAbsoluteIndex]:X2} ");

            if ((i + 1) % 16 == 0 && (i + 1) < actualCountToDisplay)
            {
                Console.WriteLine();
            }
        }
        Console.ForegroundColor = originalConsoleColor;
        Console.WriteLine();
    }

    static string FormatBytes(byte[] bytes, int offset = 0, int? countNullable = null)
    {
        if (bytes == null) return "null";

        int actualCount = countNullable ?? bytes.Length - offset;
        if (offset < 0 || actualCount < 0 || offset > bytes.Length - actualCount)
        {
            if (offset >= bytes.Length || actualCount == 0) return "";
        }
        int len = Math.Min(actualCount, bytes.Length - offset);
        if (len <= 0) return "";

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < len; i++)
        {
            sb.AppendFormat("{0:X2} ", bytes[offset + i]);
            if ((i + 1) % 16 == 0 && (i + 1) < len) sb.AppendLine("  ");
        }
        return sb.ToString().TrimEnd();
    }
}
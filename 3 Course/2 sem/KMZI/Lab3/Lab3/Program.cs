using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using OfficeOpenXml;

class Program
{
    static readonly string latvianFilePath = "D:\\University\\2sem\\KMZI\\Лабораторные\\Lab3\\latvian.txt";
    static readonly string base64Path = "D:\\University\\2sem\\KMZI\\Лабораторные\\Lab3\\encoded.txt";

    static void Main()
    {
        while (true)
        {
            Console.Clear();
            Console.WriteLine("Выберите задание:");
            Console.WriteLine("2 - Рассчитать энтропию алфавитов");
            Console.WriteLine("3 - Определить энтропию бинарного алфавита");
            Console.WriteLine("q - Выйти");

            char choice = Console.ReadKey().KeyChar;
            Console.WriteLine("\n");

            switch (choice)
            {
                case '2':
                    CalculateAlphabetProperties(latvianFilePath, GetLatvianAlphabet(), "Latvian");
                    CalculateAlphabetProperties(base64Path, GetBase64Alphabet(), "Base64");
                    break;
                case '3':
                    UsingXOR();
                    break;
                case 'q':
                    return;
                default:
                    Console.WriteLine("Неверный выбор.");
                    break;
            }
            Console.WriteLine("\nНажмите любую клавишу, чтобы продолжить...");
            Console.ReadKey();
        }
    }

    static List<char> GetLatvianAlphabet()
    {
        return new List<char>()
            { 'a', 'ā', 'b', 'c', 'č', 'd', 'e', 'ē', 'f',
                'g', 'ģ', 'h', 'i', 'ī', 'j', 'k', 'ķ', 'l',
                'ļ', 'm', 'n', 'ņ', 'o', 'p', 'r', 's', 'š',
                't', 'u', 'ū', 'v', 'z', 'ž' };
    }
    static List<char> GetBase64Alphabet()
    {
        return new List<char>("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=");
    }

    static void CalculateAlphabetProperties(string filePath, List<char> alphabet, string sheetName)
    {
        if (!File.Exists(filePath))
        {
            Console.WriteLine($"Файл {filePath} не найден!");
            return;
        }

        string text = File.ReadAllText(filePath);
        var frequency = alphabet.ToDictionary(c => c, c => 0);
        int totalChars = 0;

        foreach (char c in text)
        {
            if (alphabet.Contains(c))
            {
                frequency[c]++;
                totalChars++;
            }
        }

        if (totalChars == 0)
        {
            Console.WriteLine($"В файле {filePath} нет символов данного алфавита.");
            return;
        }

        double shannonEntropy = 0;
        Dictionary<char, double> probabilities = new Dictionary<char, double>();

        foreach (var pair in frequency)
        {
            double probability = (double)pair.Value / totalChars;
            probabilities[pair.Key] = probability;
            if (probability > 0)
                shannonEntropy -= probability * Math.Log2(probability);
        }

        double hartleyEntropy = Math.Log2(alphabet.Count);
        double redundancy = 1 - (shannonEntropy / hartleyEntropy);

        Console.WriteLine($"\nФайл: {Path.GetFileName(filePath)}");
        Console.WriteLine($"Энтропия Хартли: {hartleyEntropy:F4} бит");
        Console.WriteLine($"Энтропия Шеннона: {shannonEntropy:F4} бит");
        Console.WriteLine($"Избыточность: {redundancy * 100:F2}%");

        SaveToExcel(probabilities, sheetName, hartleyEntropy, shannonEntropy, redundancy);
    }
    static void SaveToExcel(Dictionary<char, double> data, string sheetName, double hHartley, double hShannon, double redundancy)
    {
        string filePath = "EntropyResults.xlsx";
        FileInfo fileInfo = new FileInfo(filePath);
        ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;

        using (ExcelPackage package = new ExcelPackage(fileInfo))
        {
            ExcelWorksheet worksheet = package.Workbook.Worksheets.FirstOrDefault(ws => ws.Name == sheetName)
                ?? package.Workbook.Worksheets.Add(sheetName);

            worksheet.Cells.Clear();

            worksheet.Cells[1, 1].Value = "Символ";
            worksheet.Cells[1, 2].Value = "Вероятность";

            int row = 2;
            foreach (var pair in data)
            {
                worksheet.Cells[row, 1].Value = pair.Key.ToString();
                worksheet.Cells[row, 2].Value = pair.Value;
                row++;
            }

            worksheet.Cells[row + 1, 1].Value = "Энтропия Хартли";
            worksheet.Cells[row + 1, 2].Value = hHartley;

            worksheet.Cells[row + 2, 1].Value = "Энтропия Шеннона";
            worksheet.Cells[row + 2, 2].Value = hShannon;

            worksheet.Cells[row + 3, 1].Value = "Избыточность";
            worksheet.Cells[row + 3, 2].Value = redundancy * 100;

            package.Save();
        }
    }
    static void UsingXOR()
    {
        string surname = "Nemkovich";
        string name = "Anastasija";

        byte[] asciiA = Encoding.ASCII.GetBytes(surname);
        byte[] asciiB = Encoding.ASCII.GetBytes(name);

        int maxAsciiLength = Math.Max(asciiA.Length, asciiB.Length);
        asciiA = PadArray(asciiA, maxAsciiLength);
        asciiB = PadArray(asciiB, maxAsciiLength);


        byte[] xorAsciiCustom = XorCustom(asciiA, asciiB);
        byte[] xorAsciiStandard = XorStandard(asciiA, asciiB);
        byte[] recoveredAscii = XorCustom(xorAsciiCustom, asciiB);
        string recoveredAsciiString = Encoding.ASCII.GetString(recoveredAscii).TrimEnd('\0');

        string base64A = Convert.ToBase64String(asciiA);
        string base64B = Convert.ToBase64String(asciiB);

        byte[] base64BytesA = Convert.FromBase64String(base64A);
        byte[] base64BytesB = Convert.FromBase64String(base64B);


        byte[] xorBase64Custom = XorCustom(base64BytesA, base64BytesB);
        byte[] xorBase64Standard = XorStandard(base64BytesA, base64BytesB);
        byte[] recoveredBase64 = XorCustom(xorBase64Custom, base64BytesB);

        recoveredBase64 = recoveredBase64.TakeWhile(b => b != 0).ToArray();
        string recoveredBase64String = Convert.ToBase64String(recoveredBase64);

        Console.WriteLine("=== XOR в ASCII ===");
        Console.WriteLine("ASCII A: " + ToBinaryString(asciiA));
        Console.WriteLine("ASCII B: " + ToBinaryString(asciiB));
        Console.WriteLine("Без стандартных ф-й: " + ToBinaryString(xorAsciiCustom));
        Console.WriteLine("Со стандартными ф-ями: " + ToBinaryString(xorAsciiStandard));
        Console.WriteLine("a XOR b XOR b = " + recoveredAsciiString);
        Console.WriteLine("В бинарном виде: " + ToBinaryString(recoveredAscii));


        Console.WriteLine("\n=== XOR в Base64 ===");
        Console.WriteLine("Base64 A: " + ToBinaryString(base64BytesA));
        Console.WriteLine("Base64 B: " + ToBinaryString(base64BytesB));
        Console.WriteLine("Без стандартных ф-й: " + ToBinaryString(xorBase64Custom));
        Console.WriteLine("Со стандартными ф-ями: " + ToBinaryString(xorBase64Standard));
        Console.WriteLine("a XOR b XOR b = " + recoveredBase64String);
        Console.WriteLine("(base64->ASCII)a XOR b XOR b = " + Encoding.ASCII.GetString(Convert.FromBase64String(recoveredBase64String)));
        Console.WriteLine("В бинарном виде: " + ToBinaryString(recoveredBase64));
    }
    static byte[] XorCustom(byte[] a, byte[] b)
    {
        byte[] result = new byte[a.Length];
        for (int i = 0; i < a.Length; i++)
        {
            result[i] = (byte)(a[i] ^ b[i]);
        }
        return result;
    }

    static byte[] XorStandard(byte[] a, byte[] b)
    {
        return a.Zip(b, (x, y) => (byte)(x ^ y)).ToArray();
    }
    static string ToBinaryString(byte[] data)
    {
        return string.Join(" ", data.Select(b => Convert.ToString(b, 2).PadLeft(8, '0')));
    }

    static byte[] PadArray(byte[] input, int length)
    {
        byte[] output = new byte[length];
        Array.Copy(input, output, input.Length);
        return output;
    }
}

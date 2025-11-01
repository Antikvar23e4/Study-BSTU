using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using OfficeOpenXml;

class Program
{
    static readonly string latvianFilePath = "D:\\University\\2sem\\KMZI\\Лабораторные\\Lab2\\latvian.txt";
    static readonly string tajikFilePath = "D:\\University\\2sem\\KMZI\\Лабораторные\\Lab2\\tajik.txt";

    static void Main()
    {
        while (true)
        {
            Console.Clear();
            Console.WriteLine("Выберите задание:");
            Console.WriteLine("a - Рассчитать энтропию алфавитов");
            Console.WriteLine("b - Определить энтропию бинарного алфавита");
            Console.WriteLine("c - Подсчитать количество информации в сообщении");
            Console.WriteLine("d - Подсчет информации с учетом ошибок передачи");
            Console.WriteLine("q - Выйти");

            char choice = Console.ReadKey().KeyChar;
            Console.WriteLine("\n");

            switch (choice)
            {
                case 'a':
                    CalculateAlphabetEntropy();
                    break;
                case 'b':
                    CalculateBinaryEntropy();
                    break;
                case 'c':
                    CalculateInformationAmount();
                    break;
                case 'd':
                    CalculateInformationWithErrors();
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

    static string SelectFile()
    {
        Console.WriteLine("\nВыберите текстовый файл:");
        Console.WriteLine($"1 - {Path.GetFileName(latvianFilePath)}");
        Console.WriteLine($"2 - {Path.GetFileName(tajikFilePath)}");

        char choice = Console.ReadKey().KeyChar;
        Console.WriteLine("\n");

        return choice switch
        {
            '1' => latvianFilePath,
            '2' => tajikFilePath,
            _ => null
        };
    }

    static void CalculateAlphabetEntropy()
    {
        string filePath = SelectFile();
        if (filePath == null || !File.Exists(filePath))
        {
            Console.WriteLine("Файл не найден!");
            return;
        }

        List<char> alphabet = GetAlphabet(filePath);
        if (alphabet == null)
        {
            Console.WriteLine("Не удалось определить алфавит!");
            return;
        }

        (double entropy, Dictionary<char, double> frequencies) = CalculateEntropyFromFile(filePath, alphabet);

        Console.WriteLine($"\nЭнтропия алфавита для {Path.GetFileName(filePath)}: {entropy:F4} бит");

        SaveToExcel(frequencies, Path.GetFileName(filePath));
        Console.WriteLine("\nРезультаты сохранены в Excel-файл: EntropyResults.xlsx");
    }

    static List<char> GetAlphabet(string filePath)
    {
        if (filePath == latvianFilePath)
        {
            return new List<char>() 
            { 'a', 'ā', 'b', 'c', 'č', 'd', 'e', 'ē', 'f',
                'g', 'ģ', 'h', 'i', 'ī', 'j', 'k', 'ķ', 'l',
                'ļ', 'm', 'n', 'ņ', 'o', 'p', 'r', 's', 'š',
                't', 'u', 'ū', 'v', 'z', 'ž' };
        }
        else if (filePath == tajikFilePath)
        {
            return new List<char>() 
            { 'а', 'б', 'в', 'г', 'ғ', 'д', 'е', 'ё', 'ж', 'з',
                'и', 'ӣ', 'й', 'к', 'қ', 'л', 'м', 'н', 'о', 'п',
                'р', 'с', 'т', 'у', 'ӯ', 'ф', 'х', 'ҳ', 'ч', 'ҷ',
                'ш', 'ъ', 'э', 'ю', 'я' };
        }
        return null;
    }

    static (double, Dictionary<char, double>) CalculateEntropyFromFile(string filePath, List<char> alphabet)
    {
        string text = File.ReadAllText(filePath).ToLower();
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
            Console.WriteLine($"В файле нет символов данного алфавита.");
            return (0, new Dictionary<char, double>());
        }

        double entropy = 0;
        Dictionary<char, double> probabilities = new Dictionary<char, double>();

        foreach (var pair in frequency)
        {
            double probability = (double)pair.Value / totalChars;
            probabilities[pair.Key] = probability;
            if (probability > 0)
                entropy -= probability * Math.Log2(probability);
        }

        return (entropy, probabilities);
    }

    static void SaveToExcel(Dictionary<char, double> data, string sheetName)
    {
        string filePath = "EntropyResults.xlsx";
        FileInfo fileInfo = new FileInfo(filePath);

        ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;
        using (ExcelPackage package = new ExcelPackage(fileInfo))
        {
            ExcelWorksheet worksheet = package.Workbook.Worksheets.FirstOrDefault(ws => ws.Name == sheetName);
            if (worksheet == null)
                worksheet = package.Workbook.Worksheets.Add(sheetName);

            worksheet.Cells.Clear(); // Очищаем старые данные

            worksheet.Cells[1, 1].Value = "Символ";
            worksheet.Cells[1, 2].Value = "Вероятность";

            int row = 2;
            foreach (var pair in data)
            {
                worksheet.Cells[row, 1].Value = pair.Key.ToString();
                worksheet.Cells[row, 2].Value = pair.Value;
                row++;
            }

            package.Save();
        }
    }

    static void CalculateBinaryEntropy()
    {
        string filePath = SelectFile();
        if (filePath == null || !File.Exists(filePath))
        {
            Console.WriteLine("Файл не найден!");
            return;
        }

        (double entropy, double p0, double p1) = CalculateBinaryEntropyFromFile(filePath);

        Console.WriteLine($"\nЭнтропия бинарного алфавита для {Path.GetFileName(filePath)}: {entropy:F4} бит");
        Console.WriteLine($"Частота 0: {p0 * 100:F2}%");
        Console.WriteLine($"Частота 1: {p1 * 100:F2}%");
    }

    static (double entropy, double p0, double p1) CalculateBinaryEntropyFromFile(string filePath)
    {
        string text = File.ReadAllText(filePath);
        StringBuilder binaryString = new StringBuilder();

        foreach (byte b in Encoding.UTF8.GetBytes(text))
        {
            binaryString.Append(Convert.ToString(b, 2).PadLeft(8, '0'));
        }

        string binaryData = binaryString.ToString();
        int count0 = binaryData.Count(c => c == '0');
        int count1 = binaryData.Count(c => c == '1');
        int totalBits = binaryData.Length;

        double p0 = (double)count0 / totalBits;
        double p1 = (double)count1 / totalBits;

        double entropy = 0;
        if (p0 > 0) entropy -= p0 * Math.Log2(p0);
        if (p1 > 0) entropy -= p1 * Math.Log2(p1);

        return (entropy, p0, p1);
    }

    static void CalculateInformationAmount()
    {
        string fullNameLatvian = "NemkovicAnastasijaVadimovna"; 
        string fullNameTajik = "НемковичАнастасияВадимовна";

        int nameLengthLatvian = fullNameLatvian.Length;
        int nameLengthTajik = fullNameTajik.Length;

        (double latvianEntropy, _) = CalculateEntropyFromFile(latvianFilePath, GetAlphabet(latvianFilePath));
        (double tajikEntropy, _) = CalculateEntropyFromFile(tajikFilePath, GetAlphabet(tajikFilePath));


        double binaryEntropy = 8.0;

        double infoAmountLatvian = latvianEntropy * nameLengthLatvian;
        double infoAmountLatvianBinary = binaryEntropy * nameLengthLatvian;

        double infoAmountTajik = tajikEntropy * nameLengthTajik;
        double infoAmountTajikBinary = binaryEntropy * nameLengthTajik;


        Console.WriteLine($"ФИО (латышский алфавит): {fullNameLatvian}");
        Console.WriteLine($"  - Энтропия алфавита: {latvianEntropy:F4} бит");
        Console.WriteLine($"  - Количество информации (по алфавиту): {infoAmountLatvian:F4} бит");
        Console.WriteLine($"  - Количество информации (по бинарному алфавиту): {infoAmountLatvianBinary:F4} бит");

        Console.WriteLine($"\nФИО (таджикский алфавит): {fullNameTajik}");
        Console.WriteLine($"  - Энтропия алфавита: {tajikEntropy:F4} бит");
        Console.WriteLine($"  - Количество информации (по алфавиту): {infoAmountTajik:F4} бит");
        Console.WriteLine($"  - Количество информации (по бинарному алфавиту): {infoAmountTajikBinary:F4} бит");

    }

    static void CalculateInformationWithErrors()
    {
        string fullNameLatvian = "NemkovicAnastasijaVadimovna";
        string fullNameTajik = "НемковичАнастасияВадимовна";

        int nameLengthLatvian = fullNameLatvian.Length;
        int nameLengthTajik = fullNameTajik.Length;

        (double latvianEntropy, _) = CalculateEntropyFromFile(latvianFilePath, GetAlphabet(latvianFilePath));
        (double tajikEntropy, _) = CalculateEntropyFromFile(tajikFilePath, GetAlphabet(tajikFilePath));


        double binaryEntropy = 8.0;

        double infoAmountLatvian = latvianEntropy * nameLengthLatvian;
        double infoAmountLatvianBinary = binaryEntropy * nameLengthLatvian;

        double infoAmountTajik = tajikEntropy * nameLengthTajik;
        double infoAmountTajikBinary = binaryEntropy * nameLengthTajik;

        double[] errorProbabilities = { 0.1, 0.5, 1.0 };

        foreach (double pError in errorProbabilities)
        {
            double h2Error = BinaryEntropyFunction(pError);

            double effectiveLatvian = infoAmountLatvian * (1 - h2Error);
            double effectiveLatvianBinary = infoAmountLatvianBinary * (1 - h2Error);

            double effectiveTajik = infoAmountTajik * (1 - h2Error);
            double effectiveTajikBinary = infoAmountTajikBinary * (1 - h2Error);

            Console.WriteLine($"\nВероятность ошибки передачи: {pError:F1}");

            Console.WriteLine($"ФИО (латышский алфавит): {fullNameLatvian}");
            Console.WriteLine($"  - Количество информации (по алфавиту) с учётом ошибок: {infoAmountLatvian:F4} бит");
            Console.WriteLine($"  - Количество информации (по бинарному алфавиту) с учётом ошибок: {effectiveLatvianBinary:F4} бит");

            Console.WriteLine($"ФИО (таджикский алфавит): {fullNameTajik}");
            Console.WriteLine($"  - Количество информации (по алфавиту) с учётом ошибок: {infoAmountTajik:F4} бит");
            Console.WriteLine($"  - Количество информации (по бинарному алфавиту) с учётом ошибок: {effectiveTajikBinary:F4} бит");
        }
    }

    static double BinaryEntropyFunction(double p)
    {
        if (p == 0.0 || p == 1.0)
            return 0.0;
        return -p * Math.Log2(p) - (1 - p) * Math.Log2(1 - p);
    }

}

using System;
using System.Collections.Generic;
using System.Linq;

class Program
{
    static int[,] GenerateGeneratorMatrix(int k, int r, int[] g)
    {
        int n = k + r;
        int[,] G = new int[k, n];

        for (int i = 0; i < k; i++)
        {
            for (int j = 0; j <= r; j++)
            {
                G[i, i + j] = g[j];
            }
        }

        return G;
    }

    static void ToCanonicalForm(int[,] G, int k, int n)
    {
        Console.WriteLine("\nПреобразование в каноническую форму:");
        for (int i = 0; i < k; i++)
        {
            if (G[i, i] == 0)
            {
                for (int j = i + 1; j < k; j++)
                {
                    if (G[j, i] == 1)
                    {
                        Console.WriteLine($" Строка {i} += Строка {j}");
                        for (int t = 0; t < n; t++)
                            G[i, t] ^= G[j, t];
                        break;
                    }
                }
            }

            for (int j = 0; j < k; j++)
            {
                if (j != i && G[j, i] == 1)
                {
                    Console.WriteLine($" Строка {j} += Строка {i}");
                    for (int t = 0; t < n; t++)
                        G[j, t] ^= G[i, t];
                }
            }
        }
    }

    static int[,] GenerateHMatrix(int[,] G, int k, int n)
    {
        int r = n - k;
        int[,] H = new int[r, n];

        for (int i = 0; i < r; i++)
        {
            for (int j = 0; j < k; j++)
                H[i, j] = G[j, k + i];

            H[i, k + i] = 1;
        }

        return H;
    }

    static int[] MultiplyVectorByMatrix(int[] vector, int[,] matrix)
    {
        int[] result = new int[matrix.GetLength(1)];
        for (int j = 0; j < matrix.GetLength(1); j++)
        {
            int sum = 0;
            for (int i = 0; i < vector.Length; i++)
                sum ^= vector[i] * matrix[i, j];
            result[j] = sum;
        }
        return result;
    }

    static int[] ComputeSyndrome(int[,] H, int[] received)
    {
        int r = H.GetLength(0);
        int[] syndrome = new int[r];

        for (int i = 0; i < r; i++)
        {
            int sum = 0;
            for (int j = 0; j < H.GetLength(1); j++)
                sum ^= H[i, j] * received[j];
            syndrome[i] = sum;
        }

        return syndrome;
    }

    static int[] CorrectSingleError(int[] syndrome, int[,] H, int[] received, out int errorPosition)
    {
        int r = H.GetLength(0);
        int n = H.GetLength(1);
        errorPosition = -1;

        for (int j = 0; j < n; j++)
        {
            bool match = true;
            for (int i = 0; i < r; i++)
            {
                if (H[i, j] != syndrome[i])
                {
                    match = false;
                    break;
                }
            }
            if (match)
            {
                errorPosition = j;
                break;
            }
        }

        int[] corrected = (int[])received.Clone();
        if (errorPosition != -1)
            corrected[errorPosition] ^= 1;

        return corrected;
    }

    static int[] IntroduceErrors(int[] codeword, int errorCount, out List<int> flippedPositions)
    {
        Random rand = new Random();
        int[] corrupted = (int[])codeword.Clone();
        flippedPositions = new List<int>();

        while (flippedPositions.Count < errorCount)
        {
            int pos = rand.Next(codeword.Length);
            if (!flippedPositions.Contains(pos))
            {
                corrupted[pos] ^= 1;
                flippedPositions.Add(pos);
            }
        }

        flippedPositions.Sort();
        return corrupted;
    }

    static void AnalyzeWithErrorCount(int[] codeword, int[,] H, int errorCount, int n)
    {
        Console.WriteLine($"\n--- Анализ с {errorCount} ошибкой(ами) ---");

        List<int> errorPositions;
        int[] received = IntroduceErrors(codeword, errorCount, out errorPositions);

        Console.WriteLine("Yn: " + string.Join("", received));
        if (errorCount > 0)
            Console.WriteLine("Сгенерированные ошибки на позициях: " + string.Join(", ", errorPositions));
        else
            Console.WriteLine("Ошибка не была сгенерирована");

        int[] syndrome = ComputeSyndrome(H, received);
        Console.WriteLine("Синдром: " + string.Join("", syndrome));

        if (syndrome.All(bit => bit == 0))
        {
            Console.WriteLine("Ошибок не обнаружено.");
        }
        else
        {
            int errorPos;
            int[] corrected = CorrectSingleError(syndrome, H, received, out errorPos);

            if (errorPos != -1)
            {
                Console.WriteLine($"Обнаружена ошибка в позиции: {errorPos}");
                Console.WriteLine("En: " +
                    string.Join("", Enumerable.Range(0, n).Select(i => i == errorPos ? "1" : "0")));
                Console.WriteLine("Исправленное слово: " + string.Join("", corrected));
            }
            else
            {
                Console.WriteLine("Синдром не соответствует одиночной ошибке — возможно, 2 ошибки.");
                Console.WriteLine("Исправление невозможно.");
            }
        }
    }

    static void Main()
    {
        int variant = 10;
        int r = 6;
        int n = 13;
        int k = n - r;

        //x^6 + x^3 + 1
        int[] g = { 1, 0, 0, 1, 0, 0, 1 };

        int[,] G = GenerateGeneratorMatrix(k, r, g);
        Console.WriteLine("Порождающая матрица G:");
        for (int i = 0; i < k; i++)
        {
            for (int j = 0; j < n; j++)
                Console.Write(G[i, j] + " ");
            Console.WriteLine();
        }

        ToCanonicalForm(G, k, n);

        Console.WriteLine("\nКанонический вид матрицы G:");
        for (int i = 0; i < k; i++)
        {
            for (int j = 0; j < n; j++)
                Console.Write(G[i, j] + " ");
            Console.WriteLine();
        }

        int[,] H = GenerateHMatrix(G, k, n);

        Console.WriteLine("\nПроверочная матрица H:");
        for (int i = 0; i < r; i++)
        {
            for (int j = 0; j < n; j++)
                Console.Write(H[i, j] + " ");
            Console.WriteLine();
        }

        Console.Write("\nВведите информационное слово длины " + k + ": ");
        string input = Console.ReadLine();
        int[] infoWord = input.Select(c => c - '0').ToArray();

        int[] codeword = MultiplyVectorByMatrix(infoWord, G);
        int[] redundantSymbols = codeword.Skip(k).ToArray();
        Console.WriteLine("Избыточные символы: " + string.Join("", redundantSymbols));
        Console.WriteLine("Кодовое слово Xn: " + string.Join("", codeword));

        for (int i = 0; i <= 2; i++)
        {
            AnalyzeWithErrorCount(codeword, H, i, n);
        }
    }
}

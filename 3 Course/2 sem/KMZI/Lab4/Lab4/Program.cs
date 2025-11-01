using Microsoft.VisualBasic;
using System;

namespace Lab4
{
    class FileReader
    {
        public static string ReadTextFromFile(string filePath)
        {
            try
            {
                FileInfo fileInfo = new FileInfo(filePath);
                return File.ReadAllText(filePath);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при чтении файла: {ex.Message}");
                return string.Empty;
            }

        }
        public static int[] TextToBinaryArray(string text)
        {
            List<int> binaryArray = new List<int>();

            foreach (char c in text)
            {
                int asciiValue = (int)c;
                string binaryValue = Convert.ToString(asciiValue, 2).PadLeft(8, '0');

                foreach (char bit in binaryValue)
                {
                    binaryArray.Add(int.Parse(bit.ToString())); 
                }
            }

            return binaryArray.ToArray();
        }
    }

    class Hemming
    {
        private static readonly Random random = new Random();
        public static int[,]? GenerateMatrix(int k)
        {
            Console.WriteLine("Длина информационного слова (k): " + k);
            int r = CalculateRedundantBits(k);
            Console.WriteLine("Длина избыточного слова (r): " + r);
            int n = k + r;
            Console.WriteLine("Длина кодового слова (n): " + n);
            Console.WriteLine();

            int[,] iMatrix = CreateMatr_I(r);
            Console.WriteLine();
            int[,]? pMatrix = CreateMatr_P(k, r);
            Console.WriteLine();

            if (pMatrix == null) return null;
            int[,] Matrix = ConcatenateMatrices(pMatrix, iMatrix);
            return Matrix;
        }

        private static int[,]? CreateMatr_P(int k, int r)
        {
            int totalColumns = 0;
            for (int p = 2; p <= r; p++)
            {
                totalColumns += Combinations(r, p);
            }

            Console.WriteLine($"Общее количество возможных столбцов: {totalColumns}");
            Console.WriteLine();

            if (totalColumns < k) 
            {
                Console.WriteLine("Ошибка: количество возможных столбцов меньше k");
                return null;
            }

            var allColumns = GenerateAllColumns(r);
            var selectedColumns = SelectRandomColumns(allColumns, k);
            int[,] matrix = new int[r, k];
            Console.WriteLine($"Матрица P:");
            for (int i = 0; i < r; i++)
            {
                for (int j = 0; j < k; j++)
                {
                    matrix[i, j] = selectedColumns[j][i]; 
                    Console.Write(matrix[i, j] + " ");
                }
                Console.WriteLine();
            }
            return matrix;
        }

        static int Combinations(int n, int k)
        {
            if (k > n) return 0;
            if (k == 0 || k == n) return 1;

            int result = 1;
            for (int i = 1; i <= k; i++)
            {
                result = result * (n - k + i) / i;
            }
            return result;
        }

        static List<int[]> SelectRandomColumns(List<int[]> allColumns, int k)
        {
            var random = new Random();
            return allColumns.OrderBy(x => random.Next()).Take(k).ToList();
        }

        static List<int[]> GenerateAllColumns(int r)
        {
            var columns = new List<int[]>();
            for (int p = 2; p <= r; p++)
            {
                var combinations = GenerateCombinations(r, p);
                foreach (var combination in combinations)
                {
                    int[] column = new int[r];
                    foreach (int index in combination)
                    {
                        column[index] = 1;
                    }
                    columns.Add(column);
                }
            }
            return columns;
        }


        static IEnumerable<int[]> GenerateCombinations(int n, int k)
        {
            int[] result = new int[k];
            Stack<int> stack = new Stack<int>();
            stack.Push(0);

            while (stack.Count > 0)
            {
                int index = stack.Count - 1;
                int value = stack.Pop();

                while (value < n)
                {
                    result[index++] = value++;
                    stack.Push(value);

                    if (index == k)
                    {
                        yield return result.ToArray();
                        break;
                    }
                }
            }
        }

        public static int[,] ConcatenateMatrices(int[,] matrixA, int[,] matrixB)
        {
            int rowsA = matrixA.GetLength(0);
            int colsA = matrixA.GetLength(1);
            int rowsB = matrixB.GetLength(0);
            int colsB = matrixB.GetLength(1);

            if (rowsA != rowsB)
            {
                throw new ArgumentException("Матрицы должны иметь одинаковое количество строк для горизонтального объединения.");
            }

            int[,] concatenatedMatrix = new int[rowsA, colsA + colsB];

            // Копируем элементы из matrixA
            for (int i = 0; i < rowsA; i++)
            {
                for (int j = 0; j < colsA; j++)
                {
                    concatenatedMatrix[i, j] = matrixA[i, j];
                }
            }

            // Копируем элементы из matrixB
            for (int i = 0; i < rowsA; i++)
            {
                for (int j = 0; j < colsB; j++)
                {
                    concatenatedMatrix[i, colsA + j] = matrixB[i, j];
                }
            }

            return concatenatedMatrix;
        }
        public static int[,] CreateMatr_I(int r)
        {
            if (r <= 0)
            {
                throw new ArgumentException("Размер матрицы должен быть положительным числом");
            }

            int[,] identityMatrix = new int[r, r];
            Console.WriteLine($"Диагональная матрица I:");
            for (int i = 0; i < r; i++)
            {
                for (int j = 0; j < r; j++)
                {
                    if (i == j) identityMatrix[i, j] = 1;
                    else identityMatrix[i, j] = 0;
                    Console.Write(identityMatrix[i, j] + " ");
                }
                Console.WriteLine();
            }
            return identityMatrix;
        }

        private static int CalculateRedundantBits(int k)
        {
            return (int)Math.Ceiling(Math.Log2(k + Math.Ceiling(Math.Log2(k)) + 1)); 
        }
        public static void PrintMatrix(int[,] matrix)
        {
            int rows = matrix.GetLength(0);
            int cols = matrix.GetLength(1);

            for (int i = 0; i < rows; i++)
            {
                for (int j = 0; j < cols; j++) Console.Write(matrix[i, j] + " ");
                Console.WriteLine();
            }
        }
        public static int[] SolveHamming(int[,] h, int[] knownBits, out int[] unknownBits)
        {
            int k = knownBits.Length;
            int r = CalculateRedundantBits(k);
            unknownBits = new int[r];

            if (h.GetLength(0) != r || h.GetLength(1) != r + k || knownBits.Length != k)
            {
                throw new ArgumentException("Неверные размерности матриц или вектора известных битов.");
            }

            int[] x = new int[r + k];
            for (int i = 0; i < k; i++)
            {
                x[i] = knownBits[i];
            }

            for (int i = 0; i < r; i++)
            {
                int x_ri = 0;
                for (int j = 0; j < k; j++)
                {
                    x_ri ^= h[i, j] * x[j];
                }
                unknownBits[i] = x_ri; 
                x[k + i] = x_ri;
            }

            return x;
        }
        public static void ChangeValue(int[] array)
        {
            int d = random.Next(0, array.Length + 1);
            if (array[d] == 0) array[d] = 1;
            else array[d] = 0;
        }
        public static (int[] firstPart, int[] secondPart) SplitArray(int[] array, int k)
        {
            // Проверка входных данных
            if (array == null)
            {
                throw new ArgumentNullException(nameof(array), "Входной массив не может быть null.");
            }
            if (k < 0 || k > array.Length)
            {
                throw new ArgumentOutOfRangeException(nameof(k), "Значение k должно быть неотрицательным и не больше длины массива.");
            }

            // Создаем первый подмассив
            int[] firstPart = new int[k];
            Array.Copy(array, 0, firstPart, 0, k);

            // Создаем второй подмассив
            int[] secondPart = new int[array.Length - k];
            Array.Copy(array, k, secondPart, 0, array.Length - k);

            return (firstPart, secondPart);
        }
        public static int[] XorVectors(int[] vector1, int[] vector2)
        {
            if (vector1 == null || vector2 == null)
            {
                throw new ArgumentNullException("Один или оба входных вектора равны null.");
            }
            if (vector1.Length != vector2.Length)
            {
                throw new ArgumentException("Векторы должны иметь одинаковую длину.");
            }

            int[] result = new int[vector1.Length];

            for (int i = 0; i < vector1.Length; i++)
            {
                result[i] = vector1[i] ^ vector2[i];
            }

            return result;
        }

        public static void CheckYn(int[] Yn, int k, int[,] H)
        {
            Console.WriteLine("Сообщение для декодирования (Yn):");
            foreach (var x in Yn) Console.Write(x);
            Console.WriteLine();
            Console.WriteLine();

            (int[] Yk, int[] Yr) = SplitArray(Yn, k);
            Console.WriteLine("Yk:");
            foreach (var x in Yk) Console.Write(x);
            Console.WriteLine();
            Console.WriteLine();

            Console.WriteLine("Yr:");
            foreach (var x in Yr) Console.Write(x);
            Console.WriteLine();
            Console.WriteLine();

            Console.WriteLine("Вычисляем Yr':");
            int[] Yrq;
            int[] Ynq = SolveHamming(H, Yk, out Yrq);
            foreach (var x in Yrq) Console.Write(x);
            Console.WriteLine();
            Console.WriteLine();
            int[] S = XorVectors(Yr, Yrq);
            Console.WriteLine("Синдром (S):");
            foreach (var x in S) Console.Write(x);
            Console.WriteLine();
            Console.WriteLine();

            bool isZeroVector = true;
            foreach (int element in S)
            {
                if (element != 0)
                {
                    isZeroVector = false;
                    break;
                }
            }

            if (isZeroVector)
            {
                Console.WriteLine("Синдром нулевой => ошибок нет.");
                return;
            }

            if (S.Length != H.GetLength(0))
            {
                throw new ArgumentException("Длина вектора должна быть равна количеству строк матрицы.");
            }

            for (int j = 0; j < H.GetLength(1); j++) 
            {
                bool match = true;
                for (int i = 0; i < H.GetLength(0); i++) 
                {
                    if (H[i, j] != S[i])
                    {
                        match = false;
                        break;
                    }
                }

                if (match)
                {
                    Console.WriteLine($"Найден совпадающий столбец: {j}");
                    int[] E = new int[Yn.Length];
                    for (var e = 0; e < E.Length; e++) E[e] = 0;
                    E[j] = 1;
                    Console.WriteLine();
                    Console.WriteLine($"Вектор ошибки:");
                    for (var e = 0; e < E.Length; e++) Console.Write(E[e]);
                    Console.WriteLine();
                    Console.WriteLine();
                    Console.WriteLine($"Исправленный Yn:");
                    int[] YnFIX = XorVectors(Yn, E);
                    for (var i = 0; i < YnFIX.Length; i++) Console.Write(YnFIX[i]);
                    Console.WriteLine();
                    Console.WriteLine();
                    return;
                }
            }

            Console.WriteLine("Совпадающих столбцов не найдено");

        }
    }


    class Program
    {
        static void Main()
        {
            string inputText = FileReader.ReadTextFromFile("D:\\University\\2sem\\KMZI\\Лабораторные\\Lab4\\message.txt");
            Console.WriteLine("Содержимое файла:");
            Console.WriteLine(inputText);
            Console.WriteLine();
            Console.WriteLine("В бинарном виде:");
            int[] Xk = FileReader.TextToBinaryArray(inputText);
            foreach (var x in Xk) Console.Write(x);
            Console.WriteLine();
            Console.WriteLine();

            int k = Xk.Length;
            Console.WriteLine("---Начинаем построение матрицы Хемминга---");
            Console.WriteLine();

            int[,]? H = Hemming.GenerateMatrix(k);

            if (H == null)
            {
                return;
            }

            Console.WriteLine("Матрица Хемминга(H):");
            Hemming.PrintMatrix(H);

            int[] Xr;
            int[] Xn = Hemming.SolveHamming(H, Xk, out Xr);

            Console.WriteLine();
            Console.WriteLine("Избыточное слово (Xr):");
            foreach (var x in Xr) Console.Write(x);
            Console.WriteLine();
            Console.WriteLine();

            Console.WriteLine("Закодированное сообщение (Xn):");
            foreach (var x in Xn) Console.Write(x);
            Console.WriteLine();
            Console.WriteLine();

            int[] Yn1 = new int[Xn.Length];
            int[] Yn2 = new int[Xn.Length];
            int[] Yn3 = new int[Xn.Length];

            Xn.CopyTo(Yn1, 0);
            Xn.CopyTo(Yn2, 0);
            Xn.CopyTo(Yn3, 0);

            Hemming.ChangeValue(Yn2);
            Hemming.ChangeValue(Yn3);
            Hemming.ChangeValue(Yn3);

            Console.WriteLine("--------------Декодирование сообщений-------------");
            Console.WriteLine();
            Console.WriteLine("1. Без ошибок");
            Hemming.CheckYn(Yn1, k, H);
            Console.WriteLine();
            Console.WriteLine("2. С 1 ошибкой");
            Hemming.CheckYn(Yn2, k, H);
            Console.WriteLine();
            Console.WriteLine("3. С 2 ошибками");
            Hemming.CheckYn(Yn3, k, H);


        }
    }
}

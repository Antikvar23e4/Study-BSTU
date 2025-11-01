using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

public static class PrintUtils
{
    public static string FormatBinaryVector(IEnumerable<int> vector)
    {
        return string.Join("", vector);
    }

    public static void PrintVector(IEnumerable<int> vector, string label)
    {
        Console.WriteLine($"{label}: {FormatBinaryVector(vector)}");
    }

    public static void PrintMatrix(int[,] matrix, string label)
    {
        Console.WriteLine($"{label}:");
        int rows = matrix.GetLength(0);
        int cols = matrix.GetLength(1);
        for (int i = 0; i < rows; i++)
        {
            for (int j = 0; j < cols; j++)
            {
                Console.Write(matrix[i, j]);
                if (j < cols - 1) Console.Write(" ");
            }
            Console.WriteLine();
        }
    }

    public static void PrintMatrix(int[,,] matrix, string label)
    {
        Console.WriteLine($"{label}:");
        int dim1 = matrix.GetLength(0); // k1
        int dim2 = matrix.GetLength(1); // k2
        int dim3 = matrix.GetLength(2); // z
        for (int k = 0; k < dim3; k++)
        {
            Console.WriteLine($"  Layer {k}:");
            for (int i = 0; i < dim1; i++)
            {
                for (int j = 0; j < dim2; j++)
                {
                    Console.Write(matrix[i, j, k]);
                    if (j < dim2 - 1) Console.Write(", ");
                }
                Console.WriteLine();
            }
        }
    }
}

public class IterativeCode 
{
    public int k1 { get; } 
    public int k2 { get; } 
    public int? z { get; } 
    public int NumParityGroups { get; }
    public int k { get; } 
    public int r { get; private set; } 
    public int n { get; private set; } 

    private int[] _informationWord; // Xk
    private int[] _codewordXn;      // Xn
    private int[] _receivedWordYn;    // Yn
    private int[] _correctedWordYnPrime; //Yn'

    private int[,] _matrix2D;
    private int[,,] _matrix3D;

    private int[] _parityGroup1; // Row parity
    private int[] _parityGroup2; // Column parity
    private int[] _parityGroup3; // Depth parity (for 3D)
    private int[] _parityGroup4; // e.g., Overall parity (for Variant 3)

    private readonly Random _random = new Random();
    private const int MAX_DECODING_ITERATIONS = 10; 

    public IterativeCode(int k1, int k2, int? z, int numParityGroups)
    {
        this.k1 = k1;
        this.k2 = k2;
        this.z = z;
        NumParityGroups = numParityGroups;

        if (this.z.HasValue)
        {
            k = this.k1 * this.k2 * this.z.Value;
            _matrix3D = new int[this.k1, this.k2, this.z.Value];
        }
        else
        {
            k = this.k1 * this.k2;
            _matrix2D = new int[this.k1, this.k2];
        }
        // Вычисляет количество проверочных битов R
        CalculateRedundancy();
        n = k + r;
    }

    private void CalculateRedundancy()
    // Основная задача этого метода — вычислить общее количество проверочных (избыточных) битов
    {

        r = 0;
        if (!z.HasValue) 
        {
            if (NumParityGroups >= 1) r += k1;
            if (NumParityGroups >= 2) r += k2; 
        }
        else 
        {
            if (NumParityGroups >= 1) r += k2 * z.Value; 
            if (NumParityGroups >= 2) r += k1 * z.Value;
            if (NumParityGroups >= 3) r += k1 * k2;     
            if (NumParityGroups >= 4) r += 1;
        }
    }

    public int[] Encode(int[] informationWord)
    {
        if (informationWord == null || informationWord.Length != k)
        {
            throw new ArgumentException($"Информационное слово должно иметь длину {k}.");
        }
        _informationWord = (int[])informationWord.Clone();

        FillMatrix(_informationWord);
        CalculateParityBits();
        FormCodewordXn();

        return (int[])_codewordXn.Clone();
    }

    private void FillMatrix(int[] data)
    {
        int index = 0;
        if (_matrix2D != null)
        {
            for (int i = 0; i < k1; i++)
            {
                for (int j = 0; j < k2; j++)
                {
                    _matrix2D[i, j] = data[index++];
                }
            }
        }
        else // 3D
        {
            for (int k = 0; k < z.Value; k++) // z
            {
                for (int i = 0; i < k1; i++)  // k1
                {
                    for (int j = 0; j < k2; j++) // k2
                    {
                        _matrix3D[i, j, k] = data[index++];
                    }
                }
            }
        }
    }

    private int CalculateParity(IEnumerable<int> bits)
    {
        return bits.Aggregate(0, (acc, bit) => acc ^ bit); // XOR sum
    }
    private void CalculateParityBits()
    {
        if (_matrix2D != null) // 2D Case
        {
            //  Row Parity
            _parityGroup1 = new int[k1];
            for (int i = 0; i < k1; i++)
            {
                int[] row = Enumerable.Range(0, k2).Select(j => _matrix2D[i, j]).ToArray();
                _parityGroup1[i] = CalculateParity(row);
            }
            //Column Parity
            _parityGroup2 = new int[k2];
            for (int j = 0; j < k2; j++)
            {
                int[] col = Enumerable.Range(0, k1).Select(i => _matrix2D[i, j]).ToArray();
                _parityGroup2[j] = CalculateParity(col);
            }
            _parityGroup3 = null; 
            _parityGroup4 = null; 
        }
        else // 3D Case 
        {
            //Parity along k1
            _parityGroup1 = new int[k2 * z.Value];
            int p1Idx = 0;
            for (int k = 0; k < z.Value; k++)
            {
                for (int j = 0; j < k2; j++)
                {
                    _parityGroup1[p1Idx++] = CalculateParity(Enumerable.Range(0, k1).Select(i => _matrix3D[i, j, k]));
                }
            }
            //Parity along k2 
            _parityGroup2 = new int[k1 * z.Value];
            int p2Idx = 0;
            for (int k = 0; k < z.Value; k++)
            {
                for (int i = 0; i < k1; i++)
                {
                    _parityGroup2[p2Idx++] = CalculateParity(Enumerable.Range(0, k2).Select(j => _matrix3D[i, j, k]));
                }
            }
            // Parity along z 
            _parityGroup3 = new int[k1 * k2];
            int p3Idx = 0;
            for (int i = 0; i < k1; i++)
            {
                for (int j = 0; j < k2; j++)
                {
                    _parityGroup3[p3Idx++] = CalculateParity(Enumerable.Range(0, z.Value).Select(k => _matrix3D[i, j, k]));
                }
            }
            //Overall parity of information bits
            _parityGroup4 = new int[1];
            _parityGroup4[0] = CalculateParity(_informationWord);
        }
    }
    private void FormCodewordXn() // Формирует полное кодовое слово
    {
        var codewordList = new List<int>(_informationWord); // Start with Xk
        if (_parityGroup1 != null) codewordList.AddRange(_parityGroup1);
        if (_parityGroup2 != null) codewordList.AddRange(_parityGroup2);
        if (_parityGroup3 != null) codewordList.AddRange(_parityGroup3);
        if (_parityGroup4 != null) codewordList.AddRange(_parityGroup4);
        _codewordXn = codewordList.ToArray();

        if (_codewordXn.Length != n)
        {
            Console.WriteLine($"Длина кодового слова ({_codewordXn.Length}) не совпадает с ожидаемым n ({n}). r = {r}");

            n = _codewordXn.Length;
        }
    }
    public int[] IntroduceErrors(int errorCount)
    {
        if (_codewordXn == null)
        {
            throw new InvalidOperationException("Кодирование должно быть выполнено до генерации ошибок.");

        }
        if (errorCount < 0) errorCount = 0;
        if (errorCount > n) errorCount = n;

        _receivedWordYn = (int[])_codewordXn.Clone(); 

        if (errorCount == 0) return (int[])_receivedWordYn.Clone();

        var indicesToFlip = new HashSet<int>();
        while (indicesToFlip.Count < errorCount)
        {
            indicesToFlip.Add(_random.Next(n)); 
        }

        foreach (int index in indicesToFlip)
        {
            _receivedWordYn[index] = 1 - _receivedWordYn[index]; 
        }

        return (int[])_receivedWordYn.Clone();
    }
    public int[] Decode()
    {
        if (_receivedWordYn == null)
        {
            throw new InvalidOperationException("Ошибки должны быть сгенерированы (или Yn не инициализировано) до декодирования.");

        }

        _correctedWordYnPrime = (int[])_receivedWordYn.Clone(); 

        int[,] currentMatrix2D = null;
        int[,,] currentMatrix3D = null;

        int[] currentData = _correctedWordYnPrime.Take(k).ToArray();
        int[] receivedP1 = _correctedWordYnPrime.Skip(k).Take(_parityGroup1?.Length ?? 0).ToArray();
        int[] receivedP2 = _correctedWordYnPrime.Skip(k + (_parityGroup1?.Length ?? 0)).Take(_parityGroup2?.Length ?? 0).ToArray();
        int[] receivedP3 = _correctedWordYnPrime.Skip(k + (_parityGroup1?.Length ?? 0) + (_parityGroup2?.Length ?? 0)).Take(_parityGroup3?.Length ?? 0).ToArray();
        int[] receivedP4 = _correctedWordYnPrime.Skip(k + (_parityGroup1?.Length ?? 0) + (_parityGroup2?.Length ?? 0) + (_parityGroup3?.Length ?? 0)).Take(_parityGroup4?.Length ?? 0).ToArray();

        if (!z.HasValue)
        {
            currentMatrix2D = new int[k1, k2];
            FillMatrix2DFromData(currentData, currentMatrix2D);
        }
        else
        {
            currentMatrix3D = new int[k1, k2, z.Value];
            FillMatrix3DFromData(currentData, currentMatrix3D);
        }

        for (int iter = 0; iter < MAX_DECODING_ITERATIONS; iter++)
        {
            bool correctionMade = false;

            int[] syndrome1 = null, syndrome2 = null, syndrome3 = null, syndrome4 = null;
            if (!z.HasValue) 
            {
                syndrome1 = CalculateSyndrome2D(currentMatrix2D, receivedP1, 1); // Row Syndrome
                syndrome2 = CalculateSyndrome2D(currentMatrix2D, receivedP2, 2); // Col Syndrome
            }
            else 
            {
                syndrome1 = CalculateSyndrome3D(currentMatrix3D, receivedP1, 1); // k1 dir
                syndrome2 = CalculateSyndrome3D(currentMatrix3D, receivedP2, 2); // k2 dir
                syndrome3 = CalculateSyndrome3D(currentMatrix3D, receivedP3, 3); // z dir
                syndrome4 = CalculateSyndrome3D(currentMatrix3D, receivedP4, 4); // overall
            }
            // Check for convergence: If all syndromes are 0
            bool allZero = (syndrome1?.All(s => s == 0) ?? true) && (syndrome2?.All(s => s == 0) ?? true) &&  (syndrome3?.All(s => s == 0) ?? true) && (syndrome4?.All(s => s == 0) ?? true);
            if (allZero)
            {
                break; 
            }

            if (!z.HasValue && currentMatrix2D != null) // 2D Correction
            {
                for (int i = 0; i < k1; i++)
                {
                    for (int j = 0; j < k2; j++)
                    {
                        int failingChecks = 0;
                        if (syndrome1 != null && syndrome1[i] == 1) failingChecks++; // Row check fails
                        if (syndrome2 != null && syndrome2[j] == 1) failingChecks++; // Column check fails

                        if (failingChecks >= 2) // Simple: Requires agreement of >=2 checks
                        {
                            currentMatrix2D[i, j] = 1 - currentMatrix2D[i, j];
                            correctionMade = true;
                        }
                    }
                }
            }
            else if (z.HasValue && currentMatrix3D != null) // 3D Correction (Variant 3 logic)
            {
                for (int i = 0; i < k1; i++)
                {
                    for (int j = 0; j < k2; j++)
                    {
                        for (int k = 0; k < z.Value; k++)
                        {

                            int failingChecks = 0;
                            if (syndrome1 != null && syndrome1[k * k2 + j] == 1) failingChecks++;
                            if (syndrome2 != null && syndrome2[k * k1 + i] == 1) failingChecks++;
                            if (syndrome3 != null && syndrome3[i * k2 + j] == 1) failingChecks++;
                            if (failingChecks >= 2)
                            {
                                currentMatrix3D[i, j, k] = 1 - currentMatrix3D[i, j, k];
                                correctionMade = true;
                            }
                        }
                    }
                }
            }

            if (!correctionMade && !allZero)
            {
                break; 
            }
            if (iter == MAX_DECODING_ITERATIONS - 1 && !allZero)
            {
            }
        } 

        if (!z.HasValue)
        {
            CalculateParityBitsFromMatrix(currentMatrix2D); 
            currentData = FlattenMatrix(currentMatrix2D);
        }
        else
        {
            CalculateParityBitsFromMatrix(currentMatrix3D);
            currentData = FlattenMatrix(currentMatrix3D);
        }

        var correctedList = new List<int>(currentData);
        if (_parityGroup1 != null) correctedList.AddRange(_parityGroup1);
        if (_parityGroup2 != null) correctedList.AddRange(_parityGroup2);
        if (_parityGroup3 != null) correctedList.AddRange(_parityGroup3);
        if (_parityGroup4 != null) correctedList.AddRange(_parityGroup4);
        _correctedWordYnPrime = correctedList.ToArray();

        return (int[])_correctedWordYnPrime.Clone();
    }

    private void FillMatrix2DFromData(int[] data, int[,] matrix)
    {
        int index = 0;
        for (int i = 0; i < k1; i++)
            for (int j = 0; j < k2; j++)
                matrix[i, j] = data[index++];
    }

    private void FillMatrix3DFromData(int[] data, int[,,] matrix)
    {
        int index = 0;
        for (int k = 0; k < z.Value; k++)
            for (int i = 0; i < k1; i++)
                for (int j = 0; j < k2; j++)
                    matrix[i, j, k] = data[index++];
    }

    private int[] FlattenMatrix(int[,] matrix)
    {
        int[] data = new int[k];
        int index = 0;
        for (int i = 0; i < k1; i++)
            for (int j = 0; j < k2; j++)
                data[index++] = matrix[i, j];
        return data;
    }

    private int[] FlattenMatrix(int[,,] matrix)
    {
        int[] data = new int[k];
        int index = 0;
        for (int k = 0; k < z.Value; k++)
            for (int i = 0; i < k1; i++)
                for (int j = 0; j < k2; j++)
                    data[index++] = matrix[i, j, k];
        return data;
    }

    private int[] CalculateSyndrome2D(int[,] matrix, int[] receivedParity, int groupIndex)
    {
        if (receivedParity == null) return new int[0];

        int[] calculatedParity;
        int[] syndrome = new int[receivedParity.Length];

        if (groupIndex == 1) // Row Parity Syndrome
        {
            calculatedParity = new int[k1];
            for (int i = 0; i < k1; i++)
            {
                calculatedParity[i] = CalculateParity(Enumerable.Range(0, k2).Select(j => matrix[i, j]));
                syndrome[i] = calculatedParity[i] ^ receivedParity[i];
            }
        }
        else if (groupIndex == 2) // Column Parity Syndrome
        {
            calculatedParity = new int[k2];
            for (int j = 0; j < k2; j++)
            {
                calculatedParity[j] = CalculateParity(Enumerable.Range(0, k1).Select(i => matrix[i, j]));
                syndrome[j] = calculatedParity[j] ^ receivedParity[j];
            }
        }
        else
        {
            return new int[0]; // Invalid group index for 2D
        }
        return syndrome;
    }

    private int[] CalculateSyndrome3D(int[,,] matrix, int[] receivedParity, int groupIndex)
    {
        if (receivedParity == null) return new int[0];

        int[] calculatedParity;
        int[] syndrome = new int[receivedParity.Length];

        switch (groupIndex)
        {
            case 1: // k1 direction parity
                calculatedParity = new int[k2 * z.Value];
                int p1Idx = 0;
                for (int k = 0; k < z.Value; k++)
                {
                    for (int j = 0; j < k2; j++)
                    {
                        calculatedParity[p1Idx] = CalculateParity(Enumerable.Range(0, k1).Select(i => matrix[i, j, k]));
                        syndrome[p1Idx] = calculatedParity[p1Idx] ^ receivedParity[p1Idx];
                        p1Idx++;
                    }
                }
                break;
            case 2: // k2 direction parity
                calculatedParity = new int[k1 * z.Value];
                int p2Idx = 0;
                for (int k = 0; k < z.Value; k++)
                {
                    for (int i = 0; i < k1; i++)
                    {
                        calculatedParity[p2Idx] = CalculateParity(Enumerable.Range(0, k2).Select(j => matrix[i, j, k]));
                        syndrome[p2Idx] = calculatedParity[p2Idx] ^ receivedParity[p2Idx];
                        p2Idx++;
                    }
                }
                break;
            case 3: // z direction parity
                calculatedParity = new int[k1 * k2];
                int p3Idx = 0;
                for (int i = 0; i < k1; i++)
                {
                    for (int j = 0; j < k2; j++)
                    {
                        calculatedParity[p3Idx] = CalculateParity(Enumerable.Range(0, z.Value).Select(k => matrix[i, j, k]));
                        syndrome[p3Idx] = calculatedParity[p3Idx] ^ receivedParity[p3Idx];
                        p3Idx++;
                    }
                }
                break;
            case 4: // overall info parity
                calculatedParity = new int[1];
                int[] currentData = FlattenMatrix(matrix);
                calculatedParity[0] = CalculateParity(currentData);
                syndrome[0] = calculatedParity[0] ^ receivedParity[0];
                break;
            default:
                return new int[0]; 
        }
        return syndrome;
    }

    private void CalculateParityBitsFromMatrix(int[,] matrix)
    {
        if (NumParityGroups >= 1)
        {
            _parityGroup1 = new int[k1];
            for (int i = 0; i < k1; i++)
                _parityGroup1[i] = CalculateParity(Enumerable.Range(0, k2).Select(j => matrix[i, j]));
        }
        if (NumParityGroups >= 2)
        {
            _parityGroup2 = new int[k2];
            for (int j = 0; j < k2; j++)
                _parityGroup2[j] = CalculateParity(Enumerable.Range(0, k1).Select(i => matrix[i, j]));
        }
        _parityGroup3 = null;
        _parityGroup4 = null;
    }

    private void CalculateParityBitsFromMatrix(int[,,] matrix)
    {
        if (NumParityGroups >= 1)
        {
            _parityGroup1 = new int[k2 * z.Value];
            int p1Idx = 0;
            for (int k = 0; k < z.Value; k++)
                for (int j = 0; j < k2; j++)
                    _parityGroup1[p1Idx++] = CalculateParity(Enumerable.Range(0, k1).Select(i => matrix[i, j, k]));
        }
        if (NumParityGroups >= 2)
        {
            _parityGroup2 = new int[k1 * z.Value];
            int p2Idx = 0;
            for (int k = 0; k < z.Value; k++)
                for (int i = 0; i < k1; i++)
                    _parityGroup2[p2Idx++] = CalculateParity(Enumerable.Range(0, k2).Select(j => matrix[i, j, k]));
        }
        if (NumParityGroups >= 3)
        {
            _parityGroup3 = new int[k1 * k2];
            int p3Idx = 0;
            for (int i = 0; i < k1; i++)
                for (int j = 0; j < k2; j++)
                    _parityGroup3[p3Idx++] = CalculateParity(Enumerable.Range(0, z.Value).Select(k => matrix[i, j, k]));
        }
        if (NumParityGroups >= 4)
        {
            _parityGroup4 = new int[1];
            int[] currentData = FlattenMatrix(matrix); 
            _parityGroup4[0] = CalculateParity(currentData);
        }
    }

    public bool AnalyzeCorrection()
    {
        if (_codewordXn == null || _correctedWordYnPrime == null)
        {
            return false;
        }
        if (_codewordXn.Length != _correctedWordYnPrime.Length)
        {
            return false; 
        }
        return _codewordXn.SequenceEqual(_correctedWordYnPrime);
    }

    public int[] GetInformationWord() => (int[])_informationWord?.Clone();
    public int[] GetCodewordXn() => (int[])_codewordXn?.Clone();
    public int[] GetReceivedWordYn() => (int[])_receivedWordYn?.Clone();
    public int[] GetCorrectedWordYnPrime() => (int[])_correctedWordYnPrime?.Clone();
    public int[,] GetMatrix2D() => (int[,])_matrix2D?.Clone();
    public int[,,] GetMatrix3D() => (int[,,])_matrix3D?.Clone();
    public int[] GetParityGroup(int groupNum)
    {
        switch (groupNum)
        {
            case 1: return (int[])_parityGroup1?.Clone();
            case 2: return (int[])_parityGroup2?.Clone();
            case 3: return (int[])_parityGroup3?.Clone();
            case 4: return (int[])_parityGroup4?.Clone();
            default: return null;
        }
    }
}

class Program
{
    static readonly Random GlobalRandom = new Random();
    static int[] GenerateRandomBinaryWord(int length)
    {
        int[] word = new int[length];
        for (int i = 0; i < length; i++)
        {
            word[i] = GlobalRandom.Next(2);
        }
        return word;
    }

    static void FindMistakes(IterativeCode coder, int errorCount)
    {
        Console.WriteLine($"\n-------------------------------------------------------");
        Console.WriteLine($"Количество ошибок = {errorCount}");

        int[] infoWord = GenerateRandomBinaryWord(coder.k);
        PrintUtils.PrintVector(infoWord, "Xk");

        int[] xn = coder.Encode(infoWord);
        PrintUtils.PrintVector(xn, "Xn");

        if (coder.z == null)
            PrintUtils.PrintMatrix(coder.GetMatrix2D(), "Матрица данных");
        else
            PrintUtils.PrintMatrix(coder.GetMatrix3D(), "Матрица данных");

        PrintUtils.PrintVector(coder.GetParityGroup(1), "Паритет 1");
        PrintUtils.PrintVector(coder.GetParityGroup(2), "Паритет 2");

        if (coder.z != null)
        {
            PrintUtils.PrintVector(coder.GetParityGroup(3), "Паритет 3");
            PrintUtils.PrintVector(coder.GetParityGroup(4), "Паритет 4");
        }

        int[] yn = coder.IntroduceErrors(errorCount);
        PrintUtils.PrintVector(yn, "Yn: ");

        List<int> errorPositions = new List<int>();
        for (int i = 0; i < xn.Length; i++)
        {
            if (xn[i] != yn[i]) errorPositions.Add(i);
        }
        Console.WriteLine($"Ошибки сгенерированы в позициях: {string.Join(", ", errorPositions)}\n");

        int[] ynPrime = coder.Decode();
        PrintUtils.PrintVector(ynPrime, "Yn'");

        bool success = coder.AnalyzeCorrection();
        if (success)
        {
            Console.WriteLine("\nОшибок больше нет.");
        }
        else
        {
            Console.WriteLine("\nИсправление не удалось.");
            Console.WriteLine("\nСравнение:");
            Console.WriteLine($"Xn:  {PrintUtils.FormatBinaryVector(xn)}");
            Console.WriteLine($"Yn' {PrintUtils.FormatBinaryVector(ynPrime)}");
            List<int> remainingErrorPositions = new List<int>();
            for (int i = 0; i < xn.Length; i++)
            {
                if (xn[i] != ynPrime[i]) remainingErrorPositions.Add(i);
            }
            Console.WriteLine($" Ошибки на позициях: {string.Join(", ", remainingErrorPositions)}");
        }
    }

    static void RunAnalysis(IterativeCode coder, int errorMultiplicity, int numTrials)
    {
        Console.WriteLine($"\n--------------------------------------------");
        Console.WriteLine($"Ошибки = {errorMultiplicity}, Количество попыток = {numTrials}");

        if (numTrials <= 0) return;

        int correctedCount = 0;
        int[] infoWord = GenerateRandomBinaryWord(coder.k);
        int[] xn = coder.Encode(infoWord);

        for (int i = 0; i < numTrials; i++)
        {
            coder.IntroduceErrors(errorMultiplicity); // Генерация Yn
            coder.Decode(); // Генерация Yn'
            if (coder.AnalyzeCorrection()) // Сравнение Xn и Yn'
            {
                correctedCount++;
            }

            if ((i + 1) % (numTrials / 10 == 0 ? numTrials / 10 + 1 : numTrials / 10) == 0)
            { // Индикатор прогресса
            }
        }

        double correctionRate = (double)correctedCount / numTrials;

        Console.WriteLine($"\nС {errorMultiplicity} ошибок:");
        Console.WriteLine($"Общее количество испытаний (N1): {numTrials}");
        Console.WriteLine($"Количество успешно исправленных (N3): {correctedCount}");
        Console.WriteLine($"Коэффициент исправлений (N3/N1): {correctionRate:P2}");
    }

    static void Main(string[] args)
    {
        Console.OutputEncoding = Encoding.UTF8;

        var variants = new (int k1, int k2, int? z, int numParityGroups)[]
        {
            (5, 8, null, 2), 
            (4, 10, null, 2),  
            (5, 4, 2, 4),
            (2, 10, 2, 4),  
        };

        foreach (var (k1, k2, z, numParityGroups) in variants)
        {
            IterativeCode coder = new IterativeCode(k1, k2, z, numParityGroups);
            Console.WriteLine();
            Console.WriteLine($"\n══════════════════════════════════════════════════════════════");
            Console.WriteLine($"\nВыполнение задания с: k1={k1}, k2={k2}, z={z}, {numParityGroups} паритетами");
            Console.WriteLine($"\n══════════════════════════════════════════════════════════════");

            for (int errorCount = 0; errorCount <= 2; errorCount++)
            {
                FindMistakes(coder, errorCount);
            }

            int trials = 5; 
            RunAnalysis(coder, 0, trials);
            RunAnalysis(coder, 1, trials);
            RunAnalysis(coder, 2, trials);
        }
    }
}
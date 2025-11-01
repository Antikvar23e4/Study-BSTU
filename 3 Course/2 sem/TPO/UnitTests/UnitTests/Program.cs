using System;
using UnitTests;

class Program
{
    static void Main()
    {
        IMathService mathService = new MathService(); 
        Calculator calc = new Calculator(mathService);

        while (true)
        {
            Console.WriteLine("Введите первое число (или 'exit' для выхода):");
            string inputA = Console.ReadLine();
            if (inputA.ToLower() == "exit") break;

            Console.WriteLine("Введите второе число:");
            string inputB = Console.ReadLine();

            if (!int.TryParse(inputA, out int a) || !int.TryParse(inputB, out int b))
            {
                Console.WriteLine("Ошибка: введите корректные числа.");
                continue;
            }

            Console.WriteLine("Выберите операцию: +, -, *, /");
            string op = Console.ReadLine();

            try
            {
                double result = op switch
                {
                    "+" => calc.Add(a, b),
                    "-" => calc.Subtract(a, b),
                    "*" => calc.Multiply(a, b),
                    "/" => calc.Divide(a, b),
                    _ => throw new InvalidOperationException("Неизвестная операция")
                };
                Console.WriteLine($"Результат: {result}\n");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка: {ex.Message}\n");
            }
        }
    }
}

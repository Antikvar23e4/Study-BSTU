using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace UnitTests
{
    public interface IMathService
    {
        int Add(int a, int b);
        int Subtract(int a, int b);
        int Multiply(int a, int b);
        double Divide(int a, int b);
    }

    public class Calculator
    {
        private readonly IMathService _mathService;

        public Calculator(IMathService mathService)
        {
            _mathService = mathService;
        }

        public int Add(int a, int b) => _mathService.Add(a, b);
        public int Subtract(int a, int b) => _mathService.Subtract(a, b);
        public int Multiply(int a, int b) => _mathService.Multiply(a, b);
        public double Divide(int a, int b) => _mathService.Divide(a, b);
    }
    public class MathService : IMathService
    {
        public int Add(int a, int b) => a + b;
        public int Subtract(int a, int b) => a - b;
        public int Multiply(int a, int b) => a * b;

        public double Divide(int a, int b)
        {
            if (b == 0)
                throw new DivideByZeroException("Деление на ноль невозможно");
            return (double)a / b;
        }
    }

}

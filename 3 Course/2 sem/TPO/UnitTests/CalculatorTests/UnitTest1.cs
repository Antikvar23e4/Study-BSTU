using Moq;
using NUnit.Framework;
using UnitTests;

namespace CalculatorTests
{
    [TestFixture]
    public class CalculatorTests
    {
        private Calculator calc;
        private Mock<IMathService> mockMathService; //мок который будет замен€ть наш интерфейс

        [SetUp]
        public void Setup()
        {
            mockMathService = new Mock<IMathService>(); //создаем экземпл€р мока

            // настраиваем моки, чтобы они возвращали ожидаемые значени€
            mockMathService.Setup(m => m.Add(2, 3)).Returns(5);
            mockMathService.Setup(m => m.Subtract(4, 3)).Returns(1);
            mockMathService.Setup(m => m.Multiply(2, 3)).Returns(6);
            mockMathService.Setup(m => m.Divide(5, 2)).Returns(2.5);
            mockMathService.Setup(m => m.Divide(5, 1)).Returns(5);
            mockMathService.Setup(m => m.Divide(-5, 2)).Returns(-2.5);
            mockMathService.Setup(m => m.Divide(5, 0)).Throws(new DivideByZeroException("ƒеление на ноль невозможно"));
            mockMathService.Setup(m => m.Add(-2, -3)).Returns(-5);
            mockMathService.Setup(m => m.Subtract(-2, -3)).Returns(1);
            mockMathService.Setup(m => m.Multiply(-2, -3)).Returns(6);
            mockMathService.Setup(m => m.Add(0, 3)).Returns(3);
            mockMathService.Setup(m => m.Add(3, 0)).Returns(3);

            //передаем мок в калькул€тор
            calc = new Calculator(mockMathService.Object);
        }

        [Test]
        public void AddTest()
        {
            Assert.AreEqual(5, calc.Add(2, 3)); //провер€ем метод
            mockMathService.Verify(m => m.Add(2, 3), Times.Once);//провер€ем что он вызвалс€ 1 раз(он может не вызватьс€ не раз и тест будет считаьс€ пройденным, чтобы избежать этого)
        }

        [Test]
        public void SubtractTest()
        {
            Assert.AreEqual(1, calc.Subtract(4, 3));
            mockMathService.Verify(m => m.Subtract(4, 3), Times.Once);
        }

        [Test]
        public void MultiplyTest()
        {
            Assert.AreEqual(6, calc.Multiply(2, 3));
            mockMathService.Verify(m => m.Multiply(2, 3), Times.Once);
        }

        [Test]
        public void DivideTest()
        {
            Assert.AreEqual(2.5, calc.Divide(5, 2));
            mockMathService.Verify(m => m.Divide(5, 2), Times.Once);
        }

        [Test]
        public void DivideByZeroTest()
        {
            Assert.Throws<DivideByZeroException>(() => calc.Divide(5, 0));
            mockMathService.Verify(m => m.Divide(5, 0), Times.Once);
        }

        [Test]
        public void AddNegativeNumbersTest()
        {
            Assert.AreEqual(-5, calc.Add(-2, -3));
            mockMathService.Verify(m => m.Add(-2, -3), Times.Once);
        }

        [Test]
        public void SubtractNegativeNumbersTest()
        {
            Assert.AreEqual(1, calc.Subtract(-2, -3));
            mockMathService.Verify(m => m.Subtract(-2, -3), Times.Once);
        }

        [Test]
        public void MultiplyNegativeNumbersTest()
        {
            Assert.AreEqual(6, calc.Multiply(-2, -3));
            mockMathService.Verify(m => m.Multiply(-2, -3), Times.Once);
        }

        [Test]
        public void DivideNegativeNumbersTest()
        {
            Assert.AreEqual(-2.5, calc.Divide(-5, 2));
            mockMathService.Verify(m => m.Divide(-5, 2), Times.Once);
        }

        [Test]
        public void DivideByOneTest()
        {
            Assert.AreEqual(5, calc.Divide(5, 1));
            mockMathService.Verify(m => m.Divide(5, 1), Times.Once);
        }

        [Test]
        public void AddZeroTest()
        {
            Assert.AreEqual(3, calc.Add(0, 3));
            Assert.AreEqual(3, calc.Add(3, 0));
            mockMathService.Verify(m => m.Add(0, 3), Times.Once);
            mockMathService.Verify(m => m.Add(3, 0), Times.Once);
        }
    }
}

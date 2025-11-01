from selenium.common import TimeoutException, NoSuchElementException
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

class BasePage:

    DEFAULT_WAIT_TIME = 10

    def __init__(self, driver: WebDriver, url: str):
        #Конструктор класса.
        self.driver = driver
        self.url = url
        self.wait = WebDriverWait(self.driver, self.DEFAULT_WAIT_TIME)

    def open(self):
        print(f"Открываем URL: {self.url}")
        self.driver.get(self.url)

    def find_element(self, locator: tuple, time: int = DEFAULT_WAIT_TIME) -> WebElement:
        try:
            element = self.wait.until(
                EC.visibility_of_element_located(locator),
                message=f"Не найден элемент {locator} за {time} сек."
            )
            return element
        except TimeoutException:
            print(f"ОШИБКА: Элемент не найден  {locator} за {time} секунд.")
            raise NoSuchElementException(f"Элемент не найден: {locator}")

    def find_elements(self, locator: tuple, time: int = DEFAULT_WAIT_TIME) -> list[WebElement]:
        try:
            elements = self.wait.until(
                EC.presence_of_all_elements_located(locator),
                message=f"Не найдены элементы {locator} за {time} сек."
            )
            return elements
        except TimeoutException:
            print(f"ОШИБКА: Элементы не найдены по локатору {locator} за {time} секунд.")
            return []

    def click_element(self, locator: tuple, time: int = DEFAULT_WAIT_TIME):
        try:
            element = self.wait.until(
                EC.element_to_be_clickable(locator),
                message=f"Элемент {locator} не кликабелен за {time} сек."
            )
            element.click()
        except TimeoutException:
            print(f"ОШИБКА: Элемент не стал кликабельным {locator} за {time} секунд.")
            raise NoSuchElementException(f"Элемент не кликабелен: {locator}")

    def get_text(self, locator: tuple, time: int = DEFAULT_WAIT_TIME) -> str:
        element = self.find_element(locator, time)
        text = element.text
        return text

    def send_keys(self, locator: tuple, text: str, time: int = DEFAULT_WAIT_TIME):
        element = self.find_element(locator, time)
        element.clear()
        element.send_keys(text)

    def get_current_url(self) -> str:
        url = self.driver.current_url
        return url

    def is_element_present(self, locator: tuple, time: int = 2) -> bool:
        try:
            WebDriverWait(self.driver, time).until(EC.presence_of_element_located(locator))
            return True
        except TimeoutException:
            return False

    def take_screenshot(self, filename: str = "screenshot.png"):
        try:
            directory = os.path.dirname(filename)
            if directory and not os.path.exists(directory):
                os.makedirs(directory)

            self.driver.save_screenshot(filename)
            print(f"[СКРИНШОТ СОХРАНЕН]: {filename}")
        except Exception as e:
            print(f"ОШИБКА при ручном сохранении скриншота {filename}: {e}")
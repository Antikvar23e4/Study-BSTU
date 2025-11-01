from selenium.webdriver.common.by import By
from .base_page import BasePage
from .inventory_page import InventoryPage

class Locators:
    USER_NAME_INPUT = (By.ID, "user-name")
    PASSWORD_INPUT = (By.ID, "password")
    LOGIN_BUTTON = (By.ID, "login-button")
    ERROR_MESSAGE_CONTAINER = (By.CSS_SELECTOR, "h3[data-test='error']")

class LoginPage(BasePage):

    def login(self, username, password) -> InventoryPage: # метод вернет InventoryPage
        print(f"Логинимся с пользователем: {username}")
        self.send_keys(Locators.USER_NAME_INPUT, username)
        self.send_keys(Locators.PASSWORD_INPUT, password)
        self.click_element(Locators.LOGIN_BUTTON)
        print("Кликнули по кнопке Login")
        return InventoryPage(self.driver, self.driver.current_url)

    def get_error_message(self) -> str:
        if self.is_element_present(Locators.ERROR_MESSAGE_CONTAINER):
             error_text = self.get_text(Locators.ERROR_MESSAGE_CONTAINER)
             print(f"Найдено сообщение об ошибке: '{error_text}'")
             return error_text
        print("Сообщение об ошибке не найдено.")
        return ""
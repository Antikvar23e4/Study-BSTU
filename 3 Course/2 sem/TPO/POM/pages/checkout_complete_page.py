from selenium.webdriver.common.by import By
from .base_page import BasePage

class Locators:
    #Локаторы для страницы завершения заказа.
    PAGE_TITLE = (By.CSS_SELECTOR, ".title")
    COMPLETE_HEADER = (By.CSS_SELECTOR, ".complete-header")

class CheckoutCompletePage(BasePage):

    def get_title(self) -> str:
        return self.get_text(Locators.PAGE_TITLE)

    def get_confirmation_message(self) -> str:
        return self.get_text(Locators.COMPLETE_HEADER)
from selenium.webdriver.common.by import By
from .base_page import BasePage
from .checkout_step_two_page import CheckoutStepTwoPage

class Locators:
    PAGE_TITLE = (By.CSS_SELECTOR, ".title")
    FIRST_NAME_INPUT = (By.ID, "first-name")
    LAST_NAME_INPUT = (By.ID, "last-name")
    ZIP_CODE_INPUT = (By.ID, "postal-code")
    CONTINUE_BUTTON = (By.ID, "continue")

class CheckoutStepOnePage(BasePage):

    def get_title(self) -> str:
        return self.get_text(Locators.PAGE_TITLE)

    def fill_info_and_continue(self, first_name: str, last_name: str, zip_code: str) -> CheckoutStepTwoPage:
        print(f"Заполняем информацию: Имя={first_name}, Фамилия={last_name}, Индекс={zip_code}")
        self.send_keys(Locators.FIRST_NAME_INPUT, first_name)
        self.send_keys(Locators.LAST_NAME_INPUT, last_name)
        self.send_keys(Locators.ZIP_CODE_INPUT, zip_code)
        self.click_element(Locators.CONTINUE_BUTTON)
        print("Нажали Continue.")
        return CheckoutStepTwoPage(self.driver, self.driver.current_url)
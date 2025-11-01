from selenium.common import NoSuchElementException
from selenium.webdriver.common.by import By
from .base_page import BasePage
from .checkout_complete_page import CheckoutCompletePage

class Locators:
    #Локаторы для страницы обзора заказа.
    PAGE_TITLE = (By.CSS_SELECTOR, ".title")
    CART_ITEM = (By.CSS_SELECTOR, ".cart_item")
    ITEM_NAME = (By.CSS_SELECTOR, ".inventory_item_name")
    FINISH_BUTTON = (By.ID, "finish")

class CheckoutStepTwoPage(BasePage):

    def get_title(self) -> str:
        return self.get_text(Locators.PAGE_TITLE)

    def get_items_in_overview_names(self) -> list[str]:
         item_names = []
         overview_item_elements = self.find_elements(Locators.CART_ITEM)
         for item_element in overview_item_elements:
             try:
                 name = item_element.find_element(*Locators.ITEM_NAME).text
                 item_names.append(name)
             except NoSuchElementException:
                 print("Предупреждение: не удалось найти имя для одного из элементов обзора.")
         print(f"Товары на странице обзора: {item_names}")
         return item_names

    def is_item_present(self, item_name_to_check: str) -> bool:
        return item_name_to_check in self.get_items_in_overview_names()

    def finish_checkout(self) -> CheckoutCompletePage:
        print("Нажимаем кнопку Finish...")
        self.click_element(Locators.FINISH_BUTTON)
        return CheckoutCompletePage(self.driver, self.driver.current_url)

    def get_overview_items_count(self) -> int:
        overview_item_elements = self.find_elements(Locators.CART_ITEM)
        count = len(overview_item_elements)
        print(f"На странице обзора найдено строк товаров: {count}")
        return count
from selenium.common import NoSuchElementException
from selenium.webdriver.common.by import By
from .base_page import BasePage
from .checkout_step_one_page import CheckoutStepOnePage # Импортируем следующий шаг

class Locators:
    #Локаторы для страницы корзины.
    PAGE_TITLE = (By.CSS_SELECTOR, ".title")
    CART_ITEM = (By.CSS_SELECTOR, ".cart_item")
    ITEM_NAME = (By.CSS_SELECTOR, ".inventory_item_name")
    CHECKOUT_BUTTON = (By.ID, "checkout")

class CartPage(BasePage):
    def get_title(self) -> str:
        return self.get_text(Locators.PAGE_TITLE)

    def get_items_in_cart_names(self) -> list[str]:
        item_names = []
        cart_item_elements = self.find_elements(Locators.CART_ITEM)
        for item_element in cart_item_elements:
            try:
                name = item_element.find_element(*Locators.ITEM_NAME).text
                item_names.append(name)
            except NoSuchElementException:
                print("Предупреждение: не удалось найти имя для одного из элементов корзины.")
        print(f"Товары в корзине: {item_names}")
        return item_names

    def is_item_present(self, item_name_to_check: str) -> bool:
        return item_name_to_check in self.get_items_in_cart_names()

    def go_to_checkout_step_one(self) -> CheckoutStepOnePage:
        print("Нажимаем кнопку Checkout...")
        self.click_element(Locators.CHECKOUT_BUTTON)
        return CheckoutStepOnePage(self.driver, self.driver.current_url)

    def get_cart_items_count(self) -> int:
        cart_item_elements = self.find_elements(Locators.CART_ITEM)
        count = len(cart_item_elements)
        print(f"На странице корзины найдено строк товаров: {count}")
        return count
from selenium.common import NoSuchElementException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from .base_page import BasePage
from .cart_page import CartPage

class Locators:
    #Локаторы для страницы каталога товаров
    PAGE_TITLE = (By.CSS_SELECTOR, ".title")
    INVENTORY_ITEM = (By.CSS_SELECTOR, ".inventory_item")
    ITEM_NAME = (By.CSS_SELECTOR, ".inventory_item_name")
    ADD_TO_CART_BUTTON = (By.CSS_SELECTOR, "button[id^='add-to-cart-']")
    CART_BADGE = (By.CSS_SELECTOR, ".shopping_cart_badge")
    CART_LINK = (By.CSS_SELECTOR, ".shopping_cart_link")
    SORT_DROPDOWN = (By.CSS_SELECTOR, ".product_sort_container")

class InventoryPage(BasePage):

    def get_title(self) -> str:
        return self.get_text(Locators.PAGE_TITLE)

    def get_cart_badge_count(self) -> int:
        if self.is_element_present(Locators.CART_BADGE):
            try:
                return int(self.get_text(Locators.CART_BADGE))
            except ValueError:
                print(f"Ошибка: текст счетчика корзины '{self.get_text(Locators.CART_BADGE)}' не число.")
                return -1
        else:
            return 0 # Если счетчика нет - корзина пуста

    def add_item_to_cart_by_name(self, item_name_to_add: str):
        print(f"Ищем товар '{item_name_to_add}' для добавления в корзину...")
        items = self.find_elements(Locators.INVENTORY_ITEM)
        if not items:
            print("ОШИБКА: Товары на странице не найдены!")
            raise NoSuchElementException("Не найдены карточки товаров на странице.")

        item_found = False
        for item_element in items:
            current_item_name = item_element.find_element(*Locators.ITEM_NAME).text
            if current_item_name == item_name_to_add:
                print(f"Найден товар: '{current_item_name}'. Добавляем...")
                add_button = item_element.find_element(*Locators.ADD_TO_CART_BUTTON)
                add_button.click()
                item_found = True
                break
        if not item_found:
            print(f"ОШИБКА: Товар с именем '{item_name_to_add}' не найден на странице!")
            raise NoSuchElementException(f"Товар '{item_name_to_add}' не найден.")

    def sort_items(self, sort_option_text: str):
        # Выбирает опцию сортировки
        print(f"Применяем сортировку: '{sort_option_text}'")
        sort_select_element = self.find_element(Locators.SORT_DROPDOWN)
        select = Select(sort_select_element)
        select.select_by_visible_text(sort_option_text)
        print("Сортировка применена.")

    def add_first_item_to_cart(self) -> str:
        print("Добавляем первый товар из списка (предположительно самый дешевый)...")
        items = self.find_elements(Locators.INVENTORY_ITEM)
        if not items:
            raise NoSuchElementException("Не найдены товары для добавления.")

        first_item_element = items[0]  # Берем первый элемент
        try:
            item_name = first_item_element.find_element(*Locators.ITEM_NAME).text
            add_button = first_item_element.find_element(*Locators.ADD_TO_CART_BUTTON)
            add_button.click()
            print(f"Добавлен первый товар: '{item_name}'")
            return item_name
        except NoSuchElementException:
            print("ОШИБКА: Не удалось найти имя или кнопку 'Add to cart' у первого товара.")
            raise

    def go_to_cart(self) -> CartPage:
        print("Переходим в корзину...")
        self.click_element(Locators.CART_LINK)
        return CartPage(self.driver, self.driver.current_url)

    def add_all_items_containing(self, partial_item_name: str) -> int:
        print(f"Ищем и добавляем все товары, содержащие '{partial_item_name}'...")
        items_added_count = 0
        all_item_elements = self.find_elements(Locators.INVENTORY_ITEM)
        if not all_item_elements:
            print("Предупреждение: Товары на странице не найдены.")
            return 0

        for item_element in all_item_elements:
            try:
                current_item_name = item_element.find_element(*Locators.ITEM_NAME).text
                if partial_item_name.lower() in current_item_name.lower():
                    add_button = item_element.find_element(*Locators.ADD_TO_CART_BUTTON)
                    add_button.click()
                    items_added_count += 1
                    print(f" - Добавлен: '{current_item_name}'")
            except NoSuchElementException:
                print(f"Предупреждение: Проблема с обработкой элемента товара, возможно, структура изменилась.")
                continue

        if items_added_count == 0:
            print(f"Товары, содержащие '{partial_item_name}', не найдены для добавления.")
        else:
            print(f"Всего добавлено товаров: {items_added_count}")
        return items_added_count
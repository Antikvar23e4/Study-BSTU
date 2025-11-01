import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from selenium.webdriver.support.ui import Select
from selenium.webdriver.chrome.options import Options

# --- Константы ---
BASE_URL = "https://www.saucedemo.com/"
USER_NAME = "standard_user"
PASSWORD = "secret_sauce"
# Таймаут для явных ожиданий
DEFAULT_WAIT_TIME = 10

@pytest.fixture
def driver():
    # Настраивает и предоставляет экземпляр WebDriver Chrome для теста
    print("\n--- Настройка WebDriver ---")
    chrome_options = Options()
    chrome_options.add_argument("--incognito")
    service = Service(ChromeDriverManager().install())
    d = None
    try:
        d = webdriver.Chrome(service=service, options=chrome_options)
    except Exception as e:
        print(f"!!! ОШИБКА при инициализации WebDriver: {e}")
        print("!!! Убедитесь, что Chrome и ChromeDriver совместимы и обновлены.")
        pytest.fail(f"Не удалось инициализировать WebDriver: {e}")
        return

    d.maximize_window()
    yield d
    print("\n--- Закрытие WebDriver ---")
    d.quit()

def lodin_func(driver, wait):
    print(f"Переход на: {BASE_URL}")
    driver.get(BASE_URL)
    try:
        user_field = wait.until(EC.visibility_of_element_located((By.ID, "user-name")))
        pass_field = wait.until(EC.visibility_of_element_located((By.ID, "password")))
        login_button = wait.until(EC.element_to_be_clickable((By.ID, "login-button")))

        user_field.send_keys(USER_NAME)
        pass_field.send_keys(PASSWORD)
        login_button.click()

        wait.until(EC.url_contains("inventory.html"))
        assert "inventory.html" in driver.current_url, "URL не содержит 'inventory.html' после логина"
    except TimeoutException as e:
        pytest.fail(f"Ошибка во время логина (таймаут ожидания элемента или URL): {e}")

def fill_checkout_func(driver, wait, first_name, last_name, zip_code):
    print("Заполнение информации для чекаута...")
    try:
        first_name_field = wait.until(EC.visibility_of_element_located((By.ID, "first-name")))
        last_name_field = wait.until(EC.visibility_of_element_located((By.ID, "last-name")))
        zip_field = wait.until(EC.visibility_of_element_located((By.ID, "postal-code")))
        continue_button = wait.until(EC.element_to_be_clickable((By.ID, "continue")))

        first_name_field.send_keys(first_name)
        last_name_field.send_keys(last_name)
        zip_field.send_keys(zip_code)

        continue_button.click()

        wait.until(EC.url_contains("checkout-step-two.html"))
        print("Переход на страницу Checkout: Overview.")
    except TimeoutException as e:
        pytest.fail(f"Ошибка при заполнении данных чекаута (таймаут ожидания элемента или URL): {e}")

# Тест №1: Успешная авторизация
def test_1(driver):
    print("\nТест 1: Успешная авторизация")
    wait = WebDriverWait(driver, DEFAULT_WAIT_TIME)
    lodin_func(driver, wait)
    try:
        products_title = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".title")))
        assert products_title.text == "Products", "Заголовок 'Products' не найден после логина"
        print("Проверка: Заголовок 'Products' найден.")
    except TimeoutException:
        pytest.fail("Не удалось найти заголовок 'Products' после логина.")

# Тест №2: Добавление товара из каталога
def test_2(driver):
    print("\nТест 2: Добавление товара из каталога")
    wait = WebDriverWait(driver, DEFAULT_WAIT_TIME)
    lodin_func(driver, wait)

    partial_target_name = "Fleece Jacket"
    found_item_full_name = None
    item_added = False

    # Селекторы
    cart_link_selector = ".shopping_cart_link"
    checkout_button_id = "checkout"
    overview_title_selector = ".title"
    inventory_item_selector = ".inventory_item"
    item_name_selector = ".inventory_item_name"
    add_button_selector = "button[id^='add-to-cart-']"

    try:
        print(f"Поиск товара, содержащего '{partial_target_name}', и добавление в корзину...")
        # Ждем видимости всех элементов товаров перед итерацией
        inventory_items = wait.until(EC.visibility_of_all_elements_located((By.CSS_SELECTOR, inventory_item_selector)))

        for item in inventory_items:
            item_name_element = item.find_element(By.CSS_SELECTOR, item_name_selector)
            current_item_full_name = item_name_element.text

            if partial_target_name in current_item_full_name:
                add_button = item.find_element(By.CSS_SELECTOR, add_button_selector)
                WebDriverWait(item, 2).until(EC.element_to_be_clickable((By.CSS_SELECTOR, add_button_selector)))
                add_button.click()
                item_added = True
                found_item_full_name = current_item_full_name
                print(f"Найден товар '{found_item_full_name}' по частичному названию '{partial_target_name}' и добавлен в корзину.")
                break

        if not item_added:
             pytest.fail(f"Товар, содержащий '{partial_target_name}', не найден на странице каталога.")

        cart_badge = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".shopping_cart_badge")))
        assert cart_badge.text == "1", "Счетчик корзины не равен 1 после добавления товара"
        print("Проверка: Счетчик корзины равен 1.")

        wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, cart_link_selector))).click()
        wait.until(EC.url_contains("cart.html"))
        print("Перешли в корзину.")

        item_name_in_cart = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, item_name_selector)))
        assert item_name_in_cart.text == found_item_full_name, f"В корзине неверный товар: ожидали '{found_item_full_name}', получили '{item_name_in_cart.text}'"
        print(f"Проверка: Товар '{found_item_full_name}' корректно отображается в корзине.")

        wait.until(EC.element_to_be_clickable((By.ID, checkout_button_id))).click()
        wait.until(EC.url_contains("checkout-step-one.html"))
        print("Перешли к вводу данных для чекаута.")

        fill_checkout_func(driver, wait, "Tester", "PartialExplicit", "12345")

        overview_title = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, overview_title_selector)))
        assert overview_title.text == "Checkout: Overview", "Не удалось перейти на страницу Checkout: Overview"
        item_name_on_overview = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, item_name_selector)))
        assert item_name_on_overview.text == found_item_full_name, f"На странице Overview неверный товар: ожидали '{found_item_full_name}', получили '{item_name_on_overview.text}'"
        print(f"Проверка: Страница 'Checkout: Overview' достигнута, товар '{found_item_full_name}' присутствует.")

    except TimeoutException as e:
        pytest.fail(f"Ошибка в сценарии '{partial_target_name}' (таймаут ожидания): {e}")
    except NoSuchElementException as e:
         pytest.fail(f"Ошибка в сценарии '{partial_target_name}' (элемент не найден внутри другого элемента): {e}")

# Тест №3: Покупка самого дешевого товара
def test_3(driver):
    print("\nТест 3: Покупка самого дешевого товара")
    wait = WebDriverWait(driver, DEFAULT_WAIT_TIME)
    lodin_func(driver, wait)

    # Селекторы
    sort_dropdown_selector = ".product_sort_container"
    inventory_item_selector = ".inventory_item"
    item_name_selector = ".inventory_item_name"
    add_button_selector = "button[id^='add-to-cart-']"
    cart_link_selector = ".shopping_cart_link"
    checkout_button_id = "checkout"
    overview_title_selector = ".title"

    try:
        print("Применение сортировки 'Price (low to high)'...")
        sort_dropdown = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, sort_dropdown_selector)))
        select = Select(sort_dropdown)
        select.select_by_visible_text("Price (low to high)")
        print("Сортировка применена.")
        # Дожидаемся обновления списка - ждем видимости первого элемента
        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, inventory_item_selector)))

        print("Поиск самого дешевого товара (первый в списке)...")
        cheapest_item_container = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, inventory_item_selector)))
        # Ищем элементы внутри найденного контейнера
        cheapest_item_name = cheapest_item_container.find_element(By.CSS_SELECTOR, item_name_selector).text
        add_button = cheapest_item_container.find_element(By.CSS_SELECTOR, add_button_selector)

        print(f"Добавление самого дешевого товара: '{cheapest_item_name}'")
        add_button.click()

        cart_badge = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, ".shopping_cart_badge")))
        assert cart_badge.text == "1", "Счетчик корзины не равен 1 после добавления самого дешевого товара"
        print("Проверка: Счетчик корзины равен 1.")

        wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, cart_link_selector))).click()
        wait.until(EC.url_contains("cart.html"))
        print("Перешли в корзину.")

        item_name_in_cart = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, item_name_selector)))
        assert item_name_in_cart.text == cheapest_item_name, f"В корзине неверный товар: ожидали '{cheapest_item_name}', получили '{item_name_in_cart.text}'"
        print(f"Проверка: Товар '{cheapest_item_name}' корректно отображается в корзине.")

        wait.until(EC.element_to_be_clickable((By.ID, checkout_button_id))).click()
        wait.until(EC.url_contains("checkout-step-one.html"))
        print("Перешли к вводу данных для чекаута.")

        fill_checkout_func(driver, wait, "Tester", "CheapestExplicit", "54321")

        overview_title = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, overview_title_selector)))
        assert overview_title.text == "Checkout: Overview", "Не удалось перейти на страницу Checkout: Overview"
        item_name_on_overview = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, item_name_selector)))
        assert item_name_on_overview.text == cheapest_item_name, f"На странице Overview неверный товар: ожидали '{cheapest_item_name}', получили '{item_name_on_overview.text}'"
        print(f"Проверка: Страница 'Checkout: Overview' достигнута, товар '{cheapest_item_name}' присутствует.")

    except TimeoutException as e:
        pytest.fail(f"Ошибка в E2E сценарии для самого дешевого товара (таймаут ожидания): {e}")
    except NoSuchElementException as e:
         pytest.fail(f"Ошибка в E2E сценарии для самого дешевого товара (элемент не найден внутри другого): {e}")

# Тест №4: E2E - Добавление всех 'T-Shirt'
def test_4(driver):
    print("\nТест 4: E2E - Добавление всех 'T-Shirt'")
    wait = WebDriverWait(driver, DEFAULT_WAIT_TIME)
    lodin_func(driver, wait)

    partial_name_to_find = "T-Shirt"
    tshirt_count = 0

    # Селекторы
    inventory_item_selector = ".inventory_item"
    item_name_selector = ".inventory_item_name"
    add_button_selector = "button[id^='add-to-cart-']"
    cart_badge_selector = ".shopping_cart_badge"
    cart_link_selector = ".shopping_cart_link"
    cart_item_selector_on_cart_page = ".cart_item"
    checkout_button_id = "checkout"
    finish_button_id = "finish"
    checkout_complete_container_selector = "#checkout_complete_container"
    thank_you_header_selector = ".complete-header"
    overview_title_selector = ".title"

    try:
        print(f"Поиск и добавление всех товаров, содержащих '{partial_name_to_find}'...")
        inventory_items = wait.until(EC.visibility_of_all_elements_located((By.CSS_SELECTOR, inventory_item_selector)))
        print(f"Найдено {len(inventory_items)} товаров на странице.")

        for item in inventory_items:
            item_name_element = item.find_element(By.CSS_SELECTOR, item_name_selector)
            item_name = item_name_element.text
            if partial_name_to_find in item_name:
                add_button = item.find_element(By.CSS_SELECTOR, add_button_selector)
                add_button.click()
                tshirt_count += 1
                print(f" - Добавлен товар: '{item_name}'")

        print(f"Всего добавлено товаров с '{partial_name_to_find}': {tshirt_count}")

        if tshirt_count == 0:
             pytest.fail(f"Не найдено ни одного товара, содержащего '{partial_name_to_find}'. Тест не может быть выполнен.")

        cart_badge = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, cart_badge_selector)))
        assert cart_badge.text == str(tshirt_count), f"Счетчик корзины неверен: ожидался {tshirt_count}, получено {cart_badge.text}"
        print(f"Проверка: Счетчик корзины равен {tshirt_count}.")

        wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, cart_link_selector))).click()
        wait.until(EC.url_contains("cart.html"))

        cart_items_on_page = wait.until(EC.visibility_of_all_elements_located((By.CSS_SELECTOR, cart_item_selector_on_cart_page)))
        assert len(cart_items_on_page) == tshirt_count, \
               f"Ожидалось {tshirt_count} товаров на странице корзины, найдено {len(cart_items_on_page)}"
        print(f"Проверка: На странице корзины {len(cart_items_on_page)} товаров.")


        wait.until(EC.element_to_be_clickable((By.ID, checkout_button_id))).click()
        wait.until(EC.url_contains("checkout-step-one.html"))

        fill_checkout_func(driver, wait, "Tester", "E2E_Explicit", "90210")

        wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, overview_title_selector)))
        print("Перешли на страницу Checkout: Overview.")

        overview_items = wait.until(EC.visibility_of_all_elements_located((By.CSS_SELECTOR, cart_item_selector_on_cart_page)))
        assert len(overview_items) == tshirt_count, \
               f"Ожидалось {tshirt_count} товаров на странице обзора, найдено {len(overview_items)}"
        print(f"Проверка: На странице обзора {len(overview_items)} товаров.")

        wait.until(EC.element_to_be_clickable((By.ID, finish_button_id))).click()

        wait.until(EC.url_contains("checkout-complete.html"))
        print("Перешли на страницу Checkout: Complete!")

        complete_container = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, checkout_complete_container_selector)))
        thank_you_header = complete_container.find_element(By.CSS_SELECTOR, thank_you_header_selector)

        expected_confirmation_text = "Thank you for your order!"
        actual_confirmation_text = thank_you_header.text
        assert expected_confirmation_text.lower() in actual_confirmation_text.lower(), \
               f"Ожидалось сообщение '{expected_confirmation_text}', но получено '{actual_confirmation_text}'"
        print(f"Проверка: Сообщение '{actual_confirmation_text}' найдено. Заказ успешно оформлен.")

    except TimeoutException as e:
        pytest.fail(f"Ошибка в E2E сценарии '{partial_name_to_find}' (таймаут ожидания): {e}")
    except NoSuchElementException as e:
         pytest.fail(f"Ошибка в E2E сценарии '{partial_name_to_find}' (элемент не найден внутри другого): {e}")
    except Exception as e:
        pytest.fail(f"Непредвиденная ошибка в E2E сценарии '{partial_name_to_find}': {e}")
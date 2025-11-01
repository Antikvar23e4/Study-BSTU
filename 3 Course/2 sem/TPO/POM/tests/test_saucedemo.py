import pytest
import os
import json

from pages.login_page import LoginPage
from pages.base_page import BasePage
from pages.inventory_page import Locators as InventoryLocators

from .conftest import BASE_URL, REPORT_DIR
USER_NAME = "standard_user"
PASSWORD = "secret_sauce"
LOCKED_OUT_USER = "locked_out_user"

@pytest.mark.order(1)
@pytest.mark.login
@pytest.mark.smoke
@pytest.mark.parametrize(
    "username",
    [
        "standard_user",
        "problem_user",
        "performance_glitch_user",
    ],
    ids=["standard", "problem", "glitch"]
)
def test_successful_login(driver, username):
    print(f"\n--- Тест: Успешный логин (Пользователь: {username}) ---")
    login_page = LoginPage(driver, BASE_URL)
    login_page.open()
    inventory_page = login_page.login(username, PASSWORD)
    assert "inventory.html" in inventory_page.get_current_url(), f"Неверный URL после логина пользователя {username}"
    assert inventory_page.get_title() == "Products", f"Неверный заголовок страницы для пользователя {username}"
    print(f"Проверка URL и заголовка после логина пользователя {username} прошла успешно.")


@pytest.mark.order(2)
@pytest.mark.login
@pytest.mark.negative
def test_locked_out_user_login(driver):
    print("\n--- Тест: Логин заблокированного пользователя ---")
    login_page = LoginPage(driver, BASE_URL)
    login_page.open()
    login_page.login(LOCKED_OUT_USER, PASSWORD)
    assert "inventory.html" not in login_page.get_current_url(), "Не должны были перейти на страницу каталога"
    error_message = login_page.get_error_message()
    assert error_message != "", "Сообщение об ошибке должно присутствовать"
    assert "Sorry, this user has been locked out" in error_message, "Неверный текст сообщения об ошибке"
    print("Проверка сообщения об ошибке для заблокированного пользователя прошла успешно.")


@pytest.mark.order(3)
@pytest.mark.e2e
@pytest.mark.checkout
@pytest.mark.regression
def test_add_cheapest_item_to_cart(driver):
    print("\n--- Тест: Добавление самого дешевого товара в корзину и E2E ---")
    checkout_first_name = "Cheapo"
    checkout_last_name = "Testero"
    checkout_zip = "98765"

    login_page = LoginPage(driver, BASE_URL)
    login_page.open()
    inventory_page = login_page.login(USER_NAME, PASSWORD)
    print("Шаг 1: Логин выполнен.")

    inventory_page.sort_items("Price (low to high)")

    initial_cart_count = inventory_page.get_cart_badge_count()
    cheapest_item_name = inventory_page.add_first_item_to_cart()
    print(f"Самый дешевый товар '{cheapest_item_name}' добавлен.")

    final_cart_count = inventory_page.get_cart_badge_count()
    assert final_cart_count == 1, f"Счетчик корзины должен быть 1, а он {final_cart_count}"
    print("Шаг 4: Счетчик корзины проверен (равен 1).")

    cart_page = inventory_page.go_to_cart()
    assert "cart.html" in cart_page.get_current_url(), "Должны быть на странице корзины"
    assert cart_page.is_item_present(cheapest_item_name), f"Товар '{cheapest_item_name}' должен быть в корзине"
    print(f"Шаг 5: Товар '{cheapest_item_name}' найден на странице корзины.")

    checkout_one_page = cart_page.go_to_checkout_step_one()
    assert "checkout-step-one.html" in checkout_one_page.get_current_url()
    print("Шаг 6: Перешли на первый шаг чекаута.")

    checkout_two_page = checkout_one_page.fill_info_and_continue(
        checkout_first_name, checkout_last_name, checkout_zip
    )
    assert "checkout-step-two.html" in checkout_two_page.get_current_url()
    print("Шаг 7: Заполнили инфо, перешли на страницу обзора.")

    assert checkout_two_page.is_item_present(cheapest_item_name), \
        f"Товар '{cheapest_item_name}' должен быть на странице обзора"
    print(f"Шаг 8: Товар '{cheapest_item_name}' найден на странице обзора.")

    complete_page = checkout_two_page.finish_checkout()
    assert "checkout-complete.html" in complete_page.get_current_url()
    assert "thank you for your order" in complete_page.get_confirmation_message().lower(), \
        "Нет сообщения об успешном заказе"
    print("Шаг 9: Заказ успешно завершен!")


@pytest.mark.e2e
@pytest.mark.checkout
@pytest.mark.regression
@pytest.mark.parametrize(
    "item_to_buy, first_name, last_name, zip_code",
    [
        ("Sauce Labs Backpack", "Back", "Pack", "10001"),
        ("Sauce Labs Bike Light", "Bike", "Light", "90210"),
        ("Sauce Labs Bolt T-Shirt", "Bolt", "Shirt", "54321"),
    ],
    ids=["buy_backpack", "buy_bikelight", "buy_bolt_tshirt"]
)
def test_e2e_purchase_single_item(driver, item_to_buy, first_name, last_name, zip_code):
    print(f"\n--- Тест: Полный цикл покупки (Товар: {item_to_buy}, Покупатель: {first_name}) ---")

    login_page = LoginPage(driver, BASE_URL)
    login_page.open()
    inventory_page = login_page.login(USER_NAME, PASSWORD) # Логинимся под standard_user
    print("Шаг 1: Логин выполнен.")

    inventory_page.add_item_to_cart_by_name(item_to_buy)
    assert inventory_page.get_cart_badge_count() == 1, "Счетчик корзины должен быть 1"
    print(f"Шаг 2: Товар '{item_to_buy}' добавлен.")

    cart_page = inventory_page.go_to_cart()
    assert cart_page.is_item_present(item_to_buy), f"Товар '{item_to_buy}' должен быть в корзине"
    print("Шаг 3: Перешли в корзину, товар на месте.")

    checkout_one_page = cart_page.go_to_checkout_step_one()
    assert "checkout-step-one.html" in checkout_one_page.get_current_url()
    print("Шаг 4: Перешли на первый шаг чекаута.")

    print(f"Шаг 5: Заполняем инфо ({first_name}, {last_name}, {zip_code}), переходим на страницу обзора.")
    checkout_two_page = checkout_one_page.fill_info_and_continue(first_name, last_name, zip_code)
    assert "checkout-step-two.html" in checkout_two_page.get_current_url()
    assert checkout_two_page.is_item_present(item_to_buy), f"Товар '{item_to_buy}' должен быть на странице обзора"
    print(f"Шаг 5: Товар '{item_to_buy}' найден на странице обзора.")

    complete_page = checkout_two_page.finish_checkout()
    assert "checkout-complete.html" in complete_page.get_current_url()
    assert "thank you for your order" in complete_page.get_confirmation_message().lower(), "Нет сообщения об успешном заказе"
    print("Шаг 6: Заказ успешно завершен!")
    screenshot_path = os.path.join(REPORT_DIR, f"e2e_single_{item_to_buy.replace(' ', '_')}_{first_name}.png")
    complete_page.take_screenshot(screenshot_path)


@pytest.mark.order(5)
@pytest.mark.e2e
@pytest.mark.checkout
@pytest.mark.regression
def test_e2e_add_all_tshirts(driver):
    print("\n--- Тест: E2E Добавление всех T-Shirt ---")
    partial_name = "T-Shirt"
    first_name = "TShirt"
    last_name = "Tester"
    zip_code = "54321"

    login_page = LoginPage(driver, BASE_URL)
    login_page.open()
    inventory_page = login_page.login(USER_NAME, PASSWORD)
    print("Шаг 1: Логин выполнен.")

    added_count = inventory_page.add_all_items_containing(partial_name)
    assert added_count > 0, f"Должен был быть добавлен хотя бы один товар с '{partial_name}'"
    print(f"Шаг 2: Добавлено {added_count} товаров с '{partial_name}'.")

    badge_count = inventory_page.get_cart_badge_count()
    assert badge_count == added_count, f"Счетчик корзины ({badge_count}) не совпадает с кол-вом добавленных ({added_count})"
    print(f"Проверка счетчика корзины ({badge_count}) прошла успешно.")

    cart_page = inventory_page.go_to_cart()
    assert "cart.html" in cart_page.get_current_url()

    items_in_cart_page = cart_page.get_cart_items_count()
    assert items_in_cart_page == added_count, f"Кол-во строк в корзине ({items_in_cart_page}) не совпадает с кол-вом добавленных ({added_count})"
    print(f"Проверка количества строк ({items_in_cart_page}) на странице корзины прошла успешно.")

    checkout_one_page = cart_page.go_to_checkout_step_one()
    assert "checkout-step-one.html" in checkout_one_page.get_current_url()
    print("Шаг 6: Перешли на первый шаг чекаута.")

    checkout_two_page = checkout_one_page.fill_info_and_continue(first_name, last_name, zip_code)
    assert "checkout-step-two.html" in checkout_two_page.get_current_url()
    print("Шаг 7: Заполнили инфо, перешли на страницу обзора.")

    items_in_overview_page = checkout_two_page.get_overview_items_count()
    assert items_in_overview_page == added_count, f"Кол-во строк на обзоре ({items_in_overview_page}) не совпадает с кол-вом добавленных ({added_count})"
    print(f"Проверка количества строк ({items_in_overview_page}) на странице обзора прошла успешно.")

    complete_page = checkout_two_page.finish_checkout()
    assert "checkout-complete.html" in complete_page.get_current_url()
    assert "thank you for your order" in complete_page.get_confirmation_message().lower(), "Нет сообщения об успешном заказе"
    print("Шаг 9: Заказ успешно завершен!")
    screenshot_path = os.path.join(REPORT_DIR, "e2e_add_all_tshirts_complete.png")
    complete_page.take_screenshot(screenshot_path)


@pytest.mark.skip
@pytest.mark.cookies
def save_cookies(driver, filename):
    if not os.path.exists(REPORT_DIR):
        try:
            os.makedirs(REPORT_DIR)
            print(f"Создана папка: {REPORT_DIR}")
        except OSError as e:
            print(f"ОШИБКА: Не удалось создать папку {REPORT_DIR}: {e}")
            return

    filepath = os.path.join(REPORT_DIR, filename) # Полный путь к файлу
    try:
        with open(filepath, 'w') as f:
            json.dump(driver.get_cookies(), f, indent=4)
        print(f"Куки успешно сохранены в файл: {filepath}")
    except Exception as e:
        print(f"ОШИБКА при сохранении кук в файл {filepath}: {e}")

@pytest.mark.skip
@pytest.mark.cookies
@pytest.mark.login
@pytest.mark.regression
def test_show_and_save_cookies_after_login(driver, request): # Нужен request для --save_cookies
    print("\n--- Тест: Демонстрация и сохранение кук после логина ---")

    login_page = LoginPage(driver, BASE_URL)
    login_page.open()
    inventory_page = login_page.login(USER_NAME, PASSWORD)
    assert "inventory.html" in inventory_page.get_current_url(), "Логин не удался, работа с куками невозможна"
    print("Логин выполнен успешно.")

    print("\n--- Текущие куки сессии ---")
    current_cookies = driver.get_cookies()
    if current_cookies:
        for cookie in current_cookies:
            print(f"  Имя: {cookie.get('name', 'N/A')}, "
                  f"Значение: {cookie.get('value', 'N/A')[:30]}..., " 
                  f"Домен: {cookie.get('domain', 'N/A')}, "
                  f"Путь: {cookie.get('path', 'N/A')}")
    else:
        print("  Куки не найдены.")
    print("-" * 25)
    cookie_save_file = request.config.getoption("--save_cookies")
    if cookie_save_file:
        print(f"Запрошено сохранение кук в файл: {cookie_save_file}")
        save_cookies(driver, cookie_save_file)
    else:
        print("Сохранение кук не запрашивалось (опция --save_cookies не указана).")


@pytest.mark.skip
@pytest.mark.cookies
@pytest.mark.login
def test_login_with_cookies(driver):
    print("\n--- Тест: Проверка логина через загруженные куки ---")
    # Логика загрузки кук отработала в фикстуре 'driver'.
    target_url = BASE_URL + "inventory.html"
    print(f"Переходим напрямую на: {target_url}")
    driver.get(target_url)

    current_url = driver.current_url
    print(f"Текущий URL после перехода: {current_url}")
    assert "inventory.html" in current_url, \
        f"Ожидали URL inventory.html, но получили {current_url}. Логин по кукам не удался?"
    checker_page = BasePage(driver, current_url)
    try:
        title = checker_page.get_text(InventoryLocators.PAGE_TITLE, time=5)
        assert title == "Products", f"Ожидали заголовок 'Products', но получили '{title}'"
        print("Проверка: Заголовок 'Products' найден. Логин по кукам успешен.")
    except Exception as e:
        pytest.fail(f"Не удалось подтвердить логин по кукам. Ошибка при проверке элемента: {e}")
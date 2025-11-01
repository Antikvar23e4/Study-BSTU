import pytest
import os
import json

from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from webdriver_manager.chrome import ChromeDriverManager

from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.edge.options import Options as EdgeOptions
from webdriver_manager.microsoft import EdgeChromiumDriverManager

BASE_URL = "https://www.saucedemo.com/"
REPORT_DIR = "test_reports"

# опции командной строки
def pytest_addoption(parser):
    parser.addoption("--headless", action="store_true", default=False,
                     help="Запустить браузер Chrome в режиме без GUI (headless)")

    parser.addoption("--save_cookies", action="store", default=None,
                     help="Сохранить куки сессии в указанный файл после успешного логина.")

    parser.addoption("--load_cookies", action="store", default=None,
                     help="Загрузить куки сессии из указанного файла перед тестом.")

    parser.addoption("--browser", action="store", default="chrome",
                     help="Браузер для запуска тестов: chrome или edge")

@pytest.fixture(scope="function")
def driver(request):
    run_headless = request.config.getoption("--headless")
    cookie_load_file = request.config.getoption("--load_cookies")
    browser_name = request.config.getoption("--browser").lower()

    print(f"\n[SETUP] Инициализация WebDriver ({browser_name}, Headless={run_headless})...")
    driver_instance = None

    # выбор браузера
    if browser_name == "chrome":
        chrome_options = ChromeOptions()
        chrome_options.add_argument("--incognito")
        if run_headless:
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-extensions")
            chrome_options.add_argument("--disable-infobars")
            chrome_options.add_argument("--disable-notifications")
        try:
            service = ChromeService(ChromeDriverManager().install())
            driver_instance = webdriver.Chrome(service=service, options=chrome_options)
        except Exception as e:
             pytest.fail(f"Не удалось инициализировать Chrome WebDriver: {e}")
    elif browser_name == "edge":
        edge_options = EdgeOptions()
        edge_options.add_argument("--inprivate") # Аналог инкогнито
        if run_headless:
            print("Включаем Headless режим для Edge...")
            edge_options.add_argument("--headless")
            edge_options.add_argument("--window-size=1920,1080")
            edge_options.add_argument("--disable-gpu")
            edge_options.add_argument("--disable-extensions")
        try:
            service = EdgeService(EdgeChromiumDriverManager().install())
            driver_instance = webdriver.Edge(service=service, options=edge_options)
            print("Edge WebDriver инициализирован.")
        except Exception as e:
            pytest.fail(f"Не удалось инициализировать Edge WebDriver: {e}"
                        "\nУбедитесь, что Microsoft Edge установлен и webdriver-manager может скачать драйвер.")
    else:
        pytest.fail(f"Неподдерживаемый браузер указан: '{browser_name}'. Доступны: 'chrome', 'edge'.")

    # после инициализации драйвера
    if driver_instance:
        driver_instance.maximize_window()
        driver_instance.implicitly_wait(2)
        # использование куки
        if cookie_load_file:
            cookie_filepath = os.path.join(REPORT_DIR, cookie_load_file)
            print(f"Попытка загрузить куки из файла: {cookie_filepath}")
            if os.path.exists(cookie_filepath):
                try:
                    print(f"Переходим на {BASE_URL} для установки кук...")
                    driver_instance.get(BASE_URL)
                    with open(cookie_filepath, 'r') as f:
                        cookies = json.load(f)
                    driver_instance.delete_all_cookies()
                    print(f"Добавляем {len(cookies)} кук...")
                    for cookie in cookies:
                        if 'sameSite' in cookie and cookie['sameSite'] not in ['Strict', 'Lax', 'None']:
                             print(f"Предупреждение: Некорректный SameSite='{cookie['sameSite']}' в куки {cookie.get('name')}, удаляем атрибут.")
                             del cookie['sameSite']
                        driver_instance.add_cookie(cookie)
                    print("Куки добавлены. Обновляем страницу...")
                    driver_instance.refresh()
                    print("Страница обновлена после загрузки кук.")
                except json.JSONDecodeError:
                    print(f"ОШИБКА: Не удалось прочитать JSON из файла кук: {cookie_filepath}")
                except Exception as e:
                    print(f"ОШИБКА при загрузке кук: {e}")
            else:
                print(f"ОШИБКА: Файл кук не найден: {cookie_filepath}. Загрузка пропущена.")
        else:
            print("Загрузка кук не запрашивалась (опция --load_cookies не указана).")

        # предоставляем драйвер тесту
        yield driver_instance

        print(f"\n[TEARDOWN] Закрытие WebDriver ({browser_name})...")
        driver_instance.quit()

    else:
         print(f"\n[TEARDOWN] WebDriver не был создан, закрывать нечего.")
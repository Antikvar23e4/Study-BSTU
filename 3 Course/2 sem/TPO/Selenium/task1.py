from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

TARGET_URL = "https://demoqa.com/text-box"
DEFAULT_WAIT_TIME = 10

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)
driver.maximize_window()

driver.get(TARGET_URL)

# создаем таймер для явного ожидания
wait = WebDriverWait(driver, DEFAULT_WAIT_TIME)

print("Ждем загрузки основной формы...")
try:
    wait.until(EC.visibility_of_element_located((By.ID, "userForm")))
    print("Основная форма загружена.")
except TimeoutException:
    print(f"Не удалось дождаться загрузки основной формы за {DEFAULT_WAIT_TIME} сек.")
    driver.quit()
    exit()


print("\n--- Поиск элементов на DemoQA (только явные ожидания) ---")

# 1. By.id
try:
    full_name_field = wait.until(EC.visibility_of_element_located((By.ID, "userName")))
    email_field = wait.until(EC.visibility_of_element_located((By.ID, "userEmail")))
    print(f"1a. Найден элемент по ID='userName': Тег={full_name_field.tag_name}, Тип={full_name_field.get_attribute('type')}")
    print(f"1b. Найден элемент по ID='userEmail': Тег={email_field.tag_name}, Тип={email_field.get_attribute('type')}")
except TimeoutException:
    print(f"1. Элемент по ID не найден за {DEFAULT_WAIT_TIME} сек.")


# 2. CSS-селекторы
try:
    css_selector_1 = "input#userEmail[placeholder='name@example.com']"
    element_css_1 = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, css_selector_1)))
    print(f"2a. Найден элемент по CSS '{css_selector_1}': Тег={element_css_1.tag_name}")

    css_selector_2 = "form#userForm button#submit.btn-primary"
    element_css_2 = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, css_selector_2)))
    print(f"2b. Найден элемент по CSS '{css_selector_2}': Тег={element_css_2.tag_name}, Текст='{element_css_2.text}'")
except TimeoutException:
     print(f"2. Элемент по CSS не найден за {DEFAULT_WAIT_TIME} сек. Проверьте селекторы.")


# 3. XPath
try:
    #  label, текст которого 'Current Address'
    xpath_1 = "//label[text()='Current Address']"
    element_xpath_1 = wait.until(EC.visibility_of_element_located((By.XPATH, xpath_1)))
    print(f"3a. Найден элемент по XPath '{xpath_1}': Тег={element_xpath_1.tag_name}, ID='{element_xpath_1.get_attribute('id')}'")
    # textarea с id='permanentAddress' и с классом 'form-control'
    xpath_2 = "//textarea[@id='permanentAddress' and contains(@class, 'form-control')]"
    element_xpath_2 = wait.until(EC.visibility_of_element_located((By.XPATH, xpath_2)))
    print(f"3b. Найден элемент по XPath '{xpath_2}': Тег={element_xpath_2.tag_name}, Rows='{element_xpath_2.get_attribute('rows')}'")
except TimeoutException:
    print(f"3. Элемент по XPath не найден за {DEFAULT_WAIT_TIME} сек. Проверьте XPath.")


# 5. Найти несколько элементов (Заменяем find_elements на wait.until)
print("\n5. Поиск нескольких элементов (пункты меню слева):")
menu_items_locator = "//div[contains(@class, 'element-list') and contains(@class, 'show')]//ul[@class='menu-list']/li"
try:
    menu_items = wait.until(EC.presence_of_all_elements_located((By.XPATH, menu_items_locator)))
    print(f"   Найдено {len(menu_items)} пунктов меню.")

    for i, item in enumerate(menu_items[:5]): # обрабатываем первые 5 найденных
        try:
            item_text = item.text.strip() or "Пустой текст"
            item_id = item.get_attribute("id") or "Нет ID"
            print(f"   Пункт {i+1}: Текст='{item_text}', ID='{item_id}'")
        except Exception as e:
            print(f"   Ошибка при обработке пункта {i+1}: {e}")

except TimeoutException:
    print(f"   Не удалось найти ни одного пункта меню за {DEFAULT_WAIT_TIME} сек.")
except Exception as e:
    print(f"   Произошла ошибка при поиске или обработке пунктов меню: {e}")

print("\n--- Завершение работы ---")
driver.quit()
print("Браузер закрыт.")
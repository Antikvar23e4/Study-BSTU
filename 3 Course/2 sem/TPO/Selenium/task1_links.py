import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import NoSuchElementException

TARGET_URL = "https://demoqa.com/links"
IMPLICIT_WAIT_TIME = 5

service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service)
driver.maximize_window()
driver.implicitly_wait(IMPLICIT_WAIT_TIME)

driver.get(TARGET_URL)

try:
    driver.find_element(By.ID, "simpleLink")
except NoSuchElementException:
    print(f"Не удалось найти элемент 'simpleLink' за {IMPLICIT_WAIT_TIME} сек.")
    driver.quit()
    exit()

try:
    partial_link_text_1 = "Ho" # "Home"
    element_partial_link_1 = driver.find_element(By.PARTIAL_LINK_TEXT, partial_link_text_1)
    print(f"4a. Найдена ссылка по ЧАСТИЧНОМУ тексту '{partial_link_text_1}': "
          f"Тег={element_partial_link_1.tag_name}, "
          f"Полный Текст='{element_partial_link_1.text}', "
          f"Href='{element_partial_link_1.get_attribute('href')}'")
except NoSuchElementException:
    print(f"4a. Ссылка с частичным текстом '{partial_link_text_1}' НЕ найдена за {IMPLICIT_WAIT_TIME} сек.")

try:
    partial_link_text_2 = "Crea" #"Created"
    element_partial_link_2 = driver.find_element(By.PARTIAL_LINK_TEXT, partial_link_text_2)
    print(f"\n4b. Найдена ссылка по ЧАСТИЧНОМУ тексту '{partial_link_text_2}': "
          f"Тег={element_partial_link_2.tag_name}, "
          f"Полный Текст='{element_partial_link_2.text}', "
          f"ID='{element_partial_link_2.get_attribute('id')}', "
          f"Href='{element_partial_link_2.get_attribute('href')}'")
except NoSuchElementException:
    print(f"\n4b. Ссылка с ЧАСТИЧНЫМ текстом '{partial_link_text_2}' НЕ найдена за {IMPLICIT_WAIT_TIME} сек.")

print("\n--- Завершение работы ---")
time.sleep(2)
driver.quit()
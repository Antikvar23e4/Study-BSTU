import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.support.ui import WebDriverWait

from selenium.webdriver.chrome.options import Options

TARGET_URL = "https://www.ozon.ru/"

options = Options()
options.add_argument("--disable-blink-features=AutomationControlled")
service = Service(ChromeDriverManager().install())
driver = webdriver.Chrome(service=service, options=options)
driver.maximize_window()
wait = WebDriverWait(driver, 5, poll_frequency=1)

driver.get(TARGET_URL)
time.sleep(10)


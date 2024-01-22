import time
from webdriver_manager.chrome import ChromeDriverManager 
from selenium import webdriver 
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By

# Set up the WebDriver (Chrome in this case)
browser = webdriver.Chrome(service=ChromeService(ChromeDriverManager().install())) 
browser.implicitly_wait(5)

# Navigate to the home page
browser.get('http://localhost:3000/')

# Locate the search bar, enter a recipe name, and click search
search_bar = browser.find_element(By.ID,'search_box')
query = "Classic French Mussels"
search_bar.send_keys(query)
search_button = browser.find_element(By.ID,'search_button')
search_button.click()

# Assertions to check if search results are displayed
time.sleep(2)  # Wait for results to load
page_heading = browser.find_element(By.CSS_SELECTOR,'.page-heading h1').text
print(page_heading.lower())
assert query.lower() in page_heading.lower()
print("Correct Recipe opened")
print("Test Passed!")

# Close the browser
browser.quit()

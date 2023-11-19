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

# Locate the search bar, enter a recipe name
search_bar = browser.find_element(By.ID,'search_box')
query = "Pasta"
search_bar.send_keys(query)

# Assertions to check if suggestions are displayed
time.sleep(2)  # Wait for results to load
suggestions = browser.find_elements(By.CLASS_NAME,'suggestionItem')
# print(suggestions)
assert len(suggestions) > 0
print("Suggestions are shown")
for suggestion in suggestions: title_element = suggestion.text
assert query in title_element
print("Suggestions contain the query")
print("Tests Passed!")

# Close the browser
browser.quit()

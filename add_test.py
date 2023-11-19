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

# Locate the Add Recipes button and click on it
add_rec_btn = browser.find_element(By.ID, 'add_recipe_btn')
add_rec_btn.click()

new_recipe = {
    "dishName": "New Main Course",
    "preparationTime":123,
    "servings":2,
    "weightPerServing":250,
    "dishType":"Main Course",
    "ingredientName":"New Ingredient",
    "ingredientAmount":123,
    "ingredientUnit":"New Unit",
    "stepNumber":1,
    "instruction":"New Instruction"
}
# Locate the input boxes and enter data, then click on submit
dish_name = browser.find_element(By.ID,'dishName')
dish_name.send_keys(new_recipe['dishName'])
prepTime = browser.find_element(By.ID,'preparationTime')
prepTime.send_keys(new_recipe['preparationTime'])
servings = browser.find_element(By.ID,'servings')
servings.send_keys(new_recipe['servings'])
weightPerServing = browser.find_element(By.ID,'weightPerServing')
weightPerServing.send_keys(new_recipe['weightPerServing'])
dishTypeName = ""
if ' ' in new_recipe['dishType']:
    dishTypeName = new_recipe['dishType'].lower().split(' ')
    dishTypeName = ('-').join(dishTypeName)
else:
    dishTypeName = new_recipe['dishType'].lower()
dishType = browser.find_element(By.ID, (dishTypeName))
dishType.click()

ingredientContainer = browser.find_element(By.CSS_SELECTOR,'#ingredientContainer div')
ingredientName = ingredientContainer.find_element(By.NAME,'ingredientName')
ingredientName.send_keys(new_recipe['ingredientName'])
ingredientAmount = ingredientContainer.find_element(By.NAME,'ingredientAmount')
ingredientAmount.send_keys(new_recipe['ingredientAmount'])
ingredientUnit = ingredientContainer.find_element(By.NAME,'ingredientUnit')
ingredientUnit.send_keys(new_recipe['ingredientUnit'])

instructionContainer = browser.find_element(By.CSS_SELECTOR,'#instructionContainer div')
stepNumber = instructionContainer.find_element(By.NAME,'stepNumber')
stepNumber.send_keys(new_recipe['stepNumber'])
instruction = instructionContainer.find_element(By.NAME,'instruction')
instruction.send_keys(new_recipe['instruction'])


submit_button = browser.find_elements(By.CLASS_NAME,'submit-button')[0]
submit_button.click()

time.sleep(5)  # Wait for Recipe Addition Feedback to show

# Locate the search bar, enter a recipe name, and click search
search_bar = browser.find_element(By.ID,'search_box')
query = new_recipe['dishName']
search_bar.send_keys(query)
search_button = browser.find_element(By.ID,'search_button')
search_button.click()

# Assertions to check if search results are displayed
time.sleep(2)  # Wait for results to load
page_heading = browser.find_element(By.CSS_SELECTOR,'.page-heading h1').text
# print(page_heading.lower())
assert query.lower() in page_heading.lower()
print("New Recipe correctly added")
print("Test Passed!")

time.sleep(5)  # Wait to show Added Recipe
# Close the browser
browser.quit()

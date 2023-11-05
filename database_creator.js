import axios from "axios";
import mongoose from "mongoose";

mongoose.connect("mongodb://127.0.0.1:27017/recipeDB", { useNewUrlParser: true });

const nutritionObj = {
    Name: String,
    Amount: Number,
    Unit: String
};
const recipeSchema = new mongoose.Schema({
    _id: Number,
    "Dish Name": {
        type: String,
        unique: true
    },
    "Ready in minutes": Number,
    Servings: Number,
    Nutrients: [nutritionObj],
    Properties: [nutritionObj],
    Flavonoids: [nutritionObj],
    Ingredients: [{
        _id: Number,
        Name: String,
        Amount: Number,
        Unit: String
    }],
    "Caloric Breakdown": {
        "Percentage Protein": Number,
        "Percentage Fat": Number,
        "Percentage Carbohydrates": Number
    },
    "Weight per serving in grams": Number,
    Cuisine: [String],
    "Dish Type": [String],
    "Diet Type": [String],
    Instructions: [{
        step: Number,
        instruction: String
    }]
});

const Recipe = mongoose.model("Recipe", recipeSchema);

const API_URL = "https://api.spoonacular.com/recipes/complexSearch";
const apiKey = YOUR_SPOONACULAR_API_KEY;

async function getData(type, number, offset) {
    var count = 0;
    const config = {
        params: {
            apiKey: apiKey,
            addRecipeInformation: true,
            addRecipeNutrition: true,
            fillIngredients: true,
            type: type,
            number: number,
            offset: offset
        }
    };

    try {
        const response = await axios.get(API_URL, config);
        const recipes = response.data.results;
        function getValues(item) {
            return {
                Name: item.name,
                Amount: item.amount,
                Unit: item.unit
            };
        }
        const processedIds = new Set();
        for (var i = 0; i < recipes.length; i++) {
            console.log(++count);
            if (processedIds.has(recipes[i].id)) {
                console.log(`Recipe with _id ${recipes[i].id} already processed, skipping.`);
                continue;
            }
            try {
                const nutrients = await Promise.all(
                    recipes[i].nutrition.nutrients.map(async (nutrient) => {
                        return getValues(nutrient);
                    })
                );

                const properties = await Promise.all(
                    recipes[i].nutrition.properties.map(async (property) => {
                        return getValues(property);
                    })
                );

                const flavonoids = await Promise.all(
                    recipes[i].nutrition.flavonoids.map(async (flavonoid) => {
                        return getValues(flavonoid);
                    })
                );

                const ingredients = await Promise.all(
                    recipes[i].nutrition.ingredients.map(async (ingredient) => {
                        return {
                            _id: ingredient.id,
                            Name: ingredient.name,
                            Amount: ingredient.amount,
                            Unit: ingredient.unit
                        };
                    })
                );

                const instructions = await Promise.all(
                    recipes[i].analyzedInstructions.map(async (instruction) => {
                        return instruction.steps.map((step) => ({
                            step: step.number,
                            instruction: step.step
                        }));
                    })
                );

                const cuisines = await Promise.all(
                    recipes[i].cuisines.map((cuisine => {
                        return cuisine;
                    }))
                );

                const dishtypes = await Promise.all(
                    recipes[i].dishTypes.map((dishType => {
                        return dishType;
                    }))
                );

                const diets = await Promise.all(
                    recipes[i].diets.map((diet => {
                        return diet;
                    }))
                );

                const rec = new Recipe({
                    _id: recipes[i].id,
                    "Dish Name": recipes[i].title,
                    "Ready in minutes": recipes[i].readyInMinutes,
                    Servings: recipes[i].servings,
                    Nutrients: nutrients,
                    Properties: properties,
                    Flavonoids: flavonoids,
                    Ingredients: ingredients,
                    'Caloric Breakdown': {
                        "Percentage Protein": recipes[i].nutrition.caloricBreakdown.percentProtein,
                        "Percentage Fat": recipes[i].nutrition.caloricBreakdown.percentFat,
                        "Percentage Carbohydrates": recipes[i].nutrition.caloricBreakdown.percentCarbs
                    },
                    "Weight per serving in grams": recipes[i].nutrition.weightPerServing.amount,
                    Cuisine: cuisines,
                    "Dish Type": dishtypes,
                    "Diet Type": diets,
                    Instructions: instructions.flat()
                });

                const savedRecipe = await rec.save();
                console.log("Saved Recipe: ", savedRecipe);
                processedIds.add(recipes[i].id);
            }
            catch (error) {
                console.error("Error saving Recipe: ", error);
            }
        }
    }
    catch (error) {
        console.log("Error in fetching data from API: " + error);
    }
}

//Getting the lunch/dinner recipes-
for (var i = 0; i <= 900; i += 100) {
    getData("lunch", 100, i);
}

//Getting the dessert recipes-
for (var i = 0; i <= 900; i += 100) {
    getData("dessert", 100, i);
}

//Getting the appetizer/snack recipes-
for (var i = 0; i <= 900; i += 100) {
    getData("snack", 100, i);
}

//Getting the salad recipes-
for (var i = 0; i <= 200; i += 100) {
    getData("salad", 100, i);
}
getData("salad", 53, 200);

//Getting the bread dish recipes-
getData("bread", 51, 0);

//Getting the breakfast recipes-
for (var i = 0; i <= 400; i += 100) {
    getData("breakfast", 100, i);
}
getData("breakfast", 59, 400);

//Getting the soup recipes-
for (var i = 0; i <= 400; i += 100) {
    getData("soup", 100, i);
}
getData("soup", 17, 400);

//Getting the beverage/drink recipes-
getData("drink", 100, 0);
getData("drink", 34, 100);

//Getting the sauce recipes-
getData("sauce", 73, 0);

//Getting the marinade recipes-
getData("marinade", 5, 0);

//Getting the fingerfood recipes-
getData("fingerfood", 79, 0);


const nutrientSchema = new mongoose.Schema({
    _id: Number,
    name: String,
    count: Number,
    max: Number,
    min: Number,
    unit: [String]
});

const Nutrient = mongoose.model("Nutrient", nutrientSchema);
const Property = mongoose.model("Property", nutrientSchema);
const Flavonoid = mongoose.model("Flavonoid", nutrientSchema);

async function ingredientDB() {
    try {
        const recipes = await Recipe.find();
        var nutrientDetails = {}
        var propertyDetails = {}
        var flavonoidDetails = {}
        recipes.forEach((recipe) => {
            recipe.Nutrients.forEach((nutrient) => {
                if (nutrientDetails[nutrient.Name] === undefined) {
                    nutrientDetails[nutrient.Name] = {
                        name: nutrient.Name,
                        count: 1,
                        max: nutrient.Amount,
                        min: nutrient.Amount,
                        unit: [nutrient.Unit]
                    };
                }
                else {
                    nutrientDetails[nutrient.Name] = {
                        name: nutrient.Name,
                        count: nutrientDetails[nutrient.Name].count + 1,
                        max: nutrient.Amount > nutrientDetails[nutrient.Name].max ? nutrient.Amount : nutrientDetails[nutrient.Name].max,
                        min: nutrient.Amount < nutrientDetails[nutrient.Name].min ? nutrient.Amount : nutrientDetails[nutrient.Name].min,
                        unit: nutrientDetails[nutrient.Name].unit.includes(nutrient.Unit) ? nutrientDetails[nutrient.Name].unit : nutrientDetails[nutrient.Name].unit.push(nutrient.Unit)
                    };
                }
            })
            recipe.Properties.forEach((property) => {
                if (propertyDetails[property.Name] === undefined) {
                    propertyDetails[property.Name] = {
                        name: property.Name,
                        count: 1,
                        max: property.Amount,
                        min: property.Amount,
                        unit: [property.Unit]
                    };
                }
                else {
                    propertyDetails[property.Name] = {
                        name: property.Name,
                        count: propertyDetails[property.Name].count + 1,
                        max: property.Amount > propertyDetails[property.Name].max ? property.Amount : propertyDetails[property.Name].max,
                        min: property.Amount < propertyDetails[property.Name].min ? property.Amount : propertyDetails[property.Name].min,
                        unit: propertyDetails[property.Name].unit.includes(property.Unit) ? propertyDetails[property.Name].unit : propertyDetails[property.Name].unit.push(property.Unit)
                    };
                }
            })
            recipe.Flavonoids.forEach((flavonoid) => {
                if (flavonoidDetails[flavonoid.Name] === undefined) {
                    flavonoidDetails[flavonoid.Name] = {
                        name: flavonoid.Name,
                        count: 1,
                        max: flavonoid.Amount,
                        min: flavonoid.Amount,
                        unit: flavonoid.Amount == 0 ? [] : [flavonoid.Unit]
                    };
                }
                else {
                    flavonoidDetails[flavonoid.Name] = {
                        name: flavonoid.Name,
                        count: flavonoidDetails[flavonoid.Name].count + 1,
                        max: flavonoid.Amount > flavonoidDetails[flavonoid.Name].max ? flavonoid.Amount : flavonoidDetails[flavonoid.Name].max,
                        min: flavonoid.Amount < flavonoidDetails[flavonoid.Name].min ? flavonoid.Amount : flavonoidDetails[flavonoid.Name].min,
                        unit: flavonoid.Amount == 0 ? flavonoidDetails[flavonoid.Name].unit : [flavonoid.Unit]
                    };
                }
            })
        });
        // console.log(nutrientDetails);
        // console.log(propertyDetails);
        // console.log(flavonoidDetails);

        const nutrients = [];
        const properties = [];
        const flavonoids = [];

        // Object.entries(object) will return an array of arrays, where each sub-array has the key name as first element and value as second element
        Object.entries(nutrientDetails).forEach((nutrient) => {
            if (nutrient[1].count == 3638) {
                nutrients.push(new Nutrient(nutrient[1]));
            }
        });
        Object.entries(propertyDetails).forEach((property) => {
            properties.push(new Property(property[1]));
        });
        Object.entries(flavonoidDetails).forEach((flavonoid) => {
            flavonoids.push(new Flavonoid(flavonoid[1]));
        });

        // console.log(nutrients);


        try {
            await Nutrient.insertMany(nutrients);
            await Property.insertMany(properties);
            await Flavonoid.insertMany(flavonoids);
            console.log("Successfully added all nutrient details");
        }
        catch (error) {
            console.log(error);
        }
    }
    catch (error) {
        console.log(error);
    }
}

// ingredientDB();

async function cuisines() {
    try {
        const recipes = await Recipe.find();
        var cuisines = {}
        recipes.forEach((recipe) => {
            if ((recipe.Cuisine).length == 0) {
                if (cuisines["None"] === undefined)
                    cuisines["None"] = 1
                else cuisines["None"] += 1
            }
            else {
                recipe.Cuisine.forEach((cuisine) => {
                    if (cuisines[cuisine] === undefined) {
                        cuisines[cuisine] = 1;
                    }
                    else {
                        cuisines[cuisine] += 1;
                    }
                });
            }

        });
        console.log(cuisines);
    }
    catch (error) {
        console.log(error);
    }
}

async function dishTypes() {
    try {
        const recipes = await Recipe.find();
        var dishTypes = {}
        recipes.forEach((recipe) => {
            if ((recipe["Dish Type"]).length == 0) {
                if (dishTypes["None"] === undefined)
                    dishTypes["None"] = 1
                else dishTypes["None"] += 1
            }
            else {
                recipe["Dish Type"].forEach((dishType) => {
                    if (dishTypes[dishType] === undefined) {
                        dishTypes[dishType] = 1;
                    }
                    else {
                        dishTypes[dishType] += 1;
                    }
                });
            }
        });
        console.log(dishTypes);
    }
    catch (error) {
        console.log(error);
    }
}

async function dietTypes() {
    try {
        const recipes = await Recipe.find();
        var dietTypes = {}
        recipes.forEach((recipe) => {
            if ((recipe["Diet Type"]).length == 0) {
                if (dietTypes["None"] === undefined)
                    dietTypes["None"] = 1
                else dietTypes["None"] += 1
            }
            else {
                recipe["Diet Type"].forEach((dietType) => {
                    if (dietTypes[dietType] === undefined) {
                        dietTypes[dietType] = 1;
                    }
                    else {
                        dietTypes[dietType] += 1;
                    }
                });
            }

        });
        console.log(dietTypes);
    }
    catch (error) {
        console.log(error);
    }
}

//cuisines();
dishTypes();
//dietTypes();
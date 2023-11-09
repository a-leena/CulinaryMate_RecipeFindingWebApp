import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

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
},
    { collection: 'recipes' });

const Recipe = mongoose.model("Recipe", recipeSchema);

const app = express();
const port = 3000;
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

function getImages(foldername) {
    const directoryPath = "Images/" + foldername;
    var imageList = [];

    fs.readdir("./Public/" + directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
        } else {
            files.forEach(file => {
                // console.log(file);
                if (file.match(/\.(jpeg|jpg|png|gif)$/)) {
                    const imagePath = path.join("/" + directoryPath, file);
                    imageList.push(imagePath);
                    // console.log(imageList);
                    // console.log(imagePath);
                }
                else { console.log("no matches"); }
            });
        }
    });
    return imageList;
}

const homeImages = getImages("dish_images");
// const recipeImages = getImages("recipes");

app.get("/", async (req, res) => {
    //console.log(homeImages);
    try {
        const recipes = await Recipe.find({}, { 'Dish Name': 1, _id: 0 });
        var searchRecipes = [];
        recipes.forEach((recipe) => {
            searchRecipes.push(recipe['Dish Name']);
        });
        res.render("home.ejs", { imageList: homeImages, searchRecipes: searchRecipes });
    }
    catch (error) {
        console.log(error);
    }
    
});

const typesNames = ["Breakfast", "Starters & Appetizers", "Main Course", "Side-Dish", "Soup", "Salad", "Desserts", "Beverage", "Bread", "Fingerfood", "Sauce & Condiments", "Seasoning"];

app.get("/find-recipes", async (req, res) => {
    try {
        const recipes = await Recipe.find({}, {'Dish Name':1,'Dish Type': 1,_id: 0 });
        var searchRecipes = [];
        recipes.forEach((recipe) => {
            searchRecipes.push(recipe['Dish Name']);
        });
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
        // console.log(dishTypes);
        var sauceCondimentCount = 0;
        recipes.forEach((recipe) => {
            if (recipe['Dish Type'].some(type => ['sauce', 'condiment'].includes(type))) {
                sauceCondimentCount++;
            }
        });
        const typesCounts = [
            [typesNames[0], dishTypes.breakfast],
            [typesNames[1], dishTypes.starter],
            [typesNames[2], dishTypes["main course"]],
            [typesNames[3], dishTypes["side dish"]],
            [typesNames[4], dishTypes.soup],
            [typesNames[5], dishTypes.salad],
            [typesNames[6], dishTypes.dessert],
            [typesNames[7], dishTypes.beverage],
            [typesNames[8], dishTypes.bread],
            [typesNames[9], dishTypes.fingerfood],
            [typesNames[10], sauceCondimentCount],
            [typesNames[11], dishTypes.seasoning]
        ]
        //console.log(recipeImages);
        res.render("find.ejs", {
            nameCountList: typesCounts,
            imageDirectory: "/Images/recipes",
            searchRecipes: searchRecipes
        });
    }
    catch (error) {
        console.log(error);
    }


});

const sorters = [
    ['extra-ingredients', 'Extra Ingredients'],
    ['preparation-time', 'Ready in minutes'],
    ['calories', 'Calories'],
    ['sugar', 'Sugar'],
    ['cholesterol', 'Cholesterol'],
    ['glycemic-index', 'Glycemic Index'],
    ['glycemic-load', 'Glycemic Load'],
    ['nutrition-score', 'Nutrition Score'],
    ['percentage-protein', 'Percentage Protein'],
    ['percentage-fat', 'Percentage Fat'],
    ['percentage-carbohydrates', 'Percentage Carbohydrates']
];

const dbTypesNames = [
    ["breakfast", "brunch", "morning meal"],
    ["starter", "antipasto", "antipasti", "snack", "appetizer", "hor d'oeuvre"],
    ["main course", "lunch", "main dish", "dinner"],
    ["side dish"],
    ["soup"],
    ["salad"],
    ["dessert"],
    ["beverage", "drink"],
    ["bread"],
    ["fingerfood"],
    ["sauce", "condiment", "dip", "spread"],
    ["seasoning", "marinade"]
]
var typesMapping = {};
for (let i = 0; i < typesNames.length; i++) {
    typesMapping[typesNames[i]] = dbTypesNames[i];
}

app.post("/results", async (req, res) => {
    const dishTypeName = req.body.dishTypeName;
    console.log(dishTypeName);
    try {
        const recipes = await Recipe.find();
        var searchRecipes = [];
        recipes.forEach((recipe) => {
            searchRecipes.push(recipe['Dish Name']);
        });
        var dishNames = [];
        var dishes = [];
        const allLists = getList(recipes);
        recipes.forEach((recipe) => {
            if (recipe['Dish Type'].some(item => typesMapping[dishTypeName].includes(item))) {
                dishNames.push(recipe['Dish Name']);
                dishes.push(recipe);
            }
        });
        res.render("results.ejs", {
            searchRecipes: searchRecipes,
            dishTypeName: dishTypeName,
            dishNames: dishNames,
            dishes: dishes,
            ingredientList: allLists.ingredientList,
            cuisineList: allLists.cuisineList,
            dietList: allLists.dietList,
            sorters: sorters
        });
    }
    catch (error) {
        console.log(error);
    }

});

app.post("/filtered-results", async (req, res) => {
    console.log(req.body);
    // Filters
    const ingredients_required = req.body.ingredients.length === 0 ? [] : req.body.ingredients.toLowerCase().split("||");
    console.log(ingredients_required);
    const cuisine_required = req.body.cuisines.length === 0 ? [] : req.body.cuisines.split("||");
    console.log(cuisine_required);
    const diet_required = req.body.diets.length === 0 ? [] : req.body.diets.split("||");
    console.log(diet_required);
    const sortInputs = req.body.sorts.length === 0 ? [] : req.body.sorts.split("||");

    const dishTypeName = req.body.dishType;
    const dishNames = req.body.dishNames.split("||");
    //console.log(dishNames);

    const num_req_ingredients = ingredients_required.length;

    var recipesOfType = [];
    var filteredRecipes = [];
    var intermediate = [];

    try {
        const recipes = await Recipe.find();
        var searchRecipes = [];
        recipes.forEach((recipe) => {
            searchRecipes.push(recipe['Dish Name']);
        });
        const allLists = getList(recipes);
        //let i=0;
        recipes.forEach((recipe) => {
            if (dishNames.includes(recipe['Dish Name'])) {
                //i++;
                //console.log(i+" "+recipe['Dish Name']);
                recipesOfType.push(recipe);
            }
        });
        console.log(recipesOfType.length);

        // 1st Filter out recipes by Ingredients
        if (ingredients_required.length !== 0) {
            var contains_all = [], contains_some = [], contains_one = [];
            recipesOfType.forEach((recipe) => {
                var count = findMatchCount(recipe.Ingredients.map(obj => obj.Name.toLowerCase()));
                if (count === num_req_ingredients) {
                    contains_all.push(recipe);
                }
                else if (count > 1 && count < num_req_ingredients) {
                    contains_some.push(recipe);
                }
                else if (count === 1) {
                    contains_one.push(recipe);
                }
            });
            let arrays = [contains_all, contains_some, contains_one];
            arrays.forEach((array) => {
                array.forEach((item) => {
                    intermediate.push(item);
                });
            });
        }
        else {
            intermediate = recipesOfType;
            //console.log("executing?");
            //let i=0;
            // intermediate.forEach((recipe) => {
            //i++;
            //console.log(i+" "+recipe['Dish Name']);
            // });
        }
        console.log(intermediate.length);

        let intermediate1 = [], intermediate2 = [];
        function cuisine_diet_filter(required_array, original_array, key) {
            var changed_array = [];
            //console.log(required_array.length);
            if (required_array.length === 0 || (required_array.length === 1 && required_array[0] === 'Any')) {
                //console.log("executing?");
                original_array.forEach((recipe) => {
                    changed_array.push(recipe);
                });
            }
            else {
                original_array.forEach((recipe) => {
                    if (required_array.some(req => recipe[key].includes(req))) {
                        changed_array.push(recipe);
                    }
                });
                if (required_array.includes('Any')) {
                    original_array.forEach((recipe) => {
                        if (!changed_array.includes(recipe)) {
                            changed_array.push(recipe);
                        }
                    });
                }
            }
            return changed_array;
        }

        // 2nd Filter out recipes by Cuisines
        intermediate1 = cuisine_diet_filter(cuisine_required, intermediate, 'Cuisine');
        // intermediate1.forEach((recipe)=>{
        //     console.log(recipe['Dish Name']);
        // });
        console.log(intermediate1.length);

        // 3rd Filter out recipes by Diets
        intermediate2 = cuisine_diet_filter(diet_required, intermediate1, 'Diet Type');
        let i = 0;
        intermediate2.forEach((recipe) => {
            i++;
            console.log(i + " " + recipe['Dish Name']);
        });
        console.log(intermediate2.length);

        //Apply Sort
        if (sortInputs.length !== 0) {
            var required_sorters = [];
            sortInputs.forEach((sortInput) => {
                const sortInfo = sortInput.split("-");
                required_sorters.push({
                    index: parseInt(sortInfo[0]),
                    type: sortInfo[1]
                });
            });
            required_sorters.forEach((req_sorter) => {
                if (req_sorter.type === 'ascending') {
                    intermediate2.sort(function (a, b) {
                        return ascendingSort(getMeasure(a)[req_sorter.index], getMeasure(b)[req_sorter.index]);
                    });
                }
                else {
                    intermediate2.sort(function (a, b) {
                        return descendingSort(getMeasure(a)[req_sorter.index], getMeasure(b)[req_sorter.index]);
                    });
                }
                console.log(sorters[req_sorter.index][1]);
                i = 0;
                intermediate2.forEach((recipe) => {
                    i++;
                    console.log(i + " " + recipe['Dish Name']);
                });
            });
        }

        filteredRecipes = intermediate2;
        i = 0;
        filteredRecipes.forEach((recipe) => {
            i++;
            console.log(i + " " + recipe['Dish Name']);
        });

        var filteredDishNames = [];
        filteredRecipes.forEach((recipe) => {
            filteredDishNames.push(recipe['Dish Name']);
        });
        res.render("results.ejs", {
            searchRecipes: searchRecipes,
            dishTypeName: dishTypeName,
            dishNames: filteredDishNames,
            dishes: filteredRecipes,
            ingredientList: allLists.ingredientList,
            cuisineList: allLists.cuisineList,
            dietList: allLists.dietList,
            sorters: sorters
        });

    }
    catch (error) {
        console.log(error);
    }

    function findMatchCount(ingredients) {
        let count = 0;
        // get the number of ingredients in the recipe that match with requirement
        ingredients_required.forEach((req_ing) => {
            ingredients.forEach((ingredient) => {
                if (ingredient.includes(req_ing)) {
                    count++;
                }
                else {
                    let bool = false;
                    ingredient.split(" ").forEach((word) => {
                        if (req_ing.includes(word)) {
                            bool = true;
                        }
                    });
                    if (bool) {
                        count++;
                    }
                }
            });
        });
        return count;
    }

    function getMeasure(recipe) {
        var array = [];
        // 0 extra-ingredients
        const ingredients = recipe.Ingredients.map(obj => obj.Name.toLowerCase());
        const num_extra_ingredients = ingredients.length - findMatchCount(ingredients);
        array.push(num_extra_ingredients);

        // 1 preparation-time
        array.push(recipe[sorters[1][1]]);

        // 2 calories
        array.push(getNutrientAmount(sorters[2][1]));

        // 3 sugar
        array.push(getNutrientAmount(sorters[3][1]));

        // 4 cholesterol
        array.push(getNutrientAmount(sorters[4][1]));

        // 5 glycemic-index
        array.push(recipe.Properties[0].Amount);

        // 6 glycemic-load
        array.push(recipe.Properties[1].Amount);

        // 7 nutrition-score
        array.push(recipe.Properties[2].Amount);

        // 8 percentage-protein
        array.push(recipe['Caloric Breakdown'][sorters[8][1]]);

        // 9 percentage-fat
        array.push(recipe['Caloric Breakdown'][sorters[9][1]]);

        // 10 percentage-carbohydrates
        array.push(recipe['Caloric Breakdown'][sorters[10][1]]);

        function getNutrientAmount(name) {
            recipe.Nutrients.forEach((nutrient) => {
                if (nutrient.Name === name) {
                    return nutrient.Amount;
                }
            });
            return -1;
        }
        return array;
    }
    function ascendingSort(a, b) {
        return a - b;
    }
    function descendingSort(a, b) {
        return b - a;
    }
});

app.post("/show-recipe", async (req, res) => {
    console.log(typeof req.body.selectedDish);
    console.log(req.body.selectedDish);
    console.log(req.body.recipeName);
    var dish = [];
    if (req.body.selectedDish) {
        dish.push(JSON.parse(req.body.selectedDish));
    }
    else if (req.body.recipeName) {
        if (req.body.recipeName.length === 0) {
            const backURL = req.header('Referer');
            console.log(backURL);
            res.redirect(backURL);
        }
        else {
            try {
                const recipes = await Recipe.find();
                recipes.forEach((recipe) => {
                    if (req.body.recipeName.toLowerCase().trim() === recipe['Dish Name'].toLowerCase()) {
                        dish.push(recipe);
                    }
                });
            }
            catch (error) {
                console.log(error);
            }
        }
    }
    try {
        const recipes = await Recipe.find({}, { 'Dish Name': 1, _id: 0 });
        var searchRecipes = [];
        recipes.forEach((recipe) => {
            searchRecipes.push(recipe['Dish Name']);
        });
        res.render("recipe.ejs", { dishSearched: dish[0], searchRecipes: searchRecipes });
    }
    catch (error) {
        console.log(error);
    }
});

app.get("/add-recipes", async (req, res) => {
    try {
        const recipes = await Recipe.find();
        var searchRecipes = [];
        recipes.forEach((recipe) => {
            searchRecipes.push(recipe['Dish Name']);
        });
        const allLists = getList(recipes);
        res.render("add.ejs", {
            searchRecipes: searchRecipes,
            dishTypes: typesNames,
            dietTypes: allLists.dietList,
            cuisines: allLists.cuisineList
        });
    }
    catch (error) {
        console.log(error);
    }
});

app.post("/submit-recipe", async (req, res) => {
    const rec = req.body;
    const nutrients = [
        {
            Name: "Calories",
            Amount: rec.calories === '' ? 0 : parseFloat(rec.calories),
            Unit: "kcal"
        },
        {
            Name: "Sugar",
            Amount: rec.sugar === '' ? 0 : parseFloat(rec.sugar),
            Unit: "g"
        },
        {
            Name: "Cholesterol",
            Amount: rec.cholesterol === '' ? 0 : parseFloat(rec.cholesterol),
            Unit: "mg"
        }
    ];
    const properties = [
        {
            Name: "Glycemic Index",
            Amount: rec['glycemic-index'] === '' ? 0 : parseFloat(rec['glycemic-index']),
            Unit: ""
        },
        {
            Name: "Glycemic Load'",
            Amount: rec['glycemic-load'] === '' ? 0 : parseFloat(rec['glycemic-load']),
            Unit: ""
        },
        {
            Name: "Nutrition Score",
            Amount: rec['nutrition-score'] === '' ? 0 : parseFloat(rec['nutrition-score']),
            Unit: "%"
        }
    ];
    const ingredients = [];
    for (let i = 0; i < rec.ingredientName.length; i++) {
        ingredients.push({
            Name: rec.ingredientName[i].trim().toLowerCase(),
            Amount: parseFloat(rec.ingredientAmount[i]),
            Unit: rec.ingredientUnit[i]
        });
    }
    const addedDishTypes = [];
    if (Array.isArray(rec.dishType)){
        rec.dishType.forEach((type) => {
            addedDishTypes.push(typesMapping[type][0]);
        });
    }
    else {
        addedDishTypes.push(rec.dishType);
    }
    const instructions = [];
    for (let i = 0; i < rec.stepNumber.length; i++) {
        instructions.push({
            step: parseInt(rec.stepNumber[i]),
            instruction: rec.instruction[i].trim()
        });
    }
    var added_recipe = {
        "Dish Name": rec.dishName.trim(),
        "Ready in minutes": parseFloat(rec.preparationTime),
        Servings: parseInt(rec.servings),
        Nutrients: nutrients,
        Properties: properties,
        Flavonoids: [],
        Ingredients: ingredients,
        "Caloric Breakdown": {
            "Percentage Protein": rec['percentage-protein'] === '' ? 0 : parseFloat(rec['percentage-protein']),
            "Percentage Fat": rec['percentage-fat'] === '' ? 0 : parseFloat(rec['percentage-fat']),
            "Percentage Carbohydrates": rec['percentage-carbohydrates'] === '' ? 0 : parseFloat(rec['percentage-carbohydrates'])
        },
        "Weight per serving in grams": parseFloat(rec.weightPerServing),
        Cuisine: Array.isArray(rec.cuisine)?rec.cuisine:[rec.cuisine],
        "Dish Type": addedDishTypes,
        "Diet Type": Array.isArray(rec.dietType)?rec.dietType:[rec.dietType],
        Instructions: instructions
    };
    var feedback = "";
    try {
        await Recipe.insertMany([added_recipe]);
        console.log(`Successfully added new ${added_recipe['Dish Name']} to the recipe database!`);
        feedback = "Successfully added new recipe!";

    } catch (error) {
        console.log(error);
        feedback = "Failed to add new recipe. Try again."
    }
    try {
        const recipes = await Recipe.find();
        var searchRecipes = [];
        recipes.forEach((recipe) => {
            searchRecipes.push(recipe['Dish Name']);
        });
        const allLists = getList(recipes);
        res.render("add.ejs", {
            searchRecipes: searchRecipes,
            dishTypes: typesNames,
            dietTypes: allLists.dietList,
            cuisines: allLists.cuisineList,
            feedback: feedback
        });
    }
    catch (error) {
        console.log(error);
    }
    console.log(req.body);
});

app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
});


function getList(recipes) {
    var ingredientList = [];
    var cuisineList = [];
    var dietList = [];
    recipes.forEach((recipe) => {
        recipe.Ingredients.forEach((ingredientInfo) => {
            const ingredient = ingredientInfo.Name;
            if (!ingredientList.includes(ingredient)) {
                ingredientList.push(ingredient);
            }
        });
        recipe.Cuisine.forEach((cuisine) => {
            if (!cuisineList.includes(cuisine)) {
                cuisineList.push(cuisine);
            }
        });
        recipe['Diet Type'].forEach((diet) => {
            if (!dietList.includes(diet)) {
                dietList.push(diet);
            }
        });
    });
    return { ingredientList: ingredientList, cuisineList: cuisineList, dietList: dietList };
}
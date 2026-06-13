// ---------------------------------------------------------------------------
// PrepMaster AI - Application Logic
// Handles state management, dynamic recipe matching, cooking to-do generation,
// smart substitutions, budget calculation, and offline local storage caching.
// ---------------------------------------------------------------------------

// --- Global Application State ---
let state = {
    constraints: {
        diet: 'anything',
        budget: 20,
        time: { breakfast: 15, lunch: 20, dinner: 30 },
        pantry: ['olive oil', 'salt', 'pepper', 'garlic']
    },
    activeDay: {
        meals: [], // Selected meals
        groceryList: [], // Dynamically generated
        todoList: [], // Chronological cooking tasks
        totalCost: 0,
        completedTasks: []
    },
    substitutions: {} // Tracks user's active ingredient swaps
};

// --- Mock Recipes Database ---
const MEAL_DATABASE = {
    breakfast: [
        {
            id: 'b_smoothie',
            name: 'Protein Berry Smoothie Bowl',
            desc: 'A dense, delicious antioxidant bowl topped with chia seeds.',
            time: 8,
            cost: 3.50,
            diets: ['anything', 'vegetarian', 'vegan', 'gluten-free'],
            ingredients: [
                { name: 'mixed berries', qty: '1 cup', cost: 1.50, category: 'produce' },
                { name: 'chia seeds', qty: '1 tbsp', cost: 0.50, category: 'pantry' },
                { name: 'plant protein powder', qty: '1 scoop', cost: 1.00, category: 'pantry' },
                { name: 'almond milk', qty: '1 cup', cost: 0.50, category: 'dairy-alternative' }
            ],
            steps: [
                { time: '08:00 AM', duration: 4, text: 'Blend mixed berries, almond milk, and protein powder until smooth.' },
                { time: '08:04 AM', duration: 2, text: 'Pour smoothie into a bowl and garnish with chia seeds.' }
            ]
        },
        {
            id: 'b_toast',
            name: 'Avocado & Bacon Egg Toast',
            desc: 'Crunchy sourdough sourdough toast topped with mashed avocado, poached egg, and crispy bacon.',
            time: 15,
            cost: 5.50,
            diets: ['anything'],
            ingredients: [
                { name: 'sourdough bread', qty: '2 slices', cost: 1.00, category: 'bakery' },
                { name: 'avocado', qty: '1 whole', cost: 1.50, category: 'produce' },
                { name: 'eggs', qty: '2 large', cost: 0.80, category: 'dairy' },
                { name: 'bacon', qty: '2 strips', cost: 2.00, category: 'meat' },
                { name: 'olive oil', qty: '1 tsp', cost: 0.20, category: 'pantry' }
            ],
            steps: [
                { time: '08:00 AM', duration: 5, text: 'Fry bacon in a pan until crispy; toast the sourdough slices.' },
                { time: '08:05 AM', duration: 5, text: 'Fry or poach the eggs to your preference in bacon fat or olive oil.' },
                { time: '08:10 AM', duration: 5, text: 'Mash avocado on toast, lay bacon strips, and top with cooked eggs.' }
            ]
        },
        {
            id: 'b_scramble',
            name: 'Spinach & Feta Scramble',
            desc: 'Fluffy eggs scrambled with baby spinach and finished with crumbled feta.',
            time: 10,
            cost: 4.00,
            diets: ['anything', 'vegetarian', 'gluten-free', 'keto', 'mediterranean'],
            ingredients: [
                { name: 'eggs', qty: '3 large', cost: 1.20, category: 'dairy' },
                { name: 'baby spinach', qty: '1 cup', cost: 1.00, category: 'produce' },
                { name: 'feta cheese', qty: '1.5 oz', cost: 1.50, category: 'dairy' },
                { name: 'olive oil', qty: '1 tbsp', cost: 0.30, category: 'pantry' }
            ],
            steps: [
                { time: '08:00 AM', duration: 3, text: 'Whisk eggs in a bowl with a pinch of salt and pepper.' },
                { time: '08:03 AM', duration: 4, text: 'Heat olive oil in a pan, wilt spinach, and pour in the whisked eggs.' },
                { time: '08:07 AM', duration: 3, text: 'Scramble eggs gently on low heat, fold in feta cheese, and serve.' }
            ]
        },
        {
            id: 'b_oatmeal',
            name: 'Apple Cinnamon Oatmeal',
            desc: 'Warm rolled oats simmered in oat milk with fresh apples, cinnamon, and maple syrup.',
            time: 12,
            cost: 2.80,
            diets: ['anything', 'vegetarian', 'vegan', 'gluten-free'],
            ingredients: [
                { name: 'rolled oats', qty: '0.5 cup', cost: 0.50, category: 'pantry' },
                { name: 'oat milk', qty: '1 cup', cost: 0.60, category: 'dairy-alternative' },
                { name: 'apple', qty: '1 medium', cost: 1.00, category: 'produce' },
                { name: 'maple syrup', qty: '1 tbsp', cost: 0.70, category: 'pantry' }
            ],
            steps: [
                { time: '08:00 AM', duration: 3, text: 'Dice apple into bite-sized cubes; toss with a pinch of cinnamon.' },
                { time: '08:03 AM', duration: 7, text: 'Simmer rolled oats and apple cubes in oat milk on medium heat.' },
                { time: '08:10 AM', duration: 2, text: 'Pour oatmeal into a bowl, drizzle with maple syrup, and enjoy.' }
            ]
        }
    ],
    lunch: [
        {
            id: 'l_wrap',
            name: 'Smoked Turkey & Avocado Wrap',
            desc: 'Sliced turkey breast wrapped with creamy avocado, spinach, and garlic herb spread.',
            time: 10,
            cost: 5.00,
            diets: ['anything'],
            ingredients: [
                { name: 'tortilla wrap', qty: '1 large', cost: 0.80, category: 'bakery' },
                { name: 'smoked turkey breast', qty: '4 oz', cost: 2.20, category: 'meat' },
                { name: 'avocado', qty: '0.5 whole', cost: 0.75, category: 'produce' },
                { name: 'baby spinach', qty: '0.5 cup', cost: 0.50, category: 'produce' },
                { name: 'mayonnaise', qty: '1 tbsp', cost: 0.25, category: 'pantry' }
            ],
            steps: [
                { time: '12:30 PM', duration: 4, text: 'Slice turkey breast and mash avocado half with a fork.' },
                { time: '12:34 PM', duration: 6, text: 'Spread mayonnaise on tortilla, layer turkey, spinach, mashed avocado, roll up, and slice.' }
            ]
        },
        {
            id: 'l_salad',
            name: 'Mediterranean Chickpea Salad',
            desc: 'A zesty and fresh chopped cucumber, tomato, chickpea, and red onion salad with lemon dressing.',
            time: 12,
            cost: 4.20,
            diets: ['anything', 'vegetarian', 'vegan', 'gluten-free', 'mediterranean'],
            ingredients: [
                { name: 'canned chickpeas', qty: '1 can', cost: 1.20, category: 'pantry' },
                { name: 'cucumber', qty: '1 small', cost: 0.80, category: 'produce' },
                { name: 'cherry tomatoes', qty: '1 cup', cost: 1.50, category: 'produce' },
                { name: 'olive oil', qty: '1.5 tbsp', cost: 0.40, category: 'pantry' },
                { name: 'lemon juice', qty: '1 tbsp', cost: 0.30, category: 'produce' }
            ],
            steps: [
                { time: '12:30 PM', duration: 7, text: 'Rinse chickpeas; dice cucumber and halve cherry tomatoes.' },
                { time: '12:37 PM', duration: 5, text: 'Toss chickpeas and veggies in a bowl with olive oil, lemon juice, salt, and pepper.' }
            ]
        },
        {
            id: 'l_salmon_salad',
            name: 'Seared Salmon Avocado Salad',
            desc: 'Flaky pan-seared salmon served over mixed baby greens, cucumbers, and ripe avocado.',
            time: 20,
            cost: 9.50,
            diets: ['anything', 'gluten-free', 'keto', 'mediterranean'],
            ingredients: [
                { name: 'salmon fillet', qty: '5 oz', cost: 6.50, category: 'fish' },
                { name: 'avocado', qty: '0.5 whole', cost: 0.75, category: 'produce' },
                { name: 'salad greens', qty: '2 cups', cost: 1.50, category: 'produce' },
                { name: 'olive oil', qty: '1 tbsp', cost: 0.30, category: 'pantry' },
                { name: 'lemon juice', qty: '1 tbsp', cost: 0.45, category: 'produce' }
            ],
            steps: [
                { time: '12:15 PM', duration: 10, text: 'Season salmon with salt and pepper; sear in olive oil for 4 mins per side.' },
                { time: '12:25 PM', duration: 5, text: 'Toss salad greens, chopped avocado, and sliced cucumber in a bowl.' },
                { time: '12:30 PM', duration: 5, text: 'Flake the warm salmon over the salad, drizzle with fresh lemon juice.' }
            ]
        }
    ],
    dinner: [
        {
            id: 'd_shrimp_pasta',
            name: 'Lemon Garlic Shrimp Pasta',
            desc: 'Succulent shrimp sautéed with fresh garlic, white wine, and butter over fresh spaghetti.',
            time: 20,
            cost: 11.50,
            diets: ['anything', 'mediterranean'],
            ingredients: [
                { name: 'shrimp', qty: '6 oz', cost: 6.00, category: 'fish' },
                { name: 'spaghetti pasta', qty: '4 oz', cost: 1.00, category: 'pantry' },
                { name: 'butter', qty: '2 tbsp', cost: 0.80, category: 'dairy' },
                { name: 'garlic', qty: '3 cloves', cost: 0.40, category: 'produce' },
                { name: 'lemon juice', qty: '2 tbsp', cost: 0.60, category: 'produce' },
                { name: 'olive oil', qty: '1 tbsp', cost: 0.30, category: 'pantry' }
            ],
            steps: [
                { time: '06:30 PM', duration: 10, text: 'Boil water and cook spaghetti according to instructions until al dente.' },
                { time: '06:40 PM', duration: 6, text: 'Melt butter and olive oil in a pan; sauté minced garlic and shrimp until pink.' },
                { time: '06:46 PM', duration: 4, text: 'Drain pasta, toss directly into shrimp pan with lemon juice, salt, and pepper.' }
            ]
        },
        {
            id: 'd_lentil_curry',
            name: 'Creamy Coconut Lentil Curry',
            desc: 'Red lentils simmered in coconut milk, ginger, and curry spices served over rice.',
            time: 30,
            cost: 6.00,
            diets: ['anything', 'vegetarian', 'vegan', 'gluten-free'],
            ingredients: [
                { name: 'red lentils', qty: '0.75 cup', cost: 1.20, category: 'pantry' },
                { name: 'coconut milk', qty: '1 can', cost: 1.80, category: 'pantry' },
                { name: 'jasmine rice', qty: '0.75 cup', cost: 0.60, category: 'pantry' },
                { name: 'onion', qty: '0.5 whole', cost: 0.40, category: 'produce' },
                { name: 'garlic', qty: '2 cloves', cost: 0.30, category: 'produce' },
                { name: 'curry powder', qty: '1 tbsp', cost: 0.50, category: 'pantry' },
                { name: 'olive oil', qty: '1 tbsp', cost: 0.30, category: 'pantry' }
            ],
            steps: [
                { time: '06:30 PM', duration: 5, text: 'Rinse rice; combine with 1.5 cups water and steam in pot.' },
                { time: '06:35 PM', duration: 8, text: 'Finely chop onion and mince garlic; sauté in olive oil in deep pan.' },
                { time: '06:43 PM', duration: 15, text: 'Add curry powder, red lentils, coconut milk, and 1 cup water. Simmer on low heat until lentils are soft.' },
                { time: '06:58 PM', duration: 2, text: 'Serve warm curry over the steamed jasmine rice.' }
            ]
        },
        {
            id: 'd_steak_broccoli',
            name: 'Garlic Butter Steak & Broccoli',
            desc: 'Tender cubed sirloin steak seared in garlic butter and served with sautéed broccoli florets.',
            time: 25,
            cost: 14.50,
            diets: ['anything', 'gluten-free', 'keto'],
            ingredients: [
                { name: 'sirloin steak', qty: '8 oz', cost: 10.00, category: 'meat' },
                { name: 'broccoli florets', qty: '2 cups', cost: 2.00, category: 'produce' },
                { name: 'butter', qty: '2 tbsp', cost: 0.80, category: 'dairy' },
                { name: 'garlic', qty: '3 cloves', cost: 0.40, category: 'produce' },
                { name: 'olive oil', qty: '1 tbsp', cost: 0.30, category: 'pantry' }
            ],
            steps: [
                { time: '06:30 PM', duration: 5, text: 'Cube steak into bite-sized pieces; cut broccoli into small florets.' },
                { time: '06:35 PM', duration: 8, text: 'Steam broccoli in a pan with 2 tbsp of water and oil until tender-crisp.' },
                { time: '06:43 PM', duration: 8, text: 'In a separate high-heat pan, sear steak cubes in melted garlic butter and olive oil until browned.' },
                { time: '06:51 PM', duration: 4, text: 'Combine steak and broccoli together, season generously with pepper and serve.' }
            ]
        },
        {
            id: 'd_baked_cod',
            name: 'Baked Cod with Herbs & Tomato',
            desc: 'Mild cod fillets baked with sliced cherry tomatoes, kalamata olives, garlic, and fresh oregano.',
            time: 35,
            cost: 11.00,
            diets: ['anything', 'gluten-free', 'keto', 'mediterranean'],
            ingredients: [
                { name: 'cod fillet', qty: '6 oz', cost: 6.50, category: 'fish' },
                { name: 'cherry tomatoes', qty: '1 cup', cost: 1.50, category: 'produce' },
                { name: 'kalamata olives', qty: '2 oz', cost: 1.80, category: 'pantry' },
                { name: 'garlic', qty: '2 cloves', cost: 0.30, category: 'produce' },
                { name: 'olive oil', qty: '2 tbsp', cost: 0.60, category: 'pantry' }
            ],
            steps: [
                { time: '06:30 PM', duration: 5, text: 'Preheat oven to 400°F (200°C). Arrange cod fillets in a baking dish.' },
                { time: '06:35 PM', duration: 10, text: 'Toss halved cherry tomatoes, sliced olives, and minced garlic with olive oil.' },
                { time: '06:45 PM', duration: 20, text: 'Spoon the tomato-olive mixture over the cod. Bake in the oven until cod flakes easily.' }
            ]
        }
    ]
};

// --- Mock Ingredient Substitutions Reference ---
const SUBSTITUTION_DATABASE = {
    'bacon': [
        { name: 'avocado', reason: 'Healthy Fats / Vegetarian alternative', costDiff: -0.50, impact: 'cheaper' },
        { name: 'turkey bacon', reason: 'Leaner protein / Less fat', costDiff: 0.20, impact: 'pricier' }
    ],
    'shrimp': [
        { name: 'tofu (cubed)', reason: 'Vegan protein swap', costDiff: -3.50, impact: 'cheaper' },
        { name: 'chicken breast', reason: 'Traditional poultry option', costDiff: -2.00, impact: 'cheaper' }
    ],
    'sirloin steak': [
        { name: 'tofu (firm)', reason: 'Vegan / Massive budget savings', costDiff: -6.50, impact: 'cheaper' },
        { name: 'chicken thighs', reason: 'High-fat keto / Budget savings', costDiff: -5.00, impact: 'cheaper' },
        { name: 'portobello mushrooms', reason: 'Chewy vegetarian swap', costDiff: -4.00, impact: 'cheaper' }
    ],
    'salmon fillet': [
        { name: 'tofu (firm)', reason: 'Vegan/Vegetarian protein', costDiff: -3.50, impact: 'cheaper' },
        { name: 'canned tuna', reason: 'Ultimate budget meal swap', costDiff: -4.50, impact: 'cheaper' }
    ],
    'cod fillet': [
        { name: 'tilapia fillet', reason: 'Budget white fish alternative', costDiff: -2.50, impact: 'cheaper' },
        { name: 'tofu (firm)', reason: 'Vegan alternative', costDiff: -3.00, impact: 'cheaper' }
    ],
    'butter': [
        { name: 'olive oil', reason: 'Vegan & Heart-healthy fats', costDiff: -0.20, impact: 'cheaper' },
        { name: 'coconut oil', reason: 'Dairy-free fat swap', costDiff: 0.10, impact: 'pricier' }
    ],
    'smoked turkey breast': [
        { name: 'tofu slices', reason: 'Vegetarian deli replacement', costDiff: -0.50, impact: 'cheaper' },
        { name: 'hummus spread', reason: 'Creamy vegan base', costDiff: -1.00, impact: 'cheaper' }
    ],
    'spaghetti pasta': [
        { name: 'zucchini noodles', reason: 'Low carb / Keto / Gluten-free', costDiff: 1.00, impact: 'pricier' },
        { name: 'gluten-free spaghetti', reason: 'Gluten-free standard swap', costDiff: 0.50, impact: 'pricier' }
    ],
    'almond milk': [
        { name: 'oat milk', reason: 'Thicker, nut-free dairy swap', costDiff: 0.10, impact: 'neutral' },
        { name: 'whole milk', reason: 'Traditional dairy', costDiff: -0.10, impact: 'neutral' }
    ],
    'feta cheese': [
        { name: 'cashew feta', reason: 'Vegan cheese replacement', costDiff: 1.50, impact: 'pricier' }
    ]
};

// --- Initialization / DOM Elements ---
document.addEventListener('DOMContentLoaded', () => {
    // DOM Cache
    const themeToggleBtn = document.getElementById('theme-toggle');
    const constraintsForm = document.getElementById('constraints-form');
    const budgetInput = document.getElementById('budget-input');
    const budgetValue = document.getElementById('budget-value');
    const addPantryBtn = document.getElementById('add-pantry-btn');
    const pantryInput = document.getElementById('pantry-input');
    const pantryTags = document.getElementById('pantry-tags');
    
    const totalCostDisplay = document.getElementById('total-cost-display');
    const budgetProgress = document.getElementById('budget-progress');
    const budgetStatusText = document.getElementById('budget-status-text');
    const budgetMetricCard = document.getElementById('budget-metric');
    
    const taskCompletionDisplay = document.getElementById('task-completion-display');
    const taskProgress = document.getElementById('task-progress');
    const taskStatusText = document.getElementById('task-status-text');
    
    const groceryCountDisplay = document.getElementById('grocery-count-display');
    const groceryStatusText = document.getElementById('grocery-status-text');
    const grocerySectionCard = document.getElementById('grocery-section-card');
    
    const mealsContainer = document.getElementById('meals-container');
    const todoItemsList = document.getElementById('todo-items-list');
    const groceryCategories = document.getElementById('grocery-categories');
    
    const copyGroceryBtn = document.getElementById('copy-grocery-btn');
    const optimizeScheduleBtn = document.getElementById('optimize-schedule-btn');
    const totalPrepTimeDisplay = document.getElementById('total-prep-time');
    
    // Substitution modal cache
    const subModal = document.getElementById('sub-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const subOptionsList = document.getElementById('sub-options-list');
    const subIngName = document.getElementById('sub-ing-name');
    const subRecipeContext = document.getElementById('sub-recipe-context');
    const subCurrentCost = document.getElementById('sub-current-cost');

    let activeSubContext = null; // Tracks active substitution focus

    // Load constraints from LocalStorage if available
    loadStateFromStorage();

    // Re-initialize Lucide Icons
    lucide.createIcons();

    // Theme Toggle Handler
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        themeToggleBtn.innerHTML = isLight ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
        lucide.createIcons();
    });

    // Budget slider live display
    budgetInput.addEventListener('input', (e) => {
        budgetValue.textContent = `$${e.target.value}`;
    });

    // Add pantry tags
    addPantryBtn.addEventListener('click', () => {
        addPantryTag();
    });
    pantryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addPantryTag();
        }
    });

    // Constraints Form Submit
    constraintsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveConstraintsForm();
        generateMealPlan();
    });

    // Copy grocery items
    copyGroceryBtn.addEventListener('click', () => {
        copyGroceryListToClipboard();
    });

    // Optimize schedule prep
    optimizeScheduleBtn.addEventListener('click', () => {
        parallelizePrepSchedule();
    });

    // Close Modal
    closeModalBtn.addEventListener('click', () => {
        subModal.classList.remove('open');
    });
    subModal.addEventListener('click', (e) => {
        if (e.target === subModal) {
            subModal.classList.remove('open');
        }
    });

    // Render original pantry tags
    renderPantryTags();

    // Load active meals if they exist in cache
    if (state.activeDay.meals.length > 0) {
        renderAllDashboard();
    }

    // --- Core Functions ---

    function loadStateFromStorage() {
        const cached = localStorage.getItem('prepmaster_state');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                state = { ...state, ...parsed };
                // Make sure budget input aligns
                budgetInput.value = state.constraints.budget;
                budgetValue.textContent = `$${state.constraints.budget}`;
                document.getElementById('time-breakfast').value = state.constraints.time.breakfast;
                document.getElementById('time-lunch').value = state.constraints.time.lunch;
                document.getElementById('time-dinner').value = state.constraints.time.dinner;
                document.getElementById('diet-select').value = state.constraints.diet;
            } catch (err) {
                console.error("Error reading localStorage cache: ", err);
            }
        }
    }

    function saveStateToStorage() {
        localStorage.setItem('prepmaster_state', JSON.stringify(state));
    }

    function renderPantryTags() {
        pantryTags.innerHTML = '';
        state.constraints.pantry.forEach(item => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.innerHTML = `${item} <i data-lucide="x" data-item="${item}"></i>`;
            pantryTags.appendChild(tag);
        });
        
        // Add delete listeners
        pantryTags.querySelectorAll('i').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const itemToRemove = e.target.getAttribute('data-item');
                state.constraints.pantry = state.constraints.pantry.filter(x => x !== itemToRemove);
                renderPantryTags();
                saveStateToStorage();
                // If there's an active day, trigger re-calculation in case cost changes
                if (state.activeDay.meals.length > 0) {
                    calculateGroceryCost();
                    renderGroceryList();
                    renderMealPlan();
                }
            });
        });
        lucide.createIcons();
    }

    function addPantryTag() {
        const val = pantryInput.value.trim().toLowerCase();
        if (val && !state.constraints.pantry.includes(val)) {
            state.constraints.pantry.push(val);
            renderPantryTags();
            pantryInput.value = '';
            saveStateToStorage();
            // If there's an active day, trigger cost re-calculation
            if (state.activeDay.meals.length > 0) {
                calculateGroceryCost();
                renderGroceryList();
                renderMealPlan();
            }
        }
    }

    function saveConstraintsForm() {
        state.constraints.diet = document.getElementById('diet-select').value;
        state.constraints.budget = parseInt(budgetInput.value);
        state.constraints.time.breakfast = parseInt(document.getElementById('time-breakfast').value);
        state.constraints.time.lunch = parseInt(document.getElementById('time-lunch').value);
        state.constraints.time.dinner = parseInt(document.getElementById('time-dinner').value);
        saveStateToStorage();
    }

    // --- AI Simulation Engine ---
    function generateMealPlan() {
        const diet = state.constraints.diet;
        const timeLimit = state.constraints.time;

        // Select Breakfast
        const bOptions = MEAL_DATABASE.breakfast.filter(m => {
            const matchesDiet = diet === 'anything' || m.diets.includes(diet);
            const matchesTime = m.time <= timeLimit.breakfast;
            return matchesDiet && matchesTime;
        });
        // Select Lunch
        const lOptions = MEAL_DATABASE.lunch.filter(m => {
            const matchesDiet = diet === 'anything' || m.diets.includes(diet);
            const matchesTime = m.time <= timeLimit.lunch;
            return matchesDiet && matchesTime;
        });
        // Select Dinner
        const dOptions = MEAL_DATABASE.dinner.filter(m => {
            const matchesDiet = diet === 'anything' || m.diets.includes(diet);
            const matchesTime = m.time <= timeLimit.dinner;
            return matchesDiet && matchesTime;
        });

        // Fail-safe fallbacks if filters are too strict
        const breakfast = bOptions.length > 0 ? bOptions[0] : MEAL_DATABASE.breakfast[0];
        const lunch = lOptions.length > 0 ? lOptions[0] : MEAL_DATABASE.lunch[0];
        const dinner = dOptions.length > 0 ? dOptions[0] : MEAL_DATABASE.dinner[0];

        // Clone meals so we can apply ingredient substitutions locally
        state.activeDay.meals = JSON.parse(JSON.stringify([
            { ...breakfast, course: 'breakfast' },
            { ...lunch, course: 'lunch' },
            { ...dinner, course: 'dinner' }
        ]));

        // Clear active day's completed tasks
        state.activeDay.completedTasks = [];
        state.substitutions = {}; // Clear old swaps

        // Re-generate list and schedule
        calculateGroceryCost();
        compileCookingSchedule();
        renderAllDashboard();
        saveStateToStorage();
    }

    // Calculates cost based on active meal ingredients, filtering out pantry items
    function calculateGroceryCost() {
        let total = 0;
        const pantry = state.constraints.pantry;
        const items = [];

        state.activeDay.meals.forEach(meal => {
            meal.ingredients.forEach(ing => {
                // If user swapped this ingredient, get the modified info
                const swapKey = `${meal.id}_${ing.name}`;
                const activeSwap = state.substitutions[swapKey];
                
                const currentName = activeSwap ? activeSwap.name : ing.name;
                const currentCost = activeSwap ? (ing.cost + activeSwap.costDiff) : ing.cost;
                const currentQty = ing.qty; // simple mapping
                
                const isPantry = pantry.some(p => currentName.includes(p) || p.includes(currentName));
                
                items.push({
                    mealId: meal.id,
                    originalName: ing.name,
                    name: currentName,
                    qty: currentQty,
                    cost: currentCost,
                    category: ing.category,
                    isPantry: isPantry,
                    owned: isPantry
                });

                if (!isPantry) {
                    total += currentCost;
                }
            });
        });

        state.activeDay.groceryList = items;
        state.activeDay.totalCost = total;
    }

    // Compiles individual recipe steps chronologically
    function compileCookingSchedule() {
        const schedule = [];
        state.activeDay.meals.forEach(meal => {
            // Apply substitution wording in the steps if any exist
            meal.steps.forEach((step, idx) => {
                let text = step.text;
                meal.ingredients.forEach(ing => {
                    const swapKey = `${meal.id}_${ing.name}`;
                    const activeSwap = state.substitutions[swapKey];
                    if (activeSwap) {
                        // Regex swap of ingredient names in instructions
                        const regex = new RegExp(ing.name, 'gi');
                        text = text.replace(regex, activeSwap.name);
                    }
                });

                schedule.push({
                    id: `${meal.id}_step_${idx}`,
                    mealId: meal.id,
                    course: meal.course,
                    time: step.time,
                    duration: step.duration,
                    text: text
                });
            });
        });

        state.activeDay.todoList = schedule;
    }

    // --- Render Handlers ---

    function renderAllDashboard() {
        renderMetrics();
        renderMealPlan();
        renderTodoSchedule();
        renderGroceryList();
        
        // Show grocery section card
        grocerySectionCard.style.display = 'block';
        optimizeScheduleBtn.style.display = 'inline-flex';
    }

    function renderMetrics() {
        const budgetLimit = state.constraints.budget;
        const totalCost = state.activeDay.totalCost;
        
        // Budget display
        totalCostDisplay.textContent = `$${totalCost.toFixed(2)}`;
        const percent = Math.min((totalCost / budgetLimit) * 100, 100);
        budgetProgress.style.width = `${percent}%`;

        budgetMetricCard.className = 'metric-card';
        if (totalCost > budgetLimit) {
            budgetMetricCard.classList.add('over');
            budgetStatusText.innerHTML = `<span style="color:var(--color-danger);font-weight:700;">Over budget by $${(totalCost - budgetLimit).toFixed(2)}</span>`;
            document.querySelector('#budget-metric .metric-icon').className = 'metric-icon budget-over';
        } else {
            budgetStatusText.innerHTML = `<span style="color:var(--color-success);font-weight:700;">Within budget</span> ($${(budgetLimit - totalCost).toFixed(2)} left)`;
            document.querySelector('#budget-metric .metric-icon').className = 'metric-icon budget-ok';
        }

        // Checklist display
        const totalTasks = state.activeDay.todoList.length;
        const completedCount = state.activeDay.completedTasks.length;
        const taskPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
        
        taskCompletionDisplay.textContent = `${taskPercent}%`;
        taskProgress.style.width = `${taskPercent}%`;
        taskStatusText.textContent = `${completedCount} of ${totalTasks} steps completed`;

        // Grocery count
        const buyCount = state.activeDay.groceryList.filter(g => !g.owned).length;
        groceryCountDisplay.textContent = buyCount;
        groceryStatusText.textContent = buyCount > 0 ? `${buyCount} items to purchase` : 'All items in pantry!';
    }

    function renderMealPlan() {
        mealsContainer.innerHTML = '';
        state.activeDay.meals.forEach(meal => {
            const card = document.createElement('div');
            card.className = `meal-card ${meal.course}`;
            
            // Render ingredients pills
            const pillsHTML = meal.ingredients.map(ing => {
                const swapKey = `${meal.id}_${ing.name}`;
                const activeSwap = state.substitutions[swapKey];
                const displayName = activeSwap ? activeSwap.name : ing.name;
                const costVal = activeSwap ? (ing.cost + activeSwap.costDiff) : ing.cost;
                
                // check if owned in pantry
                const isOwned = state.constraints.pantry.some(p => displayName.includes(p) || p.includes(displayName));
                const pillClass = isOwned ? 'ing-pill pantry-owned' : 'ing-pill';
                
                return `<span class="${pillClass}" data-meal="${meal.id}" data-ing="${ing.name}" title="Click to swap/substitute">${ing.qty} ${displayName}</span>`;
            }).join('');

            card.innerHTML = `
                <div class="meal-banner">
                    <span class="meal-tag">${meal.course}</span>
                    <span class="meal-cost">Est. Cost: $${meal.cost.toFixed(2)}</span>
                </div>
                <div class="meal-body">
                    <h4 class="meal-title">${meal.name}</h4>
                    <p class="meal-desc">${meal.desc}</p>
                    <div class="meal-meta">
                        <span><i data-lucide="clock"></i> Active: ${meal.time}m</span>
                        <span><i data-lucide="info"></i> ${meal.ingredients.length} Ingredients</span>
                    </div>
                    <div class="meal-ingredients">
                        ${pillsHTML}
                    </div>
                </div>
            `;
            mealsContainer.appendChild(card);
        });

        // Add substitution trigger to ingredients pills
        mealsContainer.querySelectorAll('.ing-pill').forEach(pill => {
            pill.addEventListener('click', (e) => {
                const mealId = e.target.getAttribute('data-meal');
                const ingName = e.target.getAttribute('data-ing');
                openSubstitutionModal(mealId, ingName);
            });
        });
        
        lucide.createIcons();
    }

    function renderTodoSchedule() {
        todoItemsList.innerHTML = '';
        
        // Sum total active prep
        let totalPrep = 0;
        state.activeDay.todoList.forEach(task => {
            totalPrep += task.duration;
        });
        totalPrepTimeDisplay.textContent = `Total Active Prep: ${totalPrep} mins`;

        state.activeDay.todoList.forEach(task => {
            const step = document.createElement('div');
            const isCompleted = state.activeDay.completedTasks.includes(task.id);
            step.className = `todo-step ${task.course} ${isCompleted ? 'completed' : ''}`;
            step.setAttribute('data-id', task.id);

            step.innerHTML = `
                <div class="todo-step-dot"></div>
                <div class="todo-step-checkbox">
                    <i data-lucide="check"></i>
                </div>
                <div class="todo-step-content">
                    <div class="todo-step-time">
                        <i data-lucide="clock" style="width:12px;height:12px;"></i>
                        <span>${task.time} (${task.duration} mins)</span>
                        <span class="todo-step-tag">${task.course}</span>
                    </div>
                    <p class="todo-step-text">${task.text}</p>
                </div>
            `;
            
            // Add click listener
            step.addEventListener('click', () => {
                toggleTaskCompletion(task.id);
            });

            todoItemsList.appendChild(step);
        });

        lucide.createIcons();
    }

    function toggleTaskCompletion(taskId) {
        if (state.activeDay.completedTasks.includes(taskId)) {
            state.activeDay.completedTasks = state.activeDay.completedTasks.filter(id => id !== taskId);
        } else {
            state.activeDay.completedTasks.push(taskId);
        }
        
        renderTodoSchedule();
        renderMetrics();
        saveStateToStorage();
    }

    function renderGroceryList() {
        groceryCategories.innerHTML = '';
        
        // Group by category
        const groups = {};
        state.activeDay.groceryList.forEach(item => {
            if (!groups[item.category]) {
                groups[item.category] = [];
            }
            groups[item.category].push(item);
        });

        Object.keys(groups).forEach(cat => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'grocery-category-group';
            
            const groupTitle = document.createElement('h4');
            groupTitle.className = 'category-title';
            groupTitle.innerHTML = `<i data-lucide="shopping-bag" style="width:14px;height:14px;"></i> ${cat}`;
            
            const box = document.createElement('div');
            box.className = 'grocery-items-box';

            groups[cat].forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = `grocery-item ${item.owned ? 'owned' : ''}`;
                
                itemDiv.innerHTML = `
                    <div class="grocery-item-check">
                        <input type="checkbox" ${item.owned ? 'checked' : ''} data-name="${item.name}">
                        <span>${item.qty} ${item.name}</span>
                    </div>
                    <span class="grocery-item-price">$${item.cost.toFixed(2)}</span>
                `;

                // Sub-modal tag swap option when clicking grocery text (not checkbox)
                itemDiv.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'INPUT') {
                        openSubstitutionModal(item.mealId, item.originalName);
                    }
                });

                // Toggle pantry checkbox
                const checkbox = itemDiv.querySelector('input');
                checkbox.addEventListener('change', (e) => {
                    const isChecked = e.target.checked;
                    toggleGroceryPurchase(item, isChecked);
                });

                box.appendChild(itemDiv);
            });

            groupDiv.appendChild(groupTitle);
            groupDiv.appendChild(box);
            groceryCategories.appendChild(groupDiv);
        });

        lucide.createIcons();
    }

    function toggleGroceryPurchase(item, isChecked) {
        // Find item in state and update owned status
        state.activeDay.groceryList.forEach(g => {
            if (g.name === item.name && g.mealId === item.mealId) {
                g.owned = isChecked;
            }
        });

        // Recalculate cost based on shopping purchases
        let buyTotal = 0;
        state.activeDay.groceryList.forEach(g => {
            if (!g.owned) {
                buyTotal += g.cost;
            }
        });
        state.activeDay.totalCost = buyTotal;

        renderMetrics();
        renderGroceryList();
        renderMealPlan(); // Redraw pills line-throughs
        saveStateToStorage();
    }

    // --- Smart Substitutions Modal Engine ---
    function openSubstitutionModal(mealId, ingName) {
        const meal = state.activeDay.meals.find(m => m.id === mealId);
        if (!meal) return;
        
        const ing = meal.ingredients.find(i => i.name === ingName);
        if (!ing) return;

        activeSubContext = { mealId, ingredient: ing };

        // Set text content
        subIngName.textContent = ingName;
        subRecipeContext.textContent = meal.name;
        
        // Find current cost (check if user already swapped this item)
        const swapKey = `${mealId}_${ingName}`;
        const activeSwap = state.substitutions[swapKey];
        const currentPrice = activeSwap ? (ing.cost + activeSwap.costDiff) : ing.cost;
        subCurrentCost.textContent = `$${currentPrice.toFixed(2)}`;

        // Populate options
        subOptionsList.innerHTML = '';
        
        // Default Option (No swap / Reset)
        const defOption = document.createElement('div');
        defOption.className = `sub-option-item ${!activeSwap ? 'selected' : ''}`;
        defOption.innerHTML = `
            <div class="sub-option-info">
                <span class="sub-option-name">Keep Original (${ingName})</span>
                <span class="sub-option-reason">Recipe standard ingredient</span>
            </div>
            <div class="sub-option-impact">
                <span class="impact-badge neutral">Default</span>
                <span class="sub-option-price-diff">$${ing.cost.toFixed(2)}</span>
            </div>
        `;
        defOption.addEventListener('click', () => applySubstitution(null));
        subOptionsList.appendChild(defOption);

        // Find matches in mock substitutions DB
        const matchKey = ingName.toLowerCase();
        const options = SUBSTITUTION_DATABASE[matchKey] || [];

        options.forEach(opt => {
            const isSelected = activeSwap && activeSwap.name === opt.name;
            const optDiv = document.createElement('div');
            optDiv.className = `sub-option-item ${isSelected ? 'selected' : ''}`;

            const displayDiff = opt.costDiff >= 0 ? `+$${opt.costDiff.toFixed(2)}` : `-$${Math.abs(opt.costDiff).toFixed(2)}`;
            const estCost = ing.cost + opt.costDiff;
            
            optDiv.innerHTML = `
                <div class="sub-option-info">
                    <span class="sub-option-name">Swap with ${opt.name}</span>
                    <span class="sub-option-reason">${opt.reason}</span>
                </div>
                <div class="sub-option-impact">
                    <span class="impact-badge ${opt.impact}">${opt.impact.toUpperCase()}</span>
                    <span class="sub-option-price-diff">$${estCost.toFixed(2)} (${displayDiff})</span>
                </div>
            `;

            optDiv.addEventListener('click', () => applySubstitution(opt));
            subOptionsList.appendChild(optDiv);
        });

        // Add custom text input sub trigger for extra interactivity
        const customWrapper = document.createElement('div');
        customWrapper.className = 'custom-sub-input-box';
        customWrapper.style.marginTop = '14px';
        customWrapper.innerHTML = `
            <label style="font-size:0.75rem;margin-bottom:4px;">Suggest custom ingredient</label>
            <div class="input-btn-group">
                <input type="text" id="custom-sub-text" placeholder="e.g., lentils, chicken thighs..." style="padding:8px 12px;font-size:0.85rem;">
                <button type="button" id="apply-custom-sub-btn" class="btn btn-secondary btn-sm">Apply Swap</button>
            </div>
        `;
        subOptionsList.appendChild(customWrapper);

        const customBtn = customWrapper.querySelector('#apply-custom-sub-btn');
        const customInput = customWrapper.querySelector('#custom-sub-text');
        
        customBtn.addEventListener('click', () => {
            const val = customInput.value.trim().toLowerCase();
            if (val) {
                applySubstitution({
                    name: val,
                    reason: 'Custom user substitute request',
                    costDiff: -1.00, // Estimate standard discount for custom swaps
                    impact: 'cheaper'
                });
            }
        });

        // Show Modal
        subModal.classList.add('open');
        lucide.createIcons();
    }

    function applySubstitution(opt) {
        const { mealId, ingredient } = activeSubContext;
        const swapKey = `${mealId}_${ingredient.name}`;

        if (opt === null) {
            // Remove swap
            delete state.substitutions[swapKey];
        } else {
            // Save swap to state
            state.substitutions[swapKey] = {
                name: opt.name,
                costDiff: opt.costDiff,
                reason: opt.reason
            };
        }

        // Close modal
        subModal.classList.remove('open');

        // Re-compile
        calculateGroceryCost();
        compileCookingSchedule();
        renderAllDashboard();
        saveStateToStorage();
    }

    // --- Schedule Parallelization Engine ---
    function parallelizePrepSchedule() {
        // Intelligent aggregation:
        // Group all prep, slicing, chopping, and heating steps into a single "Early Prep Block" 
        // to minimize double work in the kitchen.
        const originalList = JSON.parse(JSON.stringify(state.activeDay.todoList));
        
        // Find prep tasks
        const prepKeywords = ['chop', 'slice', 'dice', 'preheat', 'rinse', 'whisk', 'peel', 'marinate', 'grate'];
        const prepSteps = [];
        const cookingSteps = [];

        originalList.forEach(task => {
            const lowercaseText = task.text.toLowerCase();
            const isPrep = prepKeywords.some(kw => lowercaseText.includes(kw));
            
            if (isPrep) {
                prepSteps.push(task);
            } else {
                cookingSteps.push(task);
            }
        });

        if (prepSteps.length <= 1) {
            alert("Your schedule is already optimal!");
            return;
        }

        // Create a single consolidated Morning/Early Prep step
        const consolidatedText = "Consolidated Prep Block: " + prepSteps.map(step => {
            // Strip initial verbs to align nicely
            return step.text.replace(/^(chop|slice|dice|whisk|rinse|preheat|prepare)\b/i, '$1');
        }).join(' AND ');

        const totalDuration = prepSteps.reduce((acc, step) => acc + step.duration, 0);
        
        // Adjust compiled todo list
        const optimizedList = [
            {
                id: 'optimized_prep_block',
                mealId: 'all',
                course: 'breakfast',
                time: '08:00 AM',
                duration: Math.round(totalDuration * 0.8), // 20% efficiency gain by doing together!
                text: consolidatedText
            },
            ...cookingSteps
        ];

        state.activeDay.todoList = optimizedList;
        renderTodoSchedule();
        renderMetrics();
        
        // Change button state
        optimizeScheduleBtn.innerHTML = '<i data-lucide="check"></i> Optimal Path Created';
        optimizeScheduleBtn.disabled = true;
        lucide.createIcons();
    }

    // --- Helpers ---
    function copyGroceryListToClipboard() {
        const text = state.activeDay.groceryList
            .filter(g => !g.owned)
            .map(g => `- [ ] ${g.qty} ${g.name} ($${g.cost.toFixed(2)})`)
            .join('\n');
            
        navigator.clipboard.writeText(text).then(() => {
            alert('Shopping list copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }
});

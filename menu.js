// ===============================
// Menu Management
// ===============================

// Default menu (used only on first run)
const DEFAULT_MENU = [
    {
        id: 1,
        name: "Classic Burger",
        icon: "🍔",
        price: 199,
        desc: "Juicy beef patty, lettuce, cheese",
        category: "Burger"
    },
    {
        id: 2,
        name: "Margherita Pizza",
        icon: "🍕",
        price: 349,
        desc: "Fresh mozzarella, basil, tomato",
        category: "Pizza"
    },
    {
        id: 3,
        name: "Pasta Alfredo",
        icon: "🍝",
        price: 279,
        desc: "Creamy white sauce, parmesan",
        category: "Pasta"
    },
    {
        id: 4,
        name: "Veg Wrap",
        icon: "🌯",
        price: 149,
        desc: "Grilled veggies, mint chutney",
        category: "Wrap"
    },
    {
        id: 5,
        name: "Chicken Biryani",
        icon: "🍚",
        price: 329,
        desc: "Aromatic basmati, spiced chicken",
        category: "Rice"
    },
    {
        id: 6,
        name: "Masala Dosa",
        icon: "🥞",
        price: 129,
        desc: "Crispy crepe, potato filling, chutneys",
        category: "South Indian"
    },
    {
        id: 7,
        name: "Mango Lassi",
        icon: "🥭",
        price: 89,
        desc: "Fresh mango, yogurt, cardamom",
        category: "Beverage"
    },
    {
        id: 8,
        name: "Chocolate Brownie",
        icon: "🍫",
        price: 159,
        desc: "Warm fudge, vanilla ice cream",
        category: "Dessert"
    }
];

// ===============================
// Load Menu
// ===============================
function loadMenu() {
    let menu = localStorage.getItem("menu");

    if (!menu) {
        localStorage.setItem("menu", JSON.stringify(DEFAULT_MENU));
        return [...DEFAULT_MENU];
    }

    return JSON.parse(menu);
}

// ===============================
// Save Menu
// ===============================
function saveMenu(menu) {
    localStorage.setItem("menu", JSON.stringify(menu));
}

// ===============================
// Reset Menu (Useful while developing)
// ===============================
function resetMenu() {
    localStorage.setItem("menu", JSON.stringify(DEFAULT_MENU));
}

// ===============================
// Get Next Menu ID
// ===============================
function getNextMenuId() {
    const menu = loadMenu();

    if (menu.length === 0) {
        return 1;
    }

    return Math.max(...menu.map(item => item.id)) + 1;
}
// Storage.js - Chrome Storage Abstraction Layer
// Pattern from mars-launcher

const STORAGE_KEY = 'quick_note_data';

// Get default data structure
function getDefaultData() {
    const now = Date.now();
    return {
        categories: [
            {
                id: `cat_${now}`,
                name: 'Quick Links',
                order: 0,
                createdAt: now,
                updatedAt: now
            }
        ],
        cards: [],
        activeCategory: `cat_${now}`,
        settings: {
            theme: 'light',
            openInNewTab: true
        }
    };
}

// Load all data from Chrome Storage
function loadData() {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            if (result[STORAGE_KEY]) {
                resolve(result[STORAGE_KEY]);
            } else {
                // First time - initialize with default data
                const defaultData = getDefaultData();
                saveData(defaultData).then(() => {
                    resolve(defaultData);
                });
            }
        });
    });
}

// Save all data to Chrome Storage
function saveData(data) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
            resolve();
        });
    });
}

// Get categories
async function getCategories() {
    const data = await loadData();
    return data.categories.sort((a, b) => a.order - b.order);
}

// Get cards (all or filtered by category)
async function getCards(categoryId = null) {
    const data = await loadData();
    let cards = data.cards;

    if (categoryId) {
        cards = cards.filter(card => card.categoryId === categoryId);
    }

    return cards.sort((a, b) => a.order - b.order);
}

// Get active category ID
async function getActiveCategory() {
    const data = await loadData();
    return data.activeCategory;
}

// Set active category ID
async function setActiveCategory(categoryId) {
    const data = await loadData();
    data.activeCategory = categoryId;
    await saveData(data);
}

// Get settings
async function getSettings() {
    const data = await loadData();
    return data.settings;
}

// Save settings
async function saveSettings(settings) {
    const data = await loadData();
    data.settings = { ...data.settings, ...settings };
    await saveData(data);
}

// Get category by ID
async function getCategoryById(categoryId) {
    const data = await loadData();
    return data.categories.find(cat => cat.id === categoryId);
}

// Get card by ID
async function getCardById(cardId) {
    const data = await loadData();
    return data.cards.find(card => card.id === cardId);
}

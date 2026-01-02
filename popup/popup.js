// Popup.js - Main Controller
// Coordinates all modules and manages UI

let currentCategoryId = null;
let editingCategoryId = null;
let editingCardId = null;

// Initialize the extension
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize theme
        await initTheme();

        // Load active category
        currentCategoryId = await getActiveCategory();

        // Render initial UI
        await renderCategories();
        await renderCards(currentCategoryId);

        // Setup event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Initialization error:', error);
    }
});

// Setup all event listeners
function setupEventListeners() {
    // Add Category button
    document.getElementById('btn_add_category').addEventListener('click', () => {
        showCategoryModal('add');
    });

    // Category form
    document.getElementById('category_form').addEventListener('submit', handleCategorySubmit);
    document.getElementById('btn_cancel_category').addEventListener('click', hideCategoryModal);
    document.getElementById('btn_close_category_modal').addEventListener('click', hideCategoryModal);

    // Card form
    document.getElementById('card_form').addEventListener('submit', handleCardSubmit);
    document.getElementById('btn_cancel_card').addEventListener('click', hideCardModal);
    document.getElementById('btn_close_card_modal').addEventListener('click', hideCardModal);

    // Settings
    document.getElementById('btn_settings').addEventListener('click', showSettingsModal);
    document.getElementById('btn_close_settings').addEventListener('click', hideSettingsModal);
    document.getElementById('btn_close_settings_modal').addEventListener('click', hideSettingsModal);

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideCategoryModal();
                hideCardModal();
                hideSettingsModal();
            }
        });
    });
}

// ========================================
// RENDER FUNCTIONS
// ========================================

// Render categories in side navigation
async function renderCategories() {
    const categories = await getCategories();
    const categoryList = document.getElementById('category_list');

    categoryList.innerHTML = '';

    categories.forEach(category => {
        const categoryItem = document.createElement('button');
        categoryItem.className = `category-item ${category.id === currentCategoryId ? 'category-active' : ''}`;
        categoryItem.setAttribute('data-category-id', category.id);

        categoryItem.innerHTML = `
            <svg class="category-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="category-name">${escapeHtml(category.name)}</span>
            <div class="category-actions">
                <button class="btn-edit" data-category-id="${category.id}">✎</button>
                <button class="btn-delete" data-category-id="${category.id}">×</button>
            </div>
        `;

        // Click to switch category
        categoryItem.addEventListener('click', (e) => {
            // Don't switch if clicking action buttons
            if (e.target.classList.contains('btn-edit') || e.target.classList.contains('btn-delete')) {
                return;
            }
            switchCategory(category.id);
        });

        // Edit button
        categoryItem.querySelector('.btn-edit').addEventListener('click', (e) => {
            e.stopPropagation();
            showCategoryModal('edit', category.id);
        });

        // Delete button
        categoryItem.querySelector('.btn-delete').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Delete '${category.name}' and all its cards?`)) {
                try {
                    const newActiveCategory = await deleteCategory(category.id);
                    currentCategoryId = newActiveCategory;
                    await renderCategories();
                    await renderCards(currentCategoryId);
                } catch (error) {
                    alert(error.message);
                }
            }
        });

        categoryList.appendChild(categoryItem);
    });
}

// Render cards for active category
async function renderCards(categoryId) {
    const cards = await getCards(categoryId);
    const cardsGrid = document.getElementById('cards_grid');
    const emptyState = document.getElementById('empty_state');
    const categoryTitle = document.getElementById('active_category_title');

    // Update category title
    const category = await getCategoryById(categoryId);
    if (category) {
        categoryTitle.textContent = category.name;
    }

    // Clear grid
    cardsGrid.innerHTML = '';

    if (cards.length === 0) {
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';

        // Render cards
        cards.forEach(card => {
            const cardElement = createCardElement(card);
            cardsGrid.appendChild(cardElement);
        });
    }

    // Add "Add Card" button
    const addCardBtn = document.createElement('button');
    addCardBtn.className = 'add-card-btn card-premium';
    addCardBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        <span class="add-card-text">Add Card</span>
    `;
    addCardBtn.addEventListener('click', () => {
        showCardModal('add');
    });
    cardsGrid.appendChild(addCardBtn);
}

// Create card element
function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'url-card card-premium';
    cardElement.setAttribute('data-url', card.url);

    cardElement.innerHTML = `
        <div class="card-header">
            <h3 class="card-title">${escapeHtml(card.title)}</h3>
            <div class="card-actions">
                <button class="btn-edit-card" data-card-id="${card.id}">✎</button>
                <button class="btn-delete-card" data-card-id="${card.id}">×</button>
            </div>
        </div>
    `;

    // Click anywhere on card to open URL
    cardElement.addEventListener('click', (e) => {
        // Don't open if clicking action buttons
        if (e.target.classList.contains('btn-edit-card') ||
            e.target.classList.contains('btn-delete-card')) {
            return;
        }
        const url = cardElement.getAttribute('data-url');
        chrome.tabs.create({ url: url });
    });

    // Edit button
    cardElement.querySelector('.btn-edit-card').addEventListener('click', (e) => {
        e.stopPropagation();
        showCardModal('edit', card.id);
    });

    // Delete button
    cardElement.querySelector('.btn-delete-card').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Delete '${card.title}'?`)) {
            try {
                await deleteCard(card.id);
                await renderCards(currentCategoryId);
            } catch (error) {
                alert(error.message);
            }
        }
    });

    return cardElement;
}

// ========================================
// CATEGORY MODAL
// ========================================

function showCategoryModal(mode, categoryId = null) {
    const modal = document.getElementById('category_modal');
    const title = document.getElementById('category_modal_title');
    const nameInput = document.getElementById('category_name');
    const errorText = document.getElementById('category_error');

    errorText.textContent = '';
    editingCategoryId = categoryId;

    if (mode === 'add') {
        title.textContent = 'Add Category';
        nameInput.value = '';
    } else if (mode === 'edit' && categoryId) {
        title.textContent = 'Edit Category';
        getCategoryById(categoryId).then(category => {
            if (category) {
                nameInput.value = category.name;
            }
        });
    }

    modal.style.display = 'flex';
    nameInput.focus();
}

function hideCategoryModal() {
    const modal = document.getElementById('category_modal');
    const form = document.getElementById('category_form');
    const errorText = document.getElementById('category_error');

    modal.style.display = 'none';
    form.reset();
    errorText.textContent = '';
    editingCategoryId = null;
}

async function handleCategorySubmit(e) {
    e.preventDefault();

    const nameInput = document.getElementById('category_name');
    const errorText = document.getElementById('category_error');
    const name = nameInput.value;

    errorText.textContent = '';

    try {
        if (editingCategoryId) {
            // Update existing category
            await updateCategory(editingCategoryId, name);
        } else {
            // Create new category
            const newCategory = await createCategory(name);
            currentCategoryId = newCategory.id;
            await setActiveCategory(newCategory.id);
        }

        await renderCategories();
        await renderCards(currentCategoryId);
        hideCategoryModal();

    } catch (error) {
        errorText.textContent = error.message;
    }
}

// ========================================
// CARD MODAL
// ========================================

function showCardModal(mode, cardId = null) {
    const modal = document.getElementById('card_modal');
    const title = document.getElementById('card_modal_title');
    const titleInput = document.getElementById('card_title');
    const urlInput = document.getElementById('card_url');
    const errorText = document.getElementById('card_error');

    errorText.textContent = '';
    editingCardId = cardId;

    if (mode === 'add') {
        title.textContent = 'Add Card';
        titleInput.value = '';
        urlInput.value = '';
    } else if (mode === 'edit' && cardId) {
        title.textContent = 'Edit Card';
        getCardById(cardId).then(card => {
            if (card) {
                titleInput.value = card.title;
                urlInput.value = card.url;
            }
        });
    }

    modal.style.display = 'flex';
    titleInput.focus();
}

function hideCardModal() {
    const modal = document.getElementById('card_modal');
    const form = document.getElementById('card_form');
    const errorText = document.getElementById('card_error');

    modal.style.display = 'none';
    form.reset();
    errorText.textContent = '';
    editingCardId = null;
}

async function handleCardSubmit(e) {
    e.preventDefault();

    const titleInput = document.getElementById('card_title');
    const urlInput = document.getElementById('card_url');
    const errorText = document.getElementById('card_error');

    errorText.textContent = '';

    try {
        if (editingCardId) {
            // Update existing card (pass empty string for tags)
            await updateCard(editingCardId, titleInput.value, urlInput.value, '');
        } else {
            // Create new card (pass empty string for tags)
            await createCard(currentCategoryId, titleInput.value, urlInput.value, '');
        }

        await renderCards(currentCategoryId);
        hideCardModal();

    } catch (error) {
        errorText.textContent = error.message;
    }
}

// ========================================
// SETTINGS MODAL
// ========================================

function showSettingsModal() {
    const modal = document.getElementById('settings_modal');
    modal.style.display = 'flex';
}

function hideSettingsModal() {
    const modal = document.getElementById('settings_modal');
    modal.style.display = 'none';
}

// ========================================
// CATEGORY SWITCHING
// ========================================

async function switchCategory(categoryId) {
    currentCategoryId = categoryId;
    await setActiveCategory(categoryId);
    await renderCategories();
    await renderCards(categoryId);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

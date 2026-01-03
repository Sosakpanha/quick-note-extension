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

    // Export/Import
    document.getElementById('btn_export_data').addEventListener('click', exportAllData);
    document.getElementById('btn_import_data').addEventListener('click', () => {
        document.getElementById('import_file_input').click();
    });
    document.getElementById('import_file_input').addEventListener('change', handleImportFile);

    // Drag & Drop
    const dropZone = document.getElementById('drop_zone');

    dropZone.addEventListener('click', () => {
        document.getElementById('import_file_input').click();
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/json' || file.name.endsWith('.json')) {
                handleImportFileFromDrop(file);
            } else {
                const errorEl = document.getElementById('import_error');
                errorEl.textContent = 'Please drop a valid JSON file';
            }
        }
    });

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
            const confirmed = await showConfirm(
                `Delete '${category.name}' and all its cards?`,
                'Delete Category'
            );
            if (confirmed) {
                try {
                    const newActiveCategory = await deleteCategory(category.id);
                    currentCategoryId = newActiveCategory;
                    await renderCategories();
                    await renderCards(currentCategoryId);
                } catch (error) {
                    await showAlert(error.message, 'Error');
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
        const confirmed = await showConfirm(
            `Delete '${card.title}'?`,
            'Delete Card'
        );
        if (confirmed) {
            try {
                await deleteCard(card.id);
                await renderCards(currentCategoryId);
            } catch (error) {
                await showAlert(error.message, 'Error');
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

// Custom confirm dialog
function showConfirm(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm_modal');
        const titleEl = document.getElementById('confirm_title');
        const messageEl = document.getElementById('confirm_message');
        const btnYes = document.getElementById('btn_confirm_yes');
        const btnNo = document.getElementById('btn_confirm_no');

        titleEl.textContent = title;
        messageEl.textContent = message;

        modal.style.display = 'flex';

        const handleYes = () => {
            cleanup();
            resolve(true);
        };

        const handleNo = () => {
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            modal.style.display = 'none';
            btnYes.removeEventListener('click', handleYes);
            btnNo.removeEventListener('click', handleNo);
        };

        btnYes.addEventListener('click', handleYes);
        btnNo.addEventListener('click', handleNo);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleNo();
            }
        });
    });
}

// Custom alert dialog
function showAlert(message, title = 'Error') {
    return new Promise((resolve) => {
        const modal = document.getElementById('alert_modal');
        const titleEl = document.getElementById('alert_title');
        const messageEl = document.getElementById('alert_message');
        const btnOk = document.getElementById('btn_alert_ok');

        titleEl.textContent = title;
        messageEl.textContent = message;

        modal.style.display = 'flex';

        const handleOk = () => {
            cleanup();
            resolve();
        };

        const cleanup = () => {
            modal.style.display = 'none';
            btnOk.removeEventListener('click', handleOk);
        };

        btnOk.addEventListener('click', handleOk);

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                handleOk();
            }
        });
    });
}

// ========================================
// EXPORT/IMPORT FUNCTIONS
// ========================================

// Export all data as JSON file
async function exportAllData() {
    try {
        const data = await loadData();

        // Clean up data - remove unnecessary fields
        const cleanedCategories = data.categories.map(cat => ({
            id: cat.id,
            name: cat.name
        }));

        const cleanedCards = data.cards.map(card => ({
            id: card.id,
            categoryId: card.categoryId,
            title: card.title,
            url: card.url
        }));

        const cleanedData = {
            categories: cleanedCategories,
            cards: cleanedCards,
            settings: data.settings
        };

        // Create export object with metadata
        const exportData = {
            version: '1.1.0',
            exportDate: new Date().toISOString(),
            data: cleanedData
        };

        // Convert to JSON string
        const jsonString = JSON.stringify(exportData, null, 2);

        // Create blob and download
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quick-notes-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Show success message
        const successEl = document.getElementById('import_success');
        successEl.textContent = 'Data exported successfully!';
        successEl.style.display = 'block';
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 3000);

    } catch (error) {
        console.error('Export error:', error);
        await showAlert('Failed to export data: ' + error.message, 'Export Error');
    }
}

// Handle file selection for import
async function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    await processImportFile(file);
    event.target.value = ''; // Reset file input
}

// Handle drag & drop import
async function handleImportFileFromDrop(file) {
    await processImportFile(file);
}

// Process import file (shared logic for both file input and drag & drop)
async function processImportFile(file) {
    const errorEl = document.getElementById('import_error');
    const successEl = document.getElementById('import_success');
    errorEl.textContent = '';
    successEl.style.display = 'none';

    try {
        // Read file
        const text = await file.text();
        const importData = JSON.parse(text);

        // Validate structure
        if (!importData.data) {
            throw new Error('Invalid backup file format');
        }

        const newData = importData.data;

        // Validate required fields
        if (!newData.categories || !Array.isArray(newData.categories)) {
            throw new Error('Invalid categories data');
        }

        if (!newData.cards || !Array.isArray(newData.cards)) {
            throw new Error('Invalid cards data');
        }

        // Load existing data
        const existingData = await loadData();
        const existingCards = existingData.cards || [];
        const existingCategories = existingData.categories || [];

        // Check for duplicate URLs
        const existingUrls = new Set(existingCards.map(card => card.url.toLowerCase()));
        const duplicates = newData.cards.filter(card =>
            existingUrls.has(card.url.toLowerCase())
        );

        // Show duplicates and confirm
        let confirmMsg = `Import ${newData.categories.length} categories and ${newData.cards.length} cards?\n\n`;

        if (duplicates.length > 0) {
            confirmMsg += `⚠️ Found ${duplicates.length} duplicate URL(s):\n`;
            duplicates.slice(0, 5).forEach(card => {
                confirmMsg += `• ${card.title}\n`;
            });
            if (duplicates.length > 5) {
                confirmMsg += `... and ${duplicates.length - 5} more\n`;
            }
            confirmMsg += '\nContinue importing (duplicates will be added)?';
        }

        const confirmed = await showConfirm(confirmMsg, 'Import Notes');
        if (!confirmed) {
            return;
        }

        // Generate unique IDs for new data to avoid conflicts
        const timestamp = Date.now();
        const categoryIdMap = new Map();

        // Map new categories with unique IDs
        const newCategories = newData.categories.map((cat, index) => {
            const newId = `cat_${timestamp}_${index}`;
            categoryIdMap.set(cat.id, newId);
            return {
                id: newId,
                name: cat.name,
                order: existingCategories.length + index,
                createdAt: timestamp,
                updatedAt: timestamp
            };
        });

        // Map new cards with updated category IDs and unique IDs
        const newCards = newData.cards.map((card, index) => {
            const newCategoryId = categoryIdMap.get(card.categoryId);
            return {
                id: `card_${timestamp}_${index}`,
                categoryId: newCategoryId,
                title: card.title,
                url: card.url,
                tags: [],
                order: index,
                createdAt: timestamp,
                updatedAt: timestamp
            };
        });

        // Merge with existing data
        const mergedData = {
            categories: [...existingCategories, ...newCategories],
            cards: [...existingCards, ...newCards],
            settings: existingData.settings,
            activeCategory: existingData.activeCategory || newCategories[0]?.id
        };

        // Save merged data
        await saveData(mergedData);

        // Reload UI
        await renderCategories();
        await renderCards(currentCategoryId);

        // Show success
        successEl.textContent = `Successfully imported ${newCategories.length} categories and ${newCards.length} cards!`;
        successEl.style.display = 'block';
        setTimeout(() => {
            successEl.style.display = 'none';
            hideSettingsModal();
        }, 2000);

    } catch (error) {
        console.error('Import error:', error);
        errorEl.textContent = 'Import failed: ' + error.message;
    }
}

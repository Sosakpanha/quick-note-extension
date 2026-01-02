// Categories.js - Category CRUD Operations
// Pattern from mars-launcher

// Create a new category
async function createCategory(name) {
    // Validate
    if (!name || !name.trim()) {
        throw new Error('Category name is required');
    }

    if (name.length > 50) {
        throw new Error('Category name must be 50 characters or less');
    }

    const data = await loadData();
    const now = Date.now();

    // Find highest order number
    const maxOrder = data.categories.length > 0
        ? Math.max(...data.categories.map(c => c.order))
        : -1;

    const newCategory = {
        id: `cat_${now}`,
        name: name.trim(),
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now
    };

    data.categories.push(newCategory);
    await saveData(data);

    return newCategory;
}

// Update a category
async function updateCategory(categoryId, name) {
    // Validate
    if (!name || !name.trim()) {
        throw new Error('Category name is required');
    }

    if (name.length > 50) {
        throw new Error('Category name must be 50 characters or less');
    }

    const data = await loadData();
    const category = data.categories.find(c => c.id === categoryId);

    if (!category) {
        throw new Error('Category not found');
    }

    category.name = name.trim();
    category.updatedAt = Date.now();

    await saveData(data);
    return category;
}

// Delete a category and all its cards
async function deleteCategory(categoryId) {
    const data = await loadData();

    // Don't delete if it's the last category
    if (data.categories.length === 1) {
        throw new Error('Cannot delete the last category');
    }

    // Find category index
    const categoryIndex = data.categories.findIndex(c => c.id === categoryId);

    if (categoryIndex === -1) {
        throw new Error('Category not found');
    }

    // Remove category
    data.categories.splice(categoryIndex, 1);

    // Remove all cards in this category
    data.cards = data.cards.filter(card => card.categoryId !== categoryId);

    // If this was the active category, switch to the first category
    if (data.activeCategory === categoryId) {
        data.activeCategory = data.categories[0].id;
    }

    await saveData(data);
    return data.activeCategory; // Return new active category
}

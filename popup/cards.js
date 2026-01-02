// Cards.js - Card CRUD Operations
// Pattern from mars-launcher

// Validate URL format
function validateUrl(url) {
    if (!url || !url.trim()) {
        return { valid: false, error: 'URL is required' };
    }

    try {
        const urlObj = new URL(url.trim());
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            return { valid: false, error: 'URL must start with http:// or https://' };
        }
        return { valid: true, url: url.trim() };
    } catch (e) {
        return { valid: false, error: 'Please enter a valid URL (e.g., https://example.com)' };
    }
}

// Parse tags from comma-separated string
function parseTags(tagString) {
    if (!tagString || !tagString.trim()) {
        return [];
    }

    const tags = tagString
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && tag.length <= 20)
        .slice(0, 5); // Max 5 tags

    return tags;
}

// Create a new card
async function createCard(categoryId, title, url, tags) {
    // Validate title
    if (!title || !title.trim()) {
        throw new Error('Title is required');
    }

    if (title.length > 100) {
        throw new Error('Title must be 100 characters or less');
    }

    // Validate URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.valid) {
        throw new Error(urlValidation.error);
    }

    const data = await loadData();
    const now = Date.now();

    // Find highest order number for this category
    const categoryCards = data.cards.filter(c => c.categoryId === categoryId);
    const maxOrder = categoryCards.length > 0
        ? Math.max(...categoryCards.map(c => c.order))
        : -1;

    const newCard = {
        id: `card_${now}`,
        categoryId: categoryId,
        title: title.trim(),
        url: urlValidation.url,
        tags: parseTags(tags),
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now
    };

    data.cards.push(newCard);
    await saveData(data);

    return newCard;
}

// Update a card
async function updateCard(cardId, title, url, tags) {
    // Validate title
    if (!title || !title.trim()) {
        throw new Error('Title is required');
    }

    if (title.length > 100) {
        throw new Error('Title must be 100 characters or less');
    }

    // Validate URL
    const urlValidation = validateUrl(url);
    if (!urlValidation.valid) {
        throw new Error(urlValidation.error);
    }

    const data = await loadData();
    const card = data.cards.find(c => c.id === cardId);

    if (!card) {
        throw new Error('Card not found');
    }

    card.title = title.trim();
    card.url = urlValidation.url;
    card.tags = parseTags(tags);
    card.updatedAt = Date.now();

    await saveData(data);
    return card;
}

// Delete a card
async function deleteCard(cardId) {
    const data = await loadData();
    const cardIndex = data.cards.findIndex(c => c.id === cardId);

    if (cardIndex === -1) {
        throw new Error('Card not found');
    }

    data.cards.splice(cardIndex, 1);
    await saveData(data);
}

// Get shortened URL for display
function getShortenedUrl(url) {
    try {
        const urlObj = new URL(url);
        let display = urlObj.hostname + urlObj.pathname;
        if (display.length > 40) {
            display = display.substring(0, 37) + '...';
        }
        return display;
    } catch (e) {
        return url.length > 40 ? url.substring(0, 37) + '...' : url;
    }
}

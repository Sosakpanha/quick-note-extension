# Quick Note Extension

A beautiful Chrome extension for organizing and accessing your favorite URLs with categories and tags.

## Features

- ✅ **Category Management**: Create custom categories to organize your links
- ✅ **URL Cards**: Simple, clean cards showing just the title - click to open
- ✅ **Beautiful UI**: Clean, modern interface with custom CSS (only 192KB total!)
- ✅ **Theme Support**: 6 beautiful themes with gradients (Light, Dark, Ocean, Brown, Frost, Night)
- ✅ **One-Click Access**: Click any card to open the URL in a new tab
- ✅ **Persistent Storage**: All data saved locally using Chrome Storage API
- ✅ **Full CRUD Operations**: Add, edit, and delete categories and cards
- ✅ **Export/Import**: Backup and share your notes with others via JSON files
- ✅ **Lightweight**: No heavy frameworks - pure vanilla JavaScript and CSS

## Installation

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `quick-note-extension` folder
5. The extension icon will appear in your toolbar

### Usage

1. Click the extension icon to open Quick Notes
2. Use the default "Quick Links" category or create your own
3. Click "+ Add Card" to add a new URL
4. Fill in the title and URL
5. Click on any card to open the URL in a new tab

### Managing Categories

- Click "+ Add Category" in the sidebar to create a new category
- Hover over a category to see edit (✎) and delete (×) buttons
- Click a category name to switch to it

### Managing Cards

- Click any card to open its URL
- Hover over a card to see edit (✎) and delete (×) buttons
- Cards are displayed in a single column for easy scanning

### Settings

- Click the settings icon (⚙) in the header
- Choose from 6 beautiful themes
- Settings are saved automatically

### Export/Import (Share with Others)

**Export Your Notes:**
1. Click the settings icon (⚙)
2. Click "Export All" button
3. A JSON file will be downloaded (e.g., `quick-notes-backup-2026-01-03.json`)
4. Share this file with others via email, cloud storage, etc.

**Import Notes from Others:**
1. Click the settings icon (⚙)
2. Click "Import" button
3. Select a JSON backup file
4. Confirm the import (this will replace all current data)
5. Your notes will be restored from the backup

**Note:** Import will completely replace your existing data. Export your current notes first if you want to keep them!

## Project Structure

```
quick-note-extension/
├── manifest.json              # Extension configuration
├── icons/                     # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── popup/
    ├── popup.html            # Main UI
    ├── popup.js              # Main controller
    ├── storage.js            # Chrome Storage API wrapper
    ├── categories.js         # Category CRUD operations
    ├── cards.js              # Card CRUD operations
    ├── tabs.js               # Theme system
    ├── base.css              # Custom styles (13KB)
    └── themes.css            # Theme definitions (10KB)
```

## Data Storage

All data is stored locally using Chrome Storage API:

```javascript
{
  categories: [
    { id, name, order, createdAt, updatedAt }
  ],
  cards: [
    { id, categoryId, title, url, order, createdAt, updatedAt }
  ],
  activeCategory: "cat_id",
  settings: {
    theme: "light",
    openInNewTab: true
  }
}
```

## Validation Rules

- **Category Name**: Required, max 50 characters
- **Card Title**: Required, max 100 characters
- **Card URL**: Required, must be valid URL (http:// or https://)

## Version

**v1.1.0** - Export/Import Feature
- Added export/import functionality to backup and share notes
- Export all categories and cards to JSON file
- Import data from backup files
- Validation and confirmation on import

**v1.0.0** - Initial Release

## Technologies Used

- Chrome Extension Manifest V3
- Vanilla JavaScript (no frameworks)
- Custom CSS (lightweight, only 23KB total)
- Chrome Storage API
- Total size: **192KB** (extremely lightweight!)

## Future Enhancements (v2.0)

- Search and filter cards
- Drag-and-drop reordering
- Keyboard shortcuts
- Favicon display for URLs
- Bulk operations
- Category-specific export

## License

Created for personal use. Feel free to modify and extend!

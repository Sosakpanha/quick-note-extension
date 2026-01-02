// Tabs.js - Theme System
// Adapted from mars-launcher

const THEMES = ['light', 'dark', 'ocean', 'brown', 'frost', 'night'];

// Initialize theme system
async function initTheme() {
    const settings = await getSettings();
    const theme = settings.theme || 'light';

    // Apply theme
    applyTheme(theme);

    // Set radio button
    const radio = document.getElementById(`theme_${theme}`);
    if (radio) {
        radio.checked = true;
    }

    // Setup change handlers for all theme radios
    THEMES.forEach(themeName => {
        const radio = document.getElementById(`theme_${themeName}`);
        if (radio) {
            radio.addEventListener('change', async function() {
                if (this.checked) {
                    applyTheme(themeName);
                    await saveSettings({ theme: themeName });
                }
            });
        }
    });
}

// Apply theme to body
function applyTheme(theme) {
    // Remove all theme classes
    THEMES.forEach(t => {
        if (t !== 'light') {
            document.body.classList.remove(`${t}-theme`);
        }
    });

    // Apply selected theme (light has no class)
    if (theme !== 'light') {
        document.body.classList.add(`${theme}-theme`);
    }
}

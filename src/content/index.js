/**
 * content/index.js  ← ENTRY POINT
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the only file listed in manifest.json's content_scripts.
 * Vite bundles everything it imports into a single dist/content.js.
 *
 * BOOT ORDER (matters — CSS must be in before any state is applied):
 *   1. setupFilter()        → injects row-dimming CSS (filter.css)
 *   2. setupToasts()        → injects toast CSS (toast.css)
 *   3. setupSettings()      → injects settings CSS & floating button (settings.css)
 *   4. getFilterState()     → reads last session's on/off state from storage
 *   5. turnFilterOn()       → (conditional) restores active state if it was on
 *   6. setupRowActions()    → loads sender list, injects row buttons, watches Gmail
 *   7. setupToolbarButton() → polls for Gmail toolbar, injects toggle button
 *
 * MODULE MAP:
 *
 *   index.js  (this file — orchestrator)
 *     ├── filter.js          Row dimming + MutationObserver
 *     ├── toast.js           Notification cards
 *     ├── rowActions.js      Per-row "mark as important" buttons
 *     ├── toolbarButton.js   Gmail top-toolbar toggle button
 *     └── settings.js        Floating settings cog & management modal
 *
 *   shared / support:
 *     ├── services/storage.js    chrome.storage.local reads & writes
 *     ├── utils/dom.js           Shared DOM helpers
 *     ├── constants/index.js     All magic strings (selectors, class names, IDs)
 *     └── config/index.js        Timings, SVG icons
 *
 * CSS FILES (injected as inline strings via the ?inline Vite query):
 *     styles/filter.css   → injected by filter.js
 *     styles/toast.css    → injected by toast.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { setupFilter, turnFilterOn } from './filter';
import { setupToasts } from './toast';
import { setupRowActions } from './rowActions';
import { setupToolbarButton } from './toolbarButton';
import { setupSettings } from './settings';
import { getDefaultOn } from '../services/storage';

async function boot() {
    // 1, 2 & 3 — Inject CSS before any DOM classes are applied
    setupFilter();
    setupToasts();
    setupSettings();

    // 4 & 5 — Restore filter state from user preference
    const isDefaultOn = await getDefaultOn();
    if (isDefaultOn) {
        await turnFilterOn();
    }

    // 6 — Scan Gmail rows and inject action buttons
    await setupRowActions();

    // 7 — Inject the toggle button into Gmail's top toolbar
    setupToolbarButton();
}

boot();

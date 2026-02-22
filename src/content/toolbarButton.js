/**
 * content/toolbarButton.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Injects a lightning-bolt toggle button into Gmail's top app toolbar
 * (the bar with Archive, Delete, Move, Labels, etc.).
 *
 * ENTRY POINTS (called from index.js on boot):
 *   setupToolbarButton()  → begins polling for the toolbar, then injects
 *
 * HOW IT WORKS:
 *   Gmail renders the toolbar asynchronously after page load, so we can't
 *   inject on DOMContentLoaded. Instead:
 *     1. Poll every 500ms until we see [aria-label="More email options"]
 *        (that button appears when the toolbar is ready).
 *     2. Stop polling, inject our button once.
 *     3. Start a MutationObserver on div[role="main"] — Gmail re-renders this
 *        region on every folder change / navigation, which removes our button.
 *        We re-inject whenever that happens.
 *
 * DOM STRATEGY (mirrors legacy menuShortcut.js which is confirmed working):
 *   - Find: [aria-label="More email options"]   ← aria selector, stable
 *   - Walk: .closest('.G-Ni').parentElement      ← Gmail internal wrapper (no aria alternative)
 *   - Append our button there
 *   - Our button uses Gmail's own class names (T-I, J-J5-Ji, etc.) so it
 *     inherits hover/focus/tooltip styles without any custom CSS.
 *
 * EXIT POINT:
 *   Clicking the button calls toggleFilter() from filter.js, which handles
 *   all the actual dimming logic and storage writes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { IDS } from '../constants';
import { ICONS, POLL } from '../config';
import { toggleFilter, isFilterOn } from './filter';
import { onStorageChanged } from '../services/storage';
import { isRuntimeValid } from '../utils/runtime';

// ─── Setup ────────────────────────────────────────────────────────────────────

export function setupToolbarButton() {
    _waitForToolbarThenInject();

    // Watch for state changes to update ARIA labels dynamically
    onStorageChanged(() => {
        const btn = document.getElementById(IDS.TOOLBAR_FILTER_BTN);
        if (btn) _updateButtonState(btn);
    });
}

// ─── Injection ────────────────────────────────────────────────────────────────

function _injectButton() {
    if (!isRuntimeValid()) return;
    if (document.getElementById(IDS.TOOLBAR_FILTER_BTN)) return;

    const moreOptionsBtn = document.querySelector('[aria-label="More email options"]');
    if (!moreOptionsBtn) return;

    const toolbarRow = moreOptionsBtn.closest('.G-Ni')?.parentElement;
    if (!toolbarRow) return;

    const button = _buildButton();
    toolbarRow.appendChild(button);

    button.addEventListener('click', () => {
        toggleFilter();
    });
}

function _buildButton() {
    const button = document.createElement('div');
    button.id = IDS.TOOLBAR_FILTER_BTN;
    // Matching legacy/menuShortcut.js stable classes
    button.className = 'T-I J-J5-Ji nf T-I-ax7 L3';
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    button.style.marginLeft = '4px';

    const asa = document.createElement('div');
    asa.className = 'asa';

    const iconEl = document.createElement('div');
    // iconEl.className = 'T-I-J3 J-J5-Ji';
    iconEl.style.display = 'flex';
    iconEl.style.alignItems = 'center';
    iconEl.style.justifyContent = 'center';
    iconEl.innerHTML = ICONS.toolbarToggle;

    asa.appendChild(iconEl);

    const spacer = document.createElement('div');
    spacer.className = 'G-asx T-I-J3 J-J5-Ji';
    spacer.innerHTML = '&nbsp;';

    button.appendChild(asa);
    button.appendChild(spacer);

    _updateButtonState(button);

    return button;
}

/**
 * Updates button appearance and tooltips based on current filter state.
 */
function _updateButtonState(button) {
    const on = isFilterOn();

    const icon = button.querySelector('svg');
    if (icon) {
        // Inherit color from Gmail's theme (e.g. white in dark mode)
        icon.style.color = 'currentColor';
        icon.style.opacity = '1';
    }

    const label = 'Toggle important emails';
    button.setAttribute('aria-label', label);
    button.setAttribute('data-tooltip', label);
}

// ─── Polling & re-injection ───────────────────────────────────────────────────

/**
 * Polls every 500ms until Gmail's toolbar is visible (indicated by the
 * presence of [aria-label="More email options"]), then switches to a
 * MutationObserver for ongoing re-injection after Gmail navigations.
 */
function _waitForToolbarThenInject() {
    const intervalId = setInterval(() => {
        if (document.querySelector('[aria-label="More email options"]')) {
            clearInterval(intervalId);
            _observeMainAndInject();
        }
    }, POLL.toolbarCheckInterval);
}

/**
 * Attaches a MutationObserver to div[role="main"].
 * Gmail recreates the toolbar DOM on every navigation, so we watch for
 * any child changes and re-inject our button if it's gone.
 *
 * Also injects immediately so the button appears without waiting for a mutation.
 */
function _observeMainAndInject() {
    const main = document.querySelector('div[role="main"]');
    if (!main) return;

    const observer = new MutationObserver(() => {
        if (!isRuntimeValid()) {
            observer.disconnect();
            return;
        }
        _injectButton();
    });

    observer.observe(main, { childList: true, subtree: true });

    // Inject right now — don't wait for the first mutation
    _injectButton();
}

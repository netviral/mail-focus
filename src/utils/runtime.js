/**
 * utils/runtime.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Helpers for checking extension runtime health.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Returns true if the extension context is still valid.
 * When an extension updates, older content scripts are semi-invalidated.
 * Accessing chrome APIs in that state throws "Extension context invalidated".
 */
export function isRuntimeValid() {
    try {
        return !!(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id);
    } catch (e) {
        return false;
    }
}

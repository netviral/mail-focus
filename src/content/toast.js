/**
 * content/toast.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shows small notification cards inside Gmail after marking/unmarking a sender.
 *
 * ENTRY POINTS (called from index.js on boot):
 *   setupToasts()  → injects the toast CSS into the page (call once)
 *
 * ENTRY POINTS (called by rowActions.js):
 *   showToast({ email, added })
 *       › email  — the sender address
 *       › added  — true = "marked as important", false = "marked as unimportant"
 *
 * DATA OUT:
 *   DOM elements appended to #priority-notifications (inside Gmail main area)
 *   (see dom.js → getOrMakeNotificationArea for how that container is created)
 *
 * ANIMATION LIFECYCLE:
 *   createElement → append → rAF add .toast-item--visible (CSS in)
 *     → setTimeout remove .toast-item--visible (CSS out)
 *       → setTimeout remove element from DOM
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { IDS } from '../constants';
import { TOAST } from '../config';
import { injectStyle, getOrMakeNotificationArea } from '../utils/dom';
import toastCSS from '../styles/toast.css?inline';
import { getShowToasts } from '../services/storage';

// ─── Setup ────────────────────────────────────────────────────────────────────

/**
 * Injects the toast CSS into the page.
 * Safe to call multiple times (deduplicates by style tag id).
 */
export function setupToasts() {
    injectStyle(IDS.TOAST_STYLE_TAG, toastCSS);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Renders a notification toast inside the Gmail main area.
 *
 * @param {{ email: string, added: boolean }} options
 */
export async function showToast({ email, added }) {
    const show = await getShowToasts();
    if (!show) return;

    const container = getOrMakeNotificationArea();
    if (!container) return;

    const card = _buildToastCard(email, added);
    container.appendChild(card);

    // Trigger the CSS entrance animation on the next paint
    requestAnimationFrame(() => {
        card.classList.add('toast-item--visible');
    });

    // Auto-dismiss after the display duration
    setTimeout(() => _dismissToast(card), TOAST.showDuration);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

/**
 * Creates and returns the toast card element.
 * The email address is bolded; the action label is plain text.
 */
function _buildToastCard(email, added) {
    const card = document.createElement('div');
    card.className = 'toast-item';
    card.innerHTML = added
        ? `<strong>${email}</strong> marked as important.`
        : `<strong>${email}</strong> marked as unimportant.`;
    return card;
}

/**
 * Plays the exit animation then removes the element from the DOM.
 *
 * @param {HTMLElement} card
 */
function _dismissToast(card) {
    card.classList.remove('toast-item--visible');   // triggers CSS fade-out
    setTimeout(() => card.remove(), TOAST.fadeDuration);
}

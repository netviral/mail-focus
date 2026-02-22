/**
 * utils/dom.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable DOM helpers shared across content modules.
 *
 * Nothing Gmail-specific lives here — just generic utilities for
 * injecting styles and reading sender data from elements.
 *
 * USED BY:
 *   filter.js       ─ injectStyle(), getGmailMain()
 *   toast.js        ─ injectStyle(), getOrMakeNotificationArea()
 *   rowActions.js   ─ getSenderFromRow()
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { SELECTORS, IDS } from '../constants';

// ─── Style injection ──────────────────────────────────────────────────────────

/**
 * Injects a <style> tag into <head> exactly once.
 * Calling it again with the same id is a safe no-op.
 *
 * @param {string} id       Unique id for the <style> element (deduplication key)
 * @param {string} cssText  The CSS string to inject
 */
export function injectStyle(id, cssText) {
    if (document.getElementById(id)) return;   // already injected
    const tag = document.createElement('style');
    tag.id = id;
    tag.textContent = cssText;
    document.head.appendChild(tag);
}

// ─── Gmail layout helpers ─────────────────────────────────────────────────────

/**
 * Returns Gmail's main content element.
 * Tries the primary aria selector first, then falls back to older Gmail class
 * names in case Google changes the markup.
 *
 * @returns {Element | null}
 */
export function getGmailMain() {
    const primary = document.querySelector(SELECTORS.MAIN);
    if (primary) return primary;

    for (const fallback of SELECTORS.MAIN_FALLBACKS) {
        const el = document.querySelector(fallback);
        if (el) return el;
    }
    return null;
}

/**
 * Returns the notification container, creating it inside the Gmail main area
 * if it doesn't exist yet.
 *
 * The container is absolutely positioned, so we ensure the parent has
 * `position: relative` first (Gmail sometimes sets it to `static`).
 *
 * @returns {Element | null}
 */
export function getOrMakeNotificationArea() {
    const main = getGmailMain();
    if (!main) return null;

    if (getComputedStyle(main).position === 'static') {
        main.style.position = 'relative';
    }

    const existing = main.querySelector(`#${IDS.TOAST_CONTAINER}`);
    if (existing) return existing;

    const container = document.createElement('div');
    container.id = IDS.TOAST_CONTAINER;
    main.appendChild(container);
    return container;
}

// ─── Gmail row helpers ────────────────────────────────────────────────────────

/**
 * Reads the sender's email address from a Gmail row element.
 * Gmail stores it on <span email="..."> — we also check data-hovercard-id
 * as a fallback for older layouts.
 *
 * @param {Element} row  A `tr[role="row"]` Gmail email row
 * @returns {string | null}
 */
export function getSenderFromRow(row) {
    const senderEl = row.querySelector(SELECTORS.SENDER_ATTR);
    if (!senderEl) return null;
    return (
        senderEl.getAttribute('email') ||
        senderEl.getAttribute('data-hovercard-id') ||
        null
    );
}

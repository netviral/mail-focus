/**
 * constants/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for every magic string used across the extension.
 *
 * Why centralise here?
 *   If Gmail ever changes a selector, or we want to rename a CSS class, there
 *   is exactly ONE place to update — here. No grepping nine files.
 *
 * Naming conventions used:
 *   STORAGE_KEYS  → keys written to chrome.storage.local
 *   CSS           → class names injected into Gmail's DOM
 *   IDS           → id="" attributes (unique elements, no collision risk)
 *   DATA          → data-* attribute names used to mark our own elements
 *   SELECTORS     → CSS selector strings used in querySelector calls
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── chrome.storage.local keys ────────────────────────────────────────────────
export const STORAGE_KEYS = {
    EMAIL_LIST: 'priorityTierEmails',  // Array<string> of important sender addresses
    DOMAIN_LIST: 'priorityTierDomains', // Array<string> of important domains (e.g. "outthink.io")
    KEYWORD_LIST: 'priorityTierKeywords',// Array<string> of important subject keywords
    DEFAULT_ON: 'isDefaultOn',         // boolean — should filter be ON by default when Gmail opens?
    OPACITY_LEVEL: 'pfOpacityLevel',      // number — opacity of unimportant emails (0.0 to 0.4)
    SHOW_TOASTS: 'pfShowToasts',        // boolean — enable/disable notifications
    ACCENT_COLOR: 'pfAccentColor',       // string HEX — custom priority highlight color
};

// ─── CSS class names we apply to Gmail's own DOM elements ────────────────────
// Prefixed with "pf-" (priority filter) — short, readable, unlikely to collide
// with Gmail's own class names.
export const CSS = {
    FILTER_ON_BODY: 'pf-filter-on',        // Added to <body> when filter is active
    SENDER_HIGHLIGHT: 'pf-sender-highlight',  // Marks rows from priority senders
    UNREAD_HIGHLIGHT: 'pf-sender-unread',     // Marks highlight rows that are also unread
    MODAL_OPEN_BODY: 'pf-modal-open',       // Added to <body> when settings modal is visible
};

// ─── IDs for elements we inject into the page ────────────────────────────────
// IDs are unique by definition so short prefixes aren't needed,
// but "priority-" keeps them recognisable in DevTools.
export const IDS = {
    FILTER_STYLE_TAG: 'priority-filter-styles',    // <style> for the row-dimming CSS
    TOAST_STYLE_TAG: 'priority-toast-styles',     // <style> for toast CSS
    SETTINGS_STYLE_TAG: 'priority-settings-styles',  // <style> for settings & modal CSS
    TOAST_CONTAINER: 'priority-notifications',    // The div that holds all toasts
    TOOLBAR_FILTER_BTN: 'priority-toolbar-btn',      // Button in Gmail's top toolbar
    SETTINGS_COG_BTN: 'priority-settings-cog',     // Floating settings button
    MODAL_OVERLAY: 'priority-settings-overlay', // Dark background for the modal
    MODAL_CONTENT: 'priority-settings-modal',   // The actual modal card
    OPACITY_SLIDER: 'pf-opacity-slider',         // Slider input in modal
    DEFAULT_ON_TOGGLE: 'pf-default-on-toggle',      // Toggle input in modal
    TOAST_TOGGLE: 'pf-toast-toggle',           // Toggle for notifications
    COLOR_PICKER: 'pf-color-picker',           // Accent color input
};

// ─── data-* attributes we set on elements we inject or track ─────────────────
export const DATA = {
    ACTION_BTN: 'data-action-btn',   // Attribute on our injected row button (used as selector)
    ROW_TRACKED: 'data-row-tracked',  // Set on rows we've already attached an observer to
};

// ─── CSS selectors for reading Gmail's own DOM ───────────────────────────────
// Prefer aria-label selectors (stable) over internal Gmail class names (fragile).
export const SELECTORS = {
    // Gmail email list rows
    GMAIL_ROW: 'tr.zA',           // Every row in the inbox list
    EMAIL_ROW: 'tr[role="row"]',  // More specific: rows with role attribute

    // Sender identification — two Gmail span variants for sender name
    SENDER_SPAN: 'span.zF[email], span.yP[email]',
    SENDER_ATTR: '[email]',         // Any element with an email="" attribute

    // Row hover toolbar
    ROW_TOOLBAR: 'ul[role="toolbar"]',
    ARCHIVE_BTN: '[data-tooltip="Archive"]',  // We clone this button for our own

    // Gmail top-bar toolbar — using aria where possible
    MORE_OPTIONS: '[aria-label="More email options"]',  // Toolbar anchor point
    TOOLBAR_GROUP: '.G-Ni',   // Flex wrapper around each toolbar button group
    // (no aria equivalent — Gmail internal class)

    // Subject line
    SUBJECT_LINE: 'span.bog',      // The main subject text span

    // Main content region
    MAIN: 'div[role="main"]',
    MAIN_FALLBACKS: ['.AO', '.nH'],  // Older Gmail UI fallbacks
};

// ─── Default seed data on first install ──────────────────────────────────────
export const DEFAULT_SENDERS = [
    'cs.dept@ashoka.edu.in',
    'technology.ministry@ashoka.edu.in',
];

export const DEFAULT_DOMAINS = [
    'classroom.google.com',
];

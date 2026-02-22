/**
 * content/filter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Core filtering logic — handles highlighting and dimming.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { CSS, SELECTORS, IDS } from '../constants';
import { getSenderList, getDomainList, getOpacityLevel, getKeywordList, getAccentColor } from '../services/storage';
import { injectStyle } from '../utils/dom';
import { isRuntimeValid } from '../utils/runtime';
import filterCSS from '../styles/filter.css?inline';

let _isOn = false;
let _watcher = null;

// ─── Setup ────────────────────────────────────────────────────────────────────

export async function setupFilter() {
    injectStyle(IDS.FILTER_STYLE_TAG, filterCSS);

    // Set initial opacity & color from storage
    const [opacity, color] = await Promise.all([
        getOpacityLevel(),
        getAccentColor()
    ]);

    updateFilterOpacity(opacity);
    updateFilterAccentColor(color);
}

/**
 * Updates the CSS variable on <body> to change dimming level instantly.
 */
export function updateFilterOpacity(value) {
    document.documentElement.style.setProperty('--pf-unimportant-opacity', value);
}

/**
 * Updates the CSS variable for the vertical accent bar.
 */
export function updateFilterAccentColor(hex) {
    document.documentElement.style.setProperty('--pf-accent-color', hex);
}

// ─── Public toggle API ────────────────────────────────────────────────────────

export function isFilterOn() {
    return _isOn;
}

export async function turnFilterOn() {
    _isOn = true;
    document.body.classList.add(CSS.FILTER_ON_BODY);
    await highlightPriorityRows();
    _startWatching();
}

export async function turnFilterOff() {
    _isOn = false;
    document.body.classList.remove(CSS.FILTER_ON_BODY);
    _stopWatching();
    _clearAllHighlights();
}

export async function toggleFilter() {
    if (_isOn) await turnFilterOff();
    else await turnFilterOn();
    return _isOn;
}

// ─── Highlight logic ──────────────────────────────────────────────────────────

/**
 * Matches rows against specific emails, domains, and subject keywords.
 */
export async function highlightPriorityRows() {
    if (!isRuntimeValid()) return;
    if (!_isOn) return;

    const [emails, domains, keywords] = await Promise.all([
        getSenderList(),
        getDomainList(),
        getKeywordList()
    ]);

    _clearAllHighlights();

    document.querySelectorAll(SELECTORS.GMAIL_ROW).forEach((row) => {
        const rowEmail = _getSenderEmail(row);
        const subject = _getSubjectText(row);
        if (!rowEmail) return;

        const isImportant = _isEmailPriority(rowEmail, subject, emails, domains, keywords);

        if (isImportant) {
            row.classList.add(CSS.SENDER_HIGHLIGHT);
            if (row.classList.contains('zE')) {
                row.classList.add(CSS.UNREAD_HIGHLIGHT);
            }
        }
    });
}

function _isEmailPriority(email, subject, priorityEmails, priorityDomains, priorityKeywords) {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedSubject = (subject || '').toLowerCase();

    // 1. Direct email match
    if (priorityEmails.includes(normalizedEmail)) return true;

    // 2. Domain / Subdomain match
    const isDomainMatch = priorityDomains.some(domain => {
        const d = domain.toLowerCase().trim();
        return normalizedEmail.endsWith('@' + d) || normalizedEmail.endsWith('.' + d);
    });
    if (isDomainMatch) return true;

    // 3. Subject Keywords match
    if (priorityKeywords.length > 0) {
        return priorityKeywords.some(keyword => {
            const k = keyword.toLowerCase().trim();
            return k && normalizedSubject.includes(k);
        });
    }

    return false;
}

function _getSubjectText(row) {
    const span = row.querySelector(SELECTORS.SUBJECT_LINE);
    return span ? span.textContent : '';
}

function _getSenderEmail(row) {
    const span = row.querySelector(SELECTORS.SENDER_ATTR);
    if (!span) return null;
    return span.getAttribute('email') || span.getAttribute('data-hovercard-id');
}

function _clearAllHighlights() {
    document.querySelectorAll(SELECTORS.GMAIL_ROW).forEach((row) => {
        row.classList.remove(CSS.SENDER_HIGHLIGHT, CSS.UNREAD_HIGHLIGHT);
    });
}

// ─── MutationObserver ─────────────────────────────────────────────────────────

function _startWatching() {
    if (_watcher) return;
    _watcher = new MutationObserver(() => {
        if (!isRuntimeValid()) {
            _stopWatching();
            return;
        }
        if (_isOn) highlightPriorityRows();
    });
    _watcher.observe(document.body, { childList: true, subtree: true });
}

function _stopWatching() {
    if (_watcher) {
        _watcher.disconnect();
        _watcher = null;
    }
}

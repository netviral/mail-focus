/**
 * content/rowActions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Injects importance buttons into Gmail rows.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { SELECTORS, DATA } from '../constants';
import { ICONS } from '../config';
import { getSenderList, saveSenderList, getDomainList } from '../services/storage';
import { getSenderFromRow } from '../utils/dom';
import { showToast } from './toast';
import { isRuntimeValid } from '../utils/runtime';

// ─── Module-level state ───────────────────────────────────────────────────────

let _emailSet = new Set();
let _domainSet = new Set();

// ─── Setup ────────────────────────────────────────────────────────────────────

export async function setupRowActions() {
    await refreshRowActions();
    _watchGmailForNewRows();
}

/**
 * Re-fetches priority lists from storage and updates all visible icons.
 * Exported so settings.js can trigger it when the modal changes.
 */
export async function refreshRowActions() {
    if (!isRuntimeValid()) return;
    const [emails, domains] = await Promise.all([getSenderList(), getDomainList()]);
    _emailSet = new Set(emails);
    _domainSet = new Set(domains);
    _syncAllVisibleIcons();
}

/** 
 * Checks if an email is priority based on BOTH individual list and domain list.
 */
function _isPriority(email) {
    if (!email) return false;
    const normalized = email.toLowerCase().trim();
    if (_emailSet.has(normalized)) return true;

    return Array.from(_domainSet).some(domain => {
        const d = domain.toLowerCase().trim();
        return normalized.endsWith('@' + d) || normalized.endsWith('.' + d);
    });
}

// ─── Button creation ──────────────────────────────────────────────────────────

function _buildActionButton(cloneFrom, icon, tooltip, onClick) {
    const button = cloneFrom.cloneNode(true);
    button.setAttribute(DATA.ACTION_BTN, 'true');
    button.setAttribute('data-tooltip', tooltip);
    button.removeAttribute('jsaction');
    button.removeAttribute('jscontroller');
    button.removeAttribute('jslog');
    button.innerHTML = icon;
    button.style.background = 'none';
    button.style.backgroundImage = 'none';

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
    });

    return button;
}

// ─── Row injection ────────────────────────────────────────────────────────────

function _injectButtonIntoRow(row) {
    const toolbar = row.querySelector(SELECTORS.ROW_TOOLBAR);
    if (!toolbar || toolbar.querySelector(`[${DATA.ACTION_BTN}]`)) return;

    const archiveBtn = toolbar.querySelector(SELECTORS.ARCHIVE_BTN);
    if (!archiveBtn) return;

    const senderEmail = getSenderFromRow(row);
    if (!senderEmail) return;

    const alreadyPriority = _isPriority(senderEmail);
    const icon = alreadyPriority ? ICONS.markUnimportant : ICONS.markImportant;
    const tooltip = alreadyPriority ? 'Mark sender as unimportant' : 'Mark sender as important';

    const button = _buildActionButton(archiveBtn, icon, tooltip, async () => {
        const isCurrentlyInEmailList = _emailSet.has(senderEmail);

        if (isCurrentlyInEmailList) {
            _emailSet.delete(senderEmail);
            await saveSenderList([..._emailSet]);
            showToast({ email: senderEmail, added: false });
        } else {
            _emailSet.add(senderEmail);
            await saveSenderList([..._emailSet]);
            showToast({ email: senderEmail, added: true });
        }

        // Local sync after button click
        _syncAllVisibleIcons();
    });

    toolbar.insertBefore(button, archiveBtn);
    _watchRowForRerender(row);
}

// ─── Icon state sync ──────────────────────────────────────────────────────────

function _syncAllVisibleIcons() {
    document.querySelectorAll(SELECTORS.GMAIL_ROW).forEach((row) => {
        const email = getSenderFromRow(row);
        const btn = row.querySelector(`[${DATA.ACTION_BTN}]`);
        if (!email || !btn) return;

        const isEffectivePriority = _isPriority(email);
        btn.innerHTML = isEffectivePriority ? ICONS.markUnimportant : ICONS.markImportant;
        btn.setAttribute(
            'data-tooltip',
            isEffectivePriority ? 'Mark sender as unimportant' : 'Mark sender as important'
        );
    });
}

// ─── Lifecycle / Observers ────────────────────────────────────────────────────

function _watchRowForRerender(row) {
    if (row.hasAttribute(DATA.ROW_TRACKED)) return;
    row.setAttribute(DATA.ROW_TRACKED, 'true');

    new MutationObserver((_mutations, observer) => {
        if (!isRuntimeValid()) {
            observer.disconnect();
            return;
        }
        const toolbar = row.querySelector(SELECTORS.ROW_TOOLBAR);
        if (toolbar && !toolbar.querySelector(`[${DATA.ACTION_BTN}]`)) {
            _injectButtonIntoRow(row);
        }
    }).observe(row, { childList: true, subtree: true });
}

function _watchGmailForNewRows() {
    new MutationObserver((mutations, observer) => {
        if (!isRuntimeValid()) {
            observer.disconnect();
            return;
        }
        const hasNew = mutations.some(m => m.addedNodes.length > 0);
        if (hasNew) {
            document.querySelectorAll(SELECTORS.GMAIL_ROW).forEach(_injectButtonIntoRow);
        }
    }).observe(document.body, { childList: true, subtree: true });

    document.querySelectorAll(SELECTORS.GMAIL_ROW).forEach(_injectButtonIntoRow);
}

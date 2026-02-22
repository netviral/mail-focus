/**
 * services/storage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * All reads and writes to chrome.storage.local go through here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { STORAGE_KEYS, DEFAULT_SENDERS, DEFAULT_DOMAINS } from '../constants';

/**
 * Safely executes a chrome storage operation, catching 'context invalidated'
 * errors that occur when the extension updates/reloads in the background.
 */
function safeStorage(fn, fallbackAction) {
    try {
        if (chrome.runtime?.id) {
            return fn();
        }
        console.warn('[Focus Workspace] Extension context invalidated.');
    } catch (e) {
        console.warn('[Focus Workspace] Storage error:', e);
    }

    if (typeof fallbackAction === 'function') {
        return fallbackAction();
    }
    return fallbackAction;
}

/**
 * Resets all extension data to factory defaults.
 */
export async function restoreDefaults() {
    return new Promise((resolve) => {
        const defaults = {
            [STORAGE_KEYS.EMAIL_LIST]: [...DEFAULT_SENDERS],
            [STORAGE_KEYS.DOMAIN_LIST]: [...DEFAULT_DOMAINS],
            [STORAGE_KEYS.KEYWORD_LIST]: [],
            [STORAGE_KEYS.DEFAULT_ON]: false,
            [STORAGE_KEYS.OPACITY_LEVEL]: 0.1,
            [STORAGE_KEYS.SHOW_TOASTS]: true,
            [STORAGE_KEYS.ACCENT_COLOR]: '#5f6368',
        };
        safeStorage(() => chrome.storage.local.set(defaults, resolve), () => resolve());
    });
}

/** 
 * Clears an entire list by key 
 */
export async function clearStorageKey(key) {
    return new Promise((resolve) => {
        safeStorage(() => chrome.storage.local.set({ [key]: [] }, resolve), () => resolve());
    });
}
// ─── Sender lists (Email & Domain) ────────────────────────────────────────────

/**
 * Returns the saved list of priority sender addresses.
 */
export async function getSenderList() {
    return new Promise((resolve) => {
        safeStorage(() => {
            chrome.storage.local.get([STORAGE_KEYS.EMAIL_LIST], (result) => {
                if (chrome.runtime.lastError) {
                    return resolve([...DEFAULT_SENDERS]);
                }
                const stored = result[STORAGE_KEYS.EMAIL_LIST];
                if (!stored) {
                    saveSenderList(DEFAULT_SENDERS);
                    resolve([...DEFAULT_SENDERS]);
                } else {
                    resolve(stored);
                }
            });
        }, () => resolve([...DEFAULT_SENDERS]));
    });
}

export async function saveSenderList(senders) {
    return new Promise((resolve) => {
        safeStorage(() => chrome.storage.local.set({ [STORAGE_KEYS.EMAIL_LIST]: senders }, resolve), () => resolve());
    });
}

export async function addSender(email) {
    const list = await getSenderList();
    if (!list.includes(email)) {
        list.push(email);
        await saveSenderList(list);
    }
    return list;
}

export async function removeSender(email) {
    const list = await getSenderList();
    const updated = list.filter((e) => e !== email);
    await saveSenderList(updated);
    return updated;
}

/**
 * Returns the saved list of priority domains.
 */
export async function getDomainList() {
    return new Promise((resolve) => {
        safeStorage(() => {
            chrome.storage.local.get([STORAGE_KEYS.DOMAIN_LIST], (result) => {
                if (chrome.runtime.lastError) {
                    return resolve([...DEFAULT_DOMAINS]);
                }
                const stored = result[STORAGE_KEYS.DOMAIN_LIST];
                if (!stored) {
                    saveDomainList(DEFAULT_DOMAINS);
                    resolve([...DEFAULT_DOMAINS]);
                } else {
                    resolve(stored);
                }
            });
        }, () => resolve([...DEFAULT_DOMAINS]));
    });
}

export async function saveDomainList(domains) {
    return new Promise((resolve) => {
        safeStorage(() => chrome.storage.local.set({ [STORAGE_KEYS.DOMAIN_LIST]: domains }, resolve), () => resolve());
    });
}

export async function addDomain(domain) {
    const list = await getDomainList();
    if (!list.includes(domain)) {
        list.push(domain);
        await saveDomainList(list);
    }
    return list;
}

export async function removeDomain(domain) {
    const list = await getDomainList();
    const updated = list.filter((d) => d !== domain);
    await saveDomainList(updated);
    return updated;
}

// ─── Keyword Lists ────────────────────────────────────────────────────────────

export async function getKeywordList() {
    return new Promise((resolve) => {
        safeStorage(() => {
            chrome.storage.local.get([STORAGE_KEYS.KEYWORD_LIST], (result) => {
                resolve(result[STORAGE_KEYS.KEYWORD_LIST] || []);
            });
        }, () => resolve([]));
    });
}

export async function saveKeywordList(keywords) {
    return new Promise((resolve) => {
        safeStorage(() => chrome.storage.local.set({ [STORAGE_KEYS.KEYWORD_LIST]: keywords }, resolve), () => resolve());
    });
}

export async function addKeyword(keyword) {
    const list = await getKeywordList();
    if (!list.includes(keyword)) {
        list.push(keyword);
        await saveKeywordList(list);
    }
    return list;
}

export async function removeKeyword(keyword) {
    const list = await getKeywordList();
    const updated = list.filter((k) => k !== keyword);
    await saveKeywordList(updated);
    return updated;
}

// ─── Preferences (Default On, Opacity, Toasts, Color) ─────────────────────────

/** Returns whether the filter should be active by default. */
export async function getDefaultOn() {
    return new Promise((resolve) => {
        safeStorage(() => {
            chrome.storage.local.get([STORAGE_KEYS.DEFAULT_ON], (result) => {
                resolve(!!result[STORAGE_KEYS.DEFAULT_ON]);
            });
        }, () => resolve(false));
    });
}

export async function saveDefaultOn(isOn) {
    return new Promise((resolve) => {
        safeStorage(() => chrome.storage.local.set({ [STORAGE_KEYS.DEFAULT_ON]: isOn }, resolve), () => resolve());
    });
}

/** Returns the set opacity level (0.1 to 0.4). */
export async function getOpacityLevel() {
    return new Promise((resolve) => {
        safeStorage(() => {
            chrome.storage.local.get([STORAGE_KEYS.OPACITY_LEVEL], (result) => {
                const val = result[STORAGE_KEYS.OPACITY_LEVEL];
                resolve(val !== undefined ? val : 0.1);
            });
        }, () => resolve(0.1));
    });
}

export async function saveOpacityLevel(level) {
    return new Promise((resolve) => {
        safeStorage(() => chrome.storage.local.set({ [STORAGE_KEYS.OPACITY_LEVEL]: level }, resolve), () => resolve());
    });
}

/** Toast preference */
export async function getShowToasts() {
    return new Promise((resolve) => {
        safeStorage(() => {
            chrome.storage.local.get([STORAGE_KEYS.SHOW_TOASTS], (result) => {
                resolve(result[STORAGE_KEYS.SHOW_TOASTS] !== false);
            });
        }, () => resolve(true));
    });
}

export async function saveShowToasts(show) {
    return new Promise((resolve) => {
        safeStorage(() => chrome.storage.local.set({ [STORAGE_KEYS.SHOW_TOASTS]: show }, resolve), () => resolve());
    });
}

/** Accent color */
export async function getAccentColor() {
    return new Promise((resolve) => {
        safeStorage(() => {
            chrome.storage.local.get([STORAGE_KEYS.ACCENT_COLOR], (result) => {
                resolve(result[STORAGE_KEYS.ACCENT_COLOR] || '#5f6368');
            });
        }, () => resolve('#5f6368'));
    });
}

export async function saveAccentColor(color) {
    return new Promise((resolve) => {
        safeStorage(() => chrome.storage.local.set({ [STORAGE_KEYS.ACCENT_COLOR]: color }, resolve), () => resolve());
    });
}

// ─── Change listener ──────────────────────────────────────────────────────────

export function onStorageChanged(callback) {
    safeStorage(() => {
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'local') callback(changes);
        });
    });
}

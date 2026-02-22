/**
 * content/settings.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the tabbed settings UI — toggle, slider, emails, and domains.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { IDS, CSS, STORAGE_KEYS } from '../constants';
import { ICONS } from '../config';
import {
    getSenderList, addSender, removeSender,
    getDomainList, addDomain, removeDomain,
    getKeywordList, addKeyword, removeKeyword,
    getDefaultOn, saveDefaultOn,
    getOpacityLevel, saveOpacityLevel,
    getShowToasts, saveShowToasts,
    getAccentColor, saveAccentColor,
    restoreDefaults, clearStorageKey
} from '../services/storage';
import { injectStyle } from '../utils/dom';
import { updateFilterOpacity, highlightPriorityRows, updateFilterAccentColor } from './filter';
import { refreshRowActions } from './rowActions';
import { isRuntimeValid } from '../utils/runtime';
import settingsCSS from '../styles/settings.css?inline';

let _overlay = null;
let _modal = null;

// Search state
let _emailFilter = '';
let _domainFilter = '';
let _keywordFilter = '';

// ─── Setup ────────────────────────────────────────────────────────────────────

export function setupSettings() {
    injectStyle(IDS.SETTINGS_STYLE_TAG, settingsCSS);
    _injectFloatingButton();
}

function _injectFloatingButton() {
    if (!isRuntimeValid()) return;
    if (document.getElementById(IDS.SETTINGS_COG_BTN)) return;

    const btn = document.createElement('div');
    btn.id = IDS.SETTINGS_COG_BTN;
    btn.className = 'T-I J-J5-Ji nf T-I-ax7 L3';
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.style.marginLeft = '12px';
    btn.style.marginRight = '8px';
    btn.innerHTML = ICONS.settings;
    btn.setAttribute('data-tooltip', 'Focus Workspace Settings');

    btn.addEventListener('click', _openSettingsModal);
    document.body.appendChild(btn);
}

// ─── Modal Management ───────────────────────────────────────────────────────

async function _openSettingsModal() {
    if (!isRuntimeValid()) {
        alert('Extension context invalidated. Please refresh the page to use settings.');
        return;
    }
    if (!_overlay) _createModalStructure();

    await _refreshAllUI();

    // Reset to first tab (Senders) on open
    const tabs = _modal.querySelectorAll('.pf-tab-btn');
    const contents = _modal.querySelectorAll('.pf-tab-content');
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));

    const senderTab = _modal.querySelector('.pf-tab-btn[data-tab="pf-tab-senders"]');
    const senderContent = _modal.querySelector('#pf-tab-senders');
    if (senderTab && senderContent) {
        senderTab.classList.add('active');
        senderContent.classList.add('active');
    }

    // Reset scroll position on open
    const scrollBody = _modal.querySelector('.pf-modal-body');
    if (scrollBody) scrollBody.scrollTop = 0;

    _overlay.classList.add('visible');
    document.body.classList.add(CSS.MODAL_OPEN_BODY);
}

function _closeSettingsModal() {
    if (_overlay) {
        _overlay.classList.remove('visible');
        document.body.classList.remove(CSS.MODAL_OPEN_BODY);
    }
}

function _createModalStructure() {
    _overlay = document.createElement('div');
    _overlay.id = IDS.MODAL_OVERLAY;

    _modal = document.createElement('div');
    _modal.id = IDS.MODAL_CONTENT;

    _modal.innerHTML = `
        <div class="pf-modal-header">
            <h2>Focus Workspace</h2>
            <div class="pf-modal-close-btn" id="pf-modal-close">${ICONS.close}</div>
        </div>

        <div class="pf-tabs">
            <button class="pf-tab-btn active" data-tab="pf-tab-senders">Priority Senders</button>
            <button class="pf-tab-btn" data-tab="pf-tab-domains">Priority Domains</button>
            <button class="pf-tab-btn" data-tab="pf-tab-keywords">Priority Keywords</button>
            <button class="pf-tab-btn" data-tab="pf-tab-general">General</button>
        </div>
        
        <div class="pf-modal-scroll-wrapper">
            <div class="pf-modal-body">
                
                <!-- 1. Senders Tab (Now First) -->
                <div class="pf-tab-content active" id="pf-tab-senders">
                    <div class="pf-list-section">
                        <div class="pf-control-desc">
                            Emails from these specific senders will always be marked important.
                        </div>
                        <div class="pf-input-group">
                            <input type="email" class="pf-input" id="pf-email-input" placeholder="Add email address" />
                            <button class="pf-action-btn" id="pf-add-email">Add</button>
                        </div>
                        <div class="pf-list-actions" id="pf-emails-actions" style="display: none;">
                            <button class="pf-text-btn" id="pf-clear-emails">Clear Senders</button>
                        </div>
                        
                        <div class="pf-list-management-header">
                            <span class="pf-list-title">Important Senders</span>
                            <div class="pf-search-expand-wrapper" id="pf-sender-search-wrap">
                                <input type="text" class="pf-input pf-search-input-field" id="pf-sender-search" placeholder="Search...">
                                <div class="pf-search-expand-icon" title="Search">${ICONS.search}</div>
                            </div>
                        </div>
                        <div class="pf-item-list" id="pf-em-list"></div>
                    </div>
                </div>

                <!-- 2. Domains Tab -->
                <div class="pf-tab-content" id="pf-tab-domains">
                    <div class="pf-list-section">
                        <div class="pf-control-desc">
                            Any email from these domains (e.g., workplace.com) will be marked as important.
                        </div>
                        <div class="pf-input-group">
                            <input type="text" class="pf-input" id="pf-domain-input" placeholder="eg. classroom.google.com" />
                            <button class="pf-action-btn" id="pf-add-domain">Add</button>
                        </div>
                        <div class="pf-list-actions" id="pf-domains-actions" style="display: none;">
                            <button class="pf-text-btn" id="pf-clear-domains">Clear Domains</button>
                        </div>

                        <div class="pf-list-management-header">
                            <span class="pf-list-title">Important Domains</span>
                            <div class="pf-search-expand-wrapper" id="pf-domain-search-wrap">
                                <input type="text" class="pf-input pf-search-input-field" id="pf-domain-search" placeholder="Search...">
                                <div class="pf-search-expand-icon" title="Search">${ICONS.search}</div>
                            </div>
                        </div>
                        <div class="pf-item-list" id="pf-dom-list"></div>
                    </div>
                </div>

                <!-- 3. Keywords Tab -->
                <div class="pf-tab-content" id="pf-tab-keywords">
                    <div class="pf-list-section">
                        <div class="pf-control-desc">
                            Mark emails with these keywords in the SUBJECT as important.
                        </div>
                        <div class="pf-input-group">
                            <input type="text" class="pf-input" id="pf-keyword-input" placeholder="eg. urgent, tech, volunteer, internship, project ..." />
                            <button class="pf-action-btn" id="pf-add-keyword">Add</button>
                        </div>
                        <div class="pf-list-actions" id="pf-keywords-actions" style="display: none;">
                            <button class="pf-text-btn" id="pf-clear-keywords">Clear Keywords</button>
                        </div>

                        <div class="pf-list-management-header">
                            <span class="pf-list-title">Important Keywords</span>
                            <div class="pf-search-expand-wrapper" id="pf-keyword-search-wrap">
                                <input type="text" class="pf-input pf-search-input-field" id="pf-keyword-search" placeholder="Search...">
                                <div class="pf-search-expand-icon" title="Search">${ICONS.search}</div>
                            </div>
                        </div>
                        <div class="pf-item-list" id="pf-key-list"></div>
                    </div>
                </div>

                <!-- 4. General Tab (Now Last) -->
                <div class="pf-tab-content" id="pf-tab-general">
                    <div class="pf-section">
                        <div class="pf-control-row">
                            <div class="pf-control-header">
                                <div class="pf-control-label">
                                    <span class="pf-control-name">Startup Preference</span>
                                    <span class="pf-control-desc">When Gmail first loads, which emails do you wish to see first</span>
                                </div>
                            </div>
                            <div class="pf-toggle-wrapper">
                                <span class="pf-toggle-text pf-label-off">Load All</span>
                                <label class="pf-switch">
                                    <input type="checkbox" id="${IDS.DEFAULT_ON_TOGGLE}">
                                    <span class="pf-slider"></span>
                                </label>
                                <span class="pf-toggle-text pf-label-on">Important Only</span>
                            </div>
                        </div>

                        <div class="pf-control-row">
                            <div class="pf-control-header">
                                <div class="pf-control-label">
                                    <span class="pf-control-name">Invisibility Level</span>
                                    <span class="pf-control-desc">Opacity of unimportant emails. At 0.10, they are nearly invisible.</span>
                                </div>
                            </div>
                            <div class="pf-range-wrapper">
                                <input type="range" id="${IDS.OPACITY_SLIDER}" class="pf-range" min="0.1" max="0.4" step="0.05">
                                <span class="pf-range-value" id="pf-opacity-val">0.10</span>
                            </div>
                        </div>

                        <div class="pf-control-row">
                            <div class="pf-control-header">
                                <div class="pf-control-label">
                                    <span class="pf-control-name">Notifications</span>
                                    <span class="pf-control-desc">Show toast notifications when marking senders as important/unimportant</span>
                                </div>
                            </div>
                            <label class="pf-switch">
                                <input type="checkbox" id="${IDS.TOAST_TOGGLE}">
                                <span class="pf-slider"></span>
                            </label>
                        </div>

                        <div class="pf-control-row">
                            <div class="pf-control-header">
                                <div class="pf-control-label">
                                    <span class="pf-control-name">Accent color</span>
                                    <span class="pf-control-desc">Customize the color of the vertical highlight bar.</span>
                                </div>
                            </div>
                            <div class="pf-color-picker-wrapper">
                                <input type="color" id="${IDS.COLOR_PICKER}" class="pf-color-picker-input">
                            </div>
                        </div>

                        <button id="pf-restore-defaults" class="pf-text-btn pf-restore-btn">Restore System Defaults</button>
                    </div>
                </div>

            </div>
        </div>
        <div class="pf-modal-footer">
            Made by Ibrahim Khalil
        </div>
    `;

    _overlay.appendChild(_modal);
    document.body.appendChild(_overlay);

    _setupEventListeners();
}

function _setupEventListeners() {
    _modal.querySelector('#pf-modal-close').addEventListener('click', _closeSettingsModal);
    _overlay.addEventListener('click', (e) => { if (e.target === _overlay) _closeSettingsModal(); });

    const scrollBody = _modal.querySelector('.pf-modal-body');

    // Tab Logic
    const tabs = _modal.querySelectorAll('.pf-tab-btn');
    const contents = _modal.querySelectorAll('.pf-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            _modal.querySelector(`#${tab.dataset.tab}`).classList.add('active');

            // Reset scroll position on tab change
            if (scrollBody) scrollBody.scrollTop = 0;
        });
    });

    // Preferences
    const defOn = _modal.querySelector(`#${IDS.DEFAULT_ON_TOGGLE}`);
    defOn.addEventListener('change', (e) => saveDefaultOn(e.target.checked));

    const slider = _modal.querySelector(`#${IDS.OPACITY_SLIDER}`);
    const valLabel = _modal.querySelector('#pf-opacity-val');
    slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valLabel.textContent = val.toFixed(2);
        saveOpacityLevel(val);
        updateFilterOpacity(val);
    });

    const toastToggle = _modal.querySelector(`#${IDS.TOAST_TOGGLE}`);
    toastToggle.addEventListener('change', (e) => saveShowToasts(e.target.checked));

    const colorPicker = _modal.querySelector(`#${IDS.COLOR_PICKER}`);
    colorPicker.addEventListener('input', (e) => {
        const hex = e.target.value;
        saveAccentColor(hex);
        updateFilterAccentColor(hex);
    });

    // Restore Defaults
    _modal.querySelector('#pf-restore-defaults').addEventListener('click', async () => {
        if (confirm('Are you sure? This will reset all your keywords, senders, and preferences.')) {
            await restoreDefaults();
            const opacity = await getOpacityLevel();
            const color = await getAccentColor();
            updateFilterOpacity(opacity);
            updateFilterAccentColor(color);
            await _refreshAllUI();
            highlightPriorityRows();
            refreshRowActions();
        }
    });

    // Simplified Search logic (Expanding on click)
    const setupSearchField = (wrapId, inputId) => {
        const wrap = _modal.querySelector(`#${wrapId}`);
        const input = _modal.querySelector(`#${inputId}`);
        const icon = wrap.querySelector('.pf-search-expand-icon');

        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = wrap.classList.contains('expanded');

            if (isExpanded) {
                // Clicking icon twice clears and closes
                input.value = '';
                const event = new Event('input');
                input.dispatchEvent(event);
                wrap.classList.remove('expanded');
                input.blur();
            } else {
                wrap.classList.add('expanded');
                setTimeout(() => input.focus(), 100);
            }
        });

        input.addEventListener('blur', () => {
            if (!input.value) {
                wrap.classList.remove('expanded');
            }
        });

        input.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            if (inputId.includes('sender')) _emailFilter = val;
            else if (inputId.includes('domain')) _domainFilter = val;
            else if (inputId.includes('keyword')) _keywordFilter = val;
            _refreshAllUI();
        });
    };

    setupSearchField('pf-sender-search-wrap', 'pf-sender-search');
    setupSearchField('pf-domain-search-wrap', 'pf-domain-search');
    setupSearchField('pf-keyword-search-wrap', 'pf-keyword-search');

    // List Logic
    const setupListInput = (inputId, btnId, searchInputId, addFn) => {
        const input = _modal.querySelector(`#${inputId}`);
        const btn = _modal.querySelector(`#${btnId}`);
        const searchInput = _modal.querySelector(`#${searchInputId}`);
        const searchWrap = searchInput.closest('.pf-search-expand-wrapper');

        const handle = async () => {
            const val = input.value.trim().toLowerCase();
            if (val) {
                await addFn(val);
                input.value = '';

                // Clear search filter/collapse when adding new item
                if (searchInput.value || searchWrap.classList.contains('expanded')) {
                    searchInput.value = '';
                    if (searchInputId.includes('sender')) _emailFilter = '';
                    else if (searchInputId.includes('domain')) _domainFilter = '';
                    else if (searchInputId.includes('keyword')) _keywordFilter = '';
                    searchWrap.classList.remove('expanded');
                }

                await _refreshAllUI();
                highlightPriorityRows();
                refreshRowActions();
            }
        };
        btn.addEventListener('click', handle);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') handle(); });
    };

    setupListInput('pf-email-input', 'pf-add-email', 'pf-sender-search', addSender);
    setupListInput('pf-domain-input', 'pf-add-domain', 'pf-domain-search', addDomain);
    setupListInput('pf-keyword-input', 'pf-add-keyword', 'pf-keyword-search', addKeyword);

    // Bulk actions
    const setupClear = (btnId, key, refreshFn) => {
        _modal.querySelector(`#${btnId}`).addEventListener('click', async () => {
            let type = 'items';
            if (btnId.includes('emails')) type = 'senders';
            else if (btnId.includes('domains')) type = 'domains';
            else if (btnId.includes('keywords')) type = 'keywords';

            if (confirm(`Are you sure you wish to clear all ${type}? This action is irreversible`)) {
                await clearStorageKey(key);
                await _refreshAllUI();
                highlightPriorityRows();
                refreshRowActions();
            }
        });
    };

    setupClear('pf-clear-emails', STORAGE_KEYS.EMAIL_LIST);
    setupClear('pf-clear-domains', STORAGE_KEYS.DOMAIN_LIST);
    setupClear('pf-clear-keywords', STORAGE_KEYS.KEYWORD_LIST);
}

async function _refreshAllUI() {
    const [defOn, opacity, showToasts, color, emails, domains, keywords] = await Promise.all([
        getDefaultOn(),
        getOpacityLevel(),
        getShowToasts(),
        getAccentColor(),
        getSenderList(),
        getDomainList(),
        getKeywordList()
    ]);

    _modal.querySelector(`#${IDS.DEFAULT_ON_TOGGLE}`).checked = defOn;
    _modal.querySelector(`#${IDS.OPACITY_SLIDER}`).value = opacity;
    _modal.querySelector('#pf-opacity-val').textContent = opacity.toFixed(2);
    _modal.querySelector(`#${IDS.TOAST_TOGGLE}`).checked = showToasts;
    _modal.querySelector(`#${IDS.COLOR_PICKER}`).value = color;

    const renderList = (containerId, items, filterText, removeFn) => {
        const container = _modal.querySelector(`#${containerId}`);
        const filtered = items.filter(i => i.toLowerCase().includes(filterText));

        if (items.length === 0) {
            container.innerHTML = `<div class="pf-empty">No entries added yet.</div>`;
            return;
        }

        if (filtered.length === 0 && filterText) {
            container.innerHTML = `<div class="pf-empty">No matches found for "${filterText}".</div>`;
            return;
        }

        container.innerHTML = '';
        filtered.forEach(text => {
            const el = document.createElement('div');
            el.className = 'pf-list-entry';
            el.innerHTML = `
                <span class="pf-entry-email">${text}</span>
                <span class="pf-remove-item">${ICONS.close}</span>
            `;
            el.querySelector('.pf-remove-item').addEventListener('click', async () => {
                await removeFn(text);
                await _refreshAllUI();
                highlightPriorityRows();
                refreshRowActions();
            });
            container.appendChild(el);
        });
    };

    renderList('pf-em-list', emails, _emailFilter, removeSender);
    _modal.querySelector('#pf-emails-actions').style.display = emails.length > 1 ? 'flex' : 'none';

    renderList('pf-dom-list', domains, _domainFilter, removeDomain);
    _modal.querySelector('#pf-domains-actions').style.display = domains.length > 1 ? 'flex' : 'none';

    renderList('pf-key-list', keywords, _keywordFilter, removeKeyword);
    _modal.querySelector('#pf-keywords-actions').style.display = keywords.length > 1 ? 'flex' : 'none';
}

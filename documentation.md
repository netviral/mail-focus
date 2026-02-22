# Gmail Priority Filter

A lightweight, premium Chrome extension that transforms your Gmail into a focus-driven experience by dimming everything except your most important correspondence.

---

## 🚀 Features

### 1. Priority Dimming
- **Intelligent Focus:** Dims unimportant emails to reduce visual noise.
- **Customizable Opacity:** Control exactly how much background noise you see via a slider (0.00 to 0.40). Default is 0.10.
- **Unread Accents:** Important unread emails get a vertical accent bar to ensure you never miss them.

### 2. Smart Filtering Rules
- **Specific Senders:** Mark individual email addresses as permanent priority.
- **Domain-Wide Rules:** Specify a domain (e.g. `outthink.io`) to automatically prioritize every email from that company and its subdomains.
- **Subject Keywords:** Prioritize emails based on keywords in the subject line (e.g. "Urgent", "Meeting").
- **One-Click Marking:** Add/remove senders directly from the Gmail row toolbar.

### 3. Session Preferences
- **Default Active State:** Choose whether you want the filter to be ON or OFF by default every time you open Gmail.
- **Instant Sync:** Settings changes are applied immediately to all visible rows without requiring a page refresh.

### 4. Premium Interface
- **Toolbar Toggle:** A native-feeling "Toggle important emails" button in the top Gmail toolbar.
- **Floating Settings:** A modern glassmorphic cog button in the bottom-right corner.
- **Dark Management Modal:** A dedicated, sleek interface for managing your rules and preferences.
- **Searchable Lists:** Easily find and manage your existing priority senders, domains, and keywords.

---

## 🛠 Technical Architecture

### Tech Stack
- **Vite:** Build tool for modular development and fast bundling.
- **Vanilla JS:** Zero dependencies in the content script for maximum performance and stability.
- **CSS Custom Properties:** Used for dynamic UI updates (like opacity levels and accent colors).

### Data Flow
1. **Storage Service (`storage.js`)**: Wraps `chrome.storage.local` with async/await and robust error handling for context invalidation.
2. **Orchestrator (`index.js`)**: Coordinates the boot sequence and restores user preferences.
3. **Filter Engine (`filter.js`)**: Handles the DOM manipulation, classes, and logic for identifying priority rows.
4. **Settings Manager (`settings.js`)**: Handles the settings UI lifecycle and persists user choices.

### Stability & Health
- **Runtime Health Checks:** All modules use a centralized `isRuntimeValid` check to prevent crashes after extension updates.
- **Mutation Observers:** Used efficiently to track Gmail's dynamic DOM updates for both rows and the toolbar.

---

## 📖 Extension API (Storage Keys)

| Key | Type | Description |
|---|---|---|
| `priorityTierEmails` | `string[]` | List of prioritized email addresses. |
| `priorityTierDomains` | `string[]` | List of prioritized domains. |
| `priorityTierKeywords` | `string[]` | List of prioritized subject keywords. |
| `isDefaultOn` | `boolean` | User preference for startup state. |
| `pfOpacityLevel` | `number` | Opacity value (0-0.4). |
| `pfShowToasts` | `boolean` | Whether to show notification toasts. |
| `pfAccentColor` | `string` | HEX color for the unread accent bar. |

---

## 📦 Maintenance Guide

- **Updating Icons:** All SVGs are located in `src/config/index.js`.
- **CSS Hierarchy:**
    - `filter.css`: Core inbox row rules.
    - `toast.css`: Notification styles.
    - `settings.css`: Modal and floating button styles.
- **Virtualization:** The extension uses `MutationObserver` on both the body (global) and individual rows (local) to ensure UI elements stay persistent as Gmail scrolls and re-renders.

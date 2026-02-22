# Mail Focus - Gmail Priority Filter

Enhance your Gmail productivity by highlighting what matters. This extension dims unimportant emails, allowing you to focus on high-priority correspondence from specific senders, domains, or subject keywords.

## 📦 Installation (Development Mode)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/netviral/mail-focus.git
   cd mail-focus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the extension:**
   ```bash
   npm run build
   ```

4. **Load into Chrome:**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (toggle in the top right).
   - Click **Load unpacked**.
   - Select the `dist` folder generated in your project directory.

## 🛠 Features

- **Pill-style Toggle:** Quickly switch between "All Mail" and "Important Mail" views.
- **Visual Dimming:** Unimportant rows are dimmed (customizable opacity).
- **Unread Accents:** Priority unread emails feature a sleek vertical accent bar.
- **Rule Management:** Dedicated settings modal to manage senders, domains, and subject keywords.
- **Searchable Control:** Built-in search within the settings modal for managing large lists.
- **Premium Aesthetics:** Dark mode interface with glassmorphic elements and smooth transitions.

## 🚀 Technical Stack

- **Vite** for fast, modular builds.
- **Vanilla JavaScript** for high performance and zero external dependencies in the content script.
- **CSS Custom Properties** for real-time UI customization.
- **Chrome Storage API** for persistent cross-device settings syncing (where available).

## 📄 Documentation

For a deeper dive into the architecture, storage keys, and maintenance, see `documentation.md`.

## 🤝 Contribution

Feel free to open issues or pull requests to improve the filter logic or UI aesthetics.

---

Made by [Ibrahim Khalil](https://github.com/netviral)

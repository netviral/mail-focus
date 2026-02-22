(function () {

  const CLASS_NAME = "priority-tier-highlight";
  const UNREAD_CLASS = "priority-tier-unread";
  const STYLE_ID = "opacity-only-style";
  const BUTTON_ID = "important-filter-toggle";
  const STORAGE_KEY = "priorityTierEmails";

  const defaultEmails = [
    "cs.dept@ashoka.edu.in",
    "technology.ministry@ashoka.edu.in",
  ];

  let isActive = false;
  let observer = null;

  /* =======================
     LocalStorage Helpers
  ======================= */

  function getPriorityEmails() {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEmails));
      return [...defaultEmails];
    }

    try {
      return JSON.parse(stored);
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEmails));
      return [...defaultEmails];
    }
  }

  function savePriorityEmails(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function addPriorityEmail(email) {
    const list = getPriorityEmails();
    if (!list.includes(email)) {
      list.push(email);
      savePriorityEmails(list);
    }
  }

  function removePriorityEmail(email) {
    const list = getPriorityEmails().filter(e => e !== email);
    savePriorityEmails(list);
  }

  /* =======================
     Inject CSS
  ======================= */

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      
      

      body.filter-important-active tr.zA {
        opacity: 0.1;
        transition: opacity 0.15s ease;
      }

      body.filter-important-active tr.zA.${CLASS_NAME} {
        opacity: 1 !important;
      }

      body.filter-important-active tr.zA.${CLASS_NAME}.${UNREAD_CLASS} {
        position: relative;
      }

      body.filter-important-active tr.zA.${CLASS_NAME}.${UNREAD_CLASS}::before {
        content: "";
        position: absolute;
        left: 0;
        top: 2px;
        bottom: 2px;
        width: 4px;
        background: currentColor;
        opacity: 0.6;
        border-radius: 2px;
      }

      body.filter-important-active tr.zA.${CLASS_NAME}.${UNREAD_CLASS} {
        box-shadow:
          inset 3px 0 0 rgba(0,0,0,0.45),
          0 0 6px rgba(0,0,0,0.05);
      }

      #${BUTTON_ID} {
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 10px 16px;
        border-radius: 24px;
        background: rgba(0,0,0,0.6);
        color: white;
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        backdrop-filter: blur(6px);
        z-index: 9999;
        user-select: none;
      }

      #${BUTTON_ID}.active {
        background: rgba(0,0,0,0.85);
      }
    `;

    document.head.appendChild(style);
  }

  /* =======================
     Highlight Logic
  ======================= */

  function applyHighlight() {
    if (!isActive) return;

    const targetEmails = getPriorityEmails();
    const allRows = document.querySelectorAll("tr.zA");

    allRows.forEach(row => {
      row.classList.remove(CLASS_NAME, UNREAD_CLASS);
    });

    targetEmails.forEach(email => {
      const matches = document.querySelectorAll(
        `span.zF[email="${email}"], span.yP[email="${email}"]`
      );

      matches.forEach(span => {
        const row = span.closest("tr.zA");
        if (!row) return;

        row.classList.add(CLASS_NAME);

        if (row.classList.contains("zE")) {
          row.classList.add(UNREAD_CLASS);
        }
      });
    });
  }

  /* =======================
     Observer
  ======================= */

  function startObserver() {
    observer = new MutationObserver(applyHighlight);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  /* =======================
     Toggle Button
  ======================= */

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const button = document.createElement("div");
    button.id = BUTTON_ID;
    button.style = "display: none;"; // Initially hidden
    button.textContent = "Filter Important";

    button.addEventListener("click", () => {
      isActive = !isActive;

      if (isActive) {
        document.body.classList.add("filter-important-active");
        button.classList.add("active");
        applyHighlight();
        startObserver();
      } else {
        document.body.classList.remove("filter-important-active");
        button.classList.remove("active");
        stopObserver();

        document.querySelectorAll("tr.zA").forEach(row => {
          row.classList.remove(CLASS_NAME, UNREAD_CLASS);
        });
      }
    });

    document.body.appendChild(button);
  }

  /* =======================
     Init
  ======================= */

  getPriorityEmails(); // ensure defaults seeded
  injectStyles();
  injectButton();

})();
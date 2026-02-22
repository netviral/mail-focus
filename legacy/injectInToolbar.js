/* =========================================================
   Gmail Priority Sender Actions
   Clean • Maintainable • Virtualization Safe
   Optimized O(1) lookup using Set
   Synced icon state across all visible rows
   ========================================================= */

(function () {

  /* =========================================================
     CONFIG
  ========================================================= */

  const STORAGE_KEY = "priorityTierEmails";
  const STYLE_ID = "priority-extension-styles";
  const TOAST_CONTAINER_ID = "priority-toast-container";
  const ACTION_ATTR = "data-priority-action";

  /* =========================================================
     FAST LOOKUP CACHE (O1)
  ========================================================= */

  let prioritySet = new Set();

  function rebuildPrioritySet() {
    try {
      prioritySet = new Set(
        JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
      );
    } catch {
      prioritySet = new Set();
    }
  }

  function persistSet() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...prioritySet])
    );
  }

  function addPrioritySender(email) {
    if (!prioritySet.has(email)) {
      prioritySet.add(email);
      persistSet();
    }
  }

  function removePrioritySender(email) {
    if (prioritySet.has(email)) {
      prioritySet.delete(email);
      persistSet();
    }
  }

  /* =========================================================
     ICONS (cached once)
  ========================================================= */

  const tickIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"/>
    </svg>
  `;

  const crossIcon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"/>
    </svg>
  `;

  /* =========================================================
     STYLE INJECTION
  ========================================================= */

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;

    style.textContent = `
      #${TOAST_CONTAINER_ID} {
        position: absolute;
        bottom: 24px;
        left: 32px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        z-index: 20;
        pointer-events: none;
      }

      .priority-toast {
        min-width: 280px;
        max-width: 420px;
        padding: 16px 20px;
        border-radius: 14px;

        background: rgba(32, 33, 36, 0.95);
        color: #ffffff;

        font-size: 15px;
        line-height: 1.5;
        font-weight: 500;

        box-shadow:
          0 6px 18px rgba(0,0,0,0.25),
          0 12px 36px rgba(0,0,0,0.35);

        opacity: 0;
        transform: translateY(14px) scale(0.98);
        transition: all 220ms cubic-bezier(.2,.8,.2,1);
        pointer-events: auto;
      }

      .priority-toast.show {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .priority-toast strong {
        font-weight: 600;
      }
    `;

    document.head.appendChild(style);
  }

  /* =========================================================
     TOAST SYSTEM
  ========================================================= */

  function getMainContainer() {
    return (
      document.querySelector('div[role="main"]') ||
      document.querySelector('.AO') ||
      document.querySelector('.nH')
    );
  }

  function getToastContainer() {
    const main = getMainContainer();
    if (!main) return null;

    if (getComputedStyle(main).position === "static") {
      main.style.position = "relative";
    }

    let container = main.querySelector(`#${TOAST_CONTAINER_ID}`);
    if (container) return container;

    container = document.createElement("div");
    container.id = TOAST_CONTAINER_ID;
    main.appendChild(container);

    return container;
  }

  function showPriorityToast({ email, type }) {
    const container = getToastContainer();
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "priority-toast";

    toast.innerHTML =
      type === "success"
        ? `<strong>${email}</strong> marked important.`
        : `<strong>${email}</strong> marked unimportant.`;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 220);
    }, 3200);
  }

  /* =========================================================
     UPDATE ALL VISIBLE ROW BUTTONS FOR SAME EMAIL
  ========================================================= */

  function updateAllButtonsForEmail(senderEmail) {

    const isPriority = prioritySet.has(senderEmail);

    document.querySelectorAll('tr[role="row"]').forEach(row => {

      const senderEl = row.querySelector('[email]');
      if (!senderEl) return;

      const email =
        senderEl.getAttribute("email") ||
        senderEl.getAttribute("data-hovercard-id");

      if (email !== senderEmail) return;

      const btn = row.querySelector(`[${ACTION_ATTR}]`);
      if (!btn) return;

      btn.innerHTML = isPriority ? crossIcon : tickIcon;

      btn.setAttribute(
        "data-tooltip",
        isPriority
          ? "Mark sender as unimportant"
          : "Mark sender as important"
      );
    });
  }

  /* =========================================================
     BUTTON CREATION
  ========================================================= */

  function createActionButton(baseButton, svg, tooltip, onClick) {
    const button = baseButton.cloneNode(true);

    button.setAttribute(ACTION_ATTR, "true");
    button.setAttribute("data-tooltip", tooltip);

    button.removeAttribute("jsaction");
    button.removeAttribute("jscontroller");
    button.removeAttribute("jslog");

    button.innerHTML = svg;
    button.style.background = "none";
    button.style.backgroundImage = "none";

    button.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick(button);
    });

    return button;
  }

  /* =========================================================
     ROW INJECTION
  ========================================================= */

  function injectRowActions(row) {

    const toolbar = row.querySelector('ul[role="toolbar"]');
    if (!toolbar) return;

    if (toolbar.querySelector(`[${ACTION_ATTR}]`)) return;

    const archiveBtn = toolbar.querySelector('[data-tooltip="Archive"]');
    if (!archiveBtn) return;

    const senderEl = row.querySelector('[email]');
    if (!senderEl) return;

    const senderEmail =
      senderEl.getAttribute("email") ||
      senderEl.getAttribute("data-hovercard-id");

    if (!senderEmail) return;

    const isPriority = prioritySet.has(senderEmail);

    const actionBtn = createActionButton(
      archiveBtn,
      isPriority ? crossIcon : tickIcon,
      isPriority
        ? "Mark sender as unimportant"
        : "Mark sender as important",
      () => {

        if (prioritySet.has(senderEmail)) {
          removePrioritySender(senderEmail);
          showPriorityToast({ email: senderEmail, type: "removed" });
        } else {
          addPrioritySender(senderEmail);
          showPriorityToast({ email: senderEmail, type: "success" });
        }

        updateAllButtonsForEmail(senderEmail);
      }
    );

    toolbar.insertBefore(actionBtn, archiveBtn);
    observeRowRerender(row);
  }

  /* =========================================================
     VIRTUALIZATION SAFETY
  ========================================================= */

  function observeRowRerender(row) {
    if (row.dataset.priorityObserved) return;
    row.dataset.priorityObserved = "true";

    const observer = new MutationObserver(() => {
      const toolbar = row.querySelector('ul[role="toolbar"]');
      if (!toolbar) return;

      if (!toolbar.querySelector(`[${ACTION_ATTR}]`)) {
        injectRowActions(row);
      }
    });

    observer.observe(row, { childList: true, subtree: true });
  }

  function scanRows() {
    document
      .querySelectorAll('tr[role="row"]')
      .forEach(injectRowActions);
  }

  function observeGmail() {
    const observer = new MutationObserver((mutations) => {
      if (mutations.some(m => m.addedNodes.length)) {
        scanRows();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    scanRows();
  }

  /* =========================================================
     INIT
  ========================================================= */

  injectStyles();
  rebuildPrioritySet();
  observeGmail();

})();
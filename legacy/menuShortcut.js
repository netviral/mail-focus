/* =========================================================
   FINAL STABLE Gmail Toolbar Button Injection
   ========================================================= */

const GLASSES_ID = "priority-glasses-inline";

function injectGlassesButton() {

  if (document.getElementById(GLASSES_ID)) return;

  const moreButton = document.querySelector('[aria-label="More email options"]');
  if (!moreButton) return;

  // This is the flex container that holds all toolbar buttons
  const toolbarRow = moreButton.closest(".G-Ni")?.parentElement;
  if (!toolbarRow) return;

  // Create button (no Gmail wrapper cloning)
  const button = document.createElement("div");
  button.id = GLASSES_ID;
  button.className = "T-I J-J5-Ji nf T-I-ax7 L3";
  button.setAttribute("role", "button");
  button.setAttribute("tabindex", "0");
  button.setAttribute("aria-label", "Toggle Important Filter");
  button.setAttribute("data-tooltip", "Toggle Important Filter");

  button.style.marginLeft = "4px";

  // Inner structure
  const asa = document.createElement("div");
  asa.className = "asa";

const icon = document.createElement("div");
icon.className = "T-I-J3 J-J5-Ji";
icon.style.display = "flex";
icon.style.alignItems = "center";
icon.style.justifyContent = "center";

icon.innerHTML = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>
</svg>
`;

  asa.appendChild(icon);

  const spacer = document.createElement("div");
  spacer.className = "G-asx T-I-J3 J-J5-Ji";
  spacer.innerHTML = "&nbsp;";

  button.appendChild(asa);
  button.appendChild(spacer);

  // Insert directly into toolbar row
  toolbarRow.appendChild(button);

  button.addEventListener("click", () => {
    const toggle = document.getElementById("important-filter-toggle");
    if (toggle) toggle.click();
  });
}


/* =========================================================
   Observe ONLY toolbar region
   ========================================================= */

function observeToolbar() {

  const main = document.querySelector("div[role='main']");
  if (!main) return;

  const observer = new MutationObserver(() => {
    injectGlassesButton();
  });

  observer.observe(main, {
    childList: true,
    subtree: true
  });

  injectGlassesButton();
}


/* =========================================================
   Init
   ========================================================= */

function waitForToolbar() {
  const interval = setInterval(() => {
    if (document.querySelector('[aria-label="More email options"]')) {
      clearInterval(interval);
      observeToolbar();
    }
  }, 500);
}

waitForToolbar();

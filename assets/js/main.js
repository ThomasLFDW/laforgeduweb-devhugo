function initTabs(root) {
  const list = root.querySelector('[role="tablist"]');
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));

  const select = (index, focus) => {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    });
    if (focus) tabs[index].focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i, false));
    tab.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      select((i + step + tabs.length) % tabs.length, true);
    });
  });

  list.hidden = false;
  select(0, false);
}

function initContactForm(form) {
  const status = form.querySelector('[data-form-status]');
  const button = form.querySelector('button[type="submit"]');
  form.elements.started_at.value = String(Date.now());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    button.disabled = true;
    status.removeAttribute('data-state');
    status.textContent = 'Envoi en cours…';

    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      form.reset();
      form.elements.started_at.value = String(Date.now());
      status.dataset.state = 'success';
      status.textContent = 'Message envoyé. Je vous réponds au plus vite.';
    } catch {
      status.dataset.state = 'error';
      status.textContent = "Le message n'est pas parti. Vérifiez les champs, ou écrivez directement à contact@lecoforgeduweb.fr.";
    } finally {
      button.disabled = false;
    }
  });
}

// Plausible est chargé après la page, depuis ce fichier, pour que la CSP n'ait pas à autoriser de script en ligne.
function loadAnalytics() {
  window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://plausible.io/js/script.hash.tagged-events.js';
  script.dataset.domain = 'lecoforgeduweb.fr';
  document.head.appendChild(script);
}

document.querySelectorAll('.mobile-nav').forEach((menu) => {
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) menu.open = false; });
});

document.querySelectorAll('[data-tabs]').forEach(initTabs);
document.querySelectorAll('[data-contact-form]').forEach(initContactForm);
window.addEventListener('load', () => setTimeout(loadAnalytics, 2000));

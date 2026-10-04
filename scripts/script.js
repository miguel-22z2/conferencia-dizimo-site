const STORAGE_KEY = 'dizimoSiteData';
const HISTORY_KEY = 'dizimoHistory';

const denominations = [
  { label: 'R$ 200', value: 200 },
  { label: 'R$ 100', value: 100 },
  { label: 'R$ 50', value: 50 },
  { label: 'R$ 20', value: 20 },
  { label: 'R$ 10', value: 10 },
  { label: 'R$ 5', value: 5 },
  { label: 'R$ 2', value: 2 },
  { label: 'R$ 1', value: 1 },
  { label: 'R$ 0,50', value: 0.5 },
  { label: 'R$ 0,25', value: 0.25 },
  { label: 'R$ 0,10', value: 0.1 },
  { label: 'R$ 0,05', value: 0.05 },
  { label: 'R$ 0,01', value: 0.01 }
];

const form = document.getElementById('dizimo-form');
const totalValueElement = document.getElementById('total-value');
const titheValueElement = document.getElementById('tithe-value');
const clearBtn = document.getElementById('clear-btn');
const historyList = document.getElementById('history-list');

const getSavedData = () => {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return Object.fromEntries(denominations.map(({ value }) => [value, 0]));
  }

  try {
    const parsed = JSON.parse(saved);
    const defaults = Object.fromEntries(denominations.map(({ value }) => [value, 0]));
    return { ...defaults, ...parsed };
  } catch (error) {
    return Object.fromEntries(denominations.map(({ value }) => [value, 0]));
  }
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const calculateTotal = (data) => {
  return denominations.reduce((sum, { value }) => {
    const quantity = Number(data[value] || 0);
    return sum + (value * quantity);
  }, 0);
};

const renderForm = () => {
  const data = getSavedData();

  form.innerHTML = denominations.map(({ label, value }) => {
    const currentValue = Number(data[value] || 0);
    const inputValue = currentValue === 0 ? '' : currentValue;

    return `
    <label class="denomination">
      <span>${label}</span>
      <input
        type="number"
        min="0"
        step="1"
        value="${inputValue}"
        data-value="${value}"
        aria-label="Quantidade de cédulas ou moedas de ${label}"
      >
    </label>
  `;
  }).join('');
};

const updateSummary = () => {
  const data = getSavedData();
  const total = calculateTotal(data);
  const tithe = total * 0.1;

  totalValueElement.textContent = formatCurrency(total);
  titheValueElement.textContent = formatCurrency(tithe);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const getHistory = () => {
  const saved = localStorage.getItem(HISTORY_KEY);

  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch (error) {
    return [];
  }
};

const saveHistoryEntry = (values) => {
  const total = calculateTotal(values);
  const tithe = total * 0.1;
  const history = getHistory();

  const entry = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    values,
    total,
    tithe
  };

  const updatedHistory = [entry, ...history].slice(0, 5);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  renderHistory();
};

const renderHistory = () => {
  const history = getHistory();

  if (!history.length) {
    historyList.innerHTML = '<p class="empty-history">Nenhum valor salvo ainda.</p>';
    return;
  }

  historyList.innerHTML = history.map((entry) => `
    <div class="history-item">
      <div class="history-meta">
        <span class="history-date">${formatDate(entry.createdAt)}</span>
        <span class="history-values">Total: ${formatCurrency(entry.total)} • Dízimo: ${formatCurrency(entry.tithe)}</span>
      </div>
      <button class="history-btn" type="button" data-history-id="${entry.id}">Usar valor</button>
    </div>
  `).join('');

  historyList.querySelectorAll('.history-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const entryId = Number(button.dataset.historyId);
      const selected = getHistory().find((item) => item.id === entryId);

      if (!selected) return;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected.values));
      renderForm();
      updateSummary();
    });
  });
};

const saveCurrentValues = () => {
  const values = {};

  form.querySelectorAll('input').forEach((input) => {
    const value = Number(input.dataset.value);
    values[value] = Number(input.value || 0);
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  saveHistoryEntry(values);
  updateSummary();
};

const copyButtons = document.querySelectorAll('.copy-btn');

const copyToClipboard = async (text, button) => {
  try {
    await navigator.clipboard.writeText(text);
    const previousText = button.textContent;
    button.textContent = 'Copiado!';
    button.classList.add('copied');

    setTimeout(() => {
      button.textContent = previousText;
      button.classList.remove('copied');
    }, 1200);
  } catch (error) {
    button.textContent = 'Erro';
    setTimeout(() => {
      button.textContent = button.dataset.originalText || 'Copiar';
    }, 1200);
  }
};

copyButtons.forEach((button) => {
  const targetId = button.dataset.copyTarget;
  const targetElement = document.getElementById(targetId);
  button.dataset.originalText = button.textContent;

  button.addEventListener('click', () => {
    const textToCopy = targetElement.textContent.trim();
    copyToClipboard(textToCopy, button);
  });
});

form.addEventListener('input', saveCurrentValues);

clearBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  renderForm();
  updateSummary();
});

renderForm();
updateSummary();
renderHistory();

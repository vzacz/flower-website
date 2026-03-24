/* ============================================================
   GREEN LIFE FLOWERS — FAQ ADMIN MANAGER
   Handles: CRUD for FAQ categories and items stored in localStorage.
   The public faq.html reads from the same localStorage key.
   ============================================================ */

const FAQ_STORAGE_KEY = 'gl_faq_data';

/* ── Default FAQ data (matches what's hardcoded in faq.html) ── */
const DEFAULT_FAQ_DATA = [
  {
    id: 'cat-ordering',
    name: 'Ordering & Delivery',
    icon: 'calendar',
    items: [
      { id: 'faq-1', question: 'When are orders placed?', answer: 'Wholesale flower orders are typically scheduled weekly on Thursdays.' },
      { id: 'faq-2', question: 'What days do you deliver?', answer: 'We deliver Monday through Thursday, depending on availability.' },
      { id: 'faq-3', question: 'Can my delivery date become unavailable?', answer: 'Yes. Each delivery date has limited availability. Once a date is fully booked, it can no longer be selected at checkout.' },
      { id: 'faq-4', question: 'How do I choose my delivery date?', answer: 'You can select an available delivery date during checkout using the delivery calendar.' }
    ]
  },
  {
    id: 'cat-payment',
    name: 'Orders & Payment',
    icon: 'shield',
    items: [
      { id: 'faq-5', question: 'Do I need to pay online?', answer: 'No. This is a wholesale order request. Payment is handled separately by our team upon order confirmation. No credit card is required at checkout.' },
      { id: 'faq-6', question: 'Is there a minimum order?', answer: 'We offer wholesale pricing with tiered volume discounts. Browse our collection to see per-unit pricing, and feel free to contact us for bulk order inquiries.' },
      { id: 'faq-7', question: 'How will I know my order was received?', answer: 'After placing your order, you will see a confirmation page with your order details. Our team will also reach out via email or phone to confirm your order and arrange delivery.' }
    ]
  }
];

/* ── FAQ Data Access ── */
const FaqAdmin = {
  getAll() {
    try {
      const raw = localStorage.getItem(FAQ_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return null;
  },

  save(data) {
    localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(data));
  },

  getData() {
    let data = this.getAll();
    if (!data) {
      data = JSON.parse(JSON.stringify(DEFAULT_FAQ_DATA));
      this.save(data);
    }
    return data;
  },

  genId() {
    return 'faq-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  /* ── Category CRUD ── */
  addCategory(name) {
    const data = this.getData();
    data.push({ id: 'cat-' + Date.now().toString(36), name: name, icon: 'folder', items: [] });
    this.save(data);
    return data;
  },

  renameCategory(catId, name) {
    const data = this.getData();
    const cat = data.find(c => c.id === catId);
    if (cat) cat.name = name;
    this.save(data);
    return data;
  },

  deleteCategory(catId) {
    let data = this.getData();
    data = data.filter(c => c.id !== catId);
    this.save(data);
    return data;
  },

  /* ── Item CRUD ── */
  addItem(catId, question, answer) {
    const data = this.getData();
    const cat = data.find(c => c.id === catId);
    if (cat) {
      cat.items.push({ id: this.genId(), question: question, answer: answer });
    }
    this.save(data);
    return data;
  },

  updateItem(catId, itemId, question, answer) {
    const data = this.getData();
    const cat = data.find(c => c.id === catId);
    if (cat) {
      const item = cat.items.find(i => i.id === itemId);
      if (item) {
        item.question = question;
        item.answer = answer;
      }
    }
    this.save(data);
    return data;
  },

  deleteItem(catId, itemId) {
    const data = this.getData();
    const cat = data.find(c => c.id === catId);
    if (cat) {
      cat.items = cat.items.filter(i => i.id !== itemId);
    }
    this.save(data);
    return data;
  },

  moveItem(catId, fromIndex, toIndex) {
    const data = this.getData();
    const cat = data.find(c => c.id === catId);
    if (cat && cat.items[fromIndex]) {
      const [moved] = cat.items.splice(fromIndex, 1);
      cat.items.splice(toIndex, 0, moved);
    }
    this.save(data);
    return data;
  }
};

/* ── Render FAQ Editor ── */
function renderFaqEditor() {
  const container = document.getElementById('faqEditorContainer');
  if (!container) return;

  const data = FaqAdmin.getData();

  if (data.length === 0) {
    container.innerHTML = '<div class="faq-admin-empty">No FAQ categories yet. Click "Add Category" to get started.</div>';
    return;
  }

  const iconMap = {
    calendar: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    shield: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    folder: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>'
  };

  container.innerHTML = data.map((cat, catIdx) => `
    <div class="faq-admin-category" data-cat-id="${cat.id}">
      <div class="faq-admin-category-header">
        <div class="faq-admin-category-name">
          <span class="faq-admin-cat-icon">${iconMap[cat.icon] || iconMap.folder}</span>
          ${escHtml(cat.name)}
          <span style="font-weight:400;font-size:0.7rem;letter-spacing:0;text-transform:none;color:var(--text-muted)">${cat.items.length} item${cat.items.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="faq-admin-category-actions">
          <button class="faq-admin-btn-sm faq-admin-btn-edit" onclick="renameCategoryPrompt('${cat.id}', '${escAttr(cat.name)}')" title="Rename category">✎</button>
          <button class="faq-admin-btn-sm faq-admin-btn-delete" onclick="deleteCategoryConfirm('${cat.id}')" title="Delete category">✕</button>
        </div>
      </div>
      ${cat.items.length === 0
        ? '<div style="padding:18px;text-align:center;font-size:0.82rem;color:var(--text-muted)">No questions in this category yet.</div>'
        : cat.items.map((item, idx) => `
          <div class="faq-admin-item" data-item-id="${item.id}" draggable="true"
               ondragstart="faqDragStart(event, '${cat.id}', ${idx})"
               ondragover="faqDragOver(event)"
               ondrop="faqDrop(event, '${cat.id}', ${idx})">
            <div class="faq-admin-item-drag" title="Drag to reorder">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>
            </div>
            <div class="faq-admin-item-content">
              <div class="faq-admin-item-q">${escHtml(item.question)}</div>
              <div class="faq-admin-item-a">${escHtml(item.answer)}</div>
            </div>
            <div class="faq-admin-item-actions">
              <button class="faq-admin-btn-sm faq-admin-btn-edit" onclick="editFaqItem('${cat.id}', '${item.id}')" title="Edit">✎</button>
              <button class="faq-admin-btn-sm faq-admin-btn-delete" onclick="deleteFaqItem('${cat.id}', '${item.id}')" title="Delete">✕</button>
            </div>
          </div>
        `).join('')
      }
      <div class="faq-admin-add-row">
        <button class="faq-admin-add-btn" onclick="addFaqItem('${cat.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Question
        </button>
      </div>
    </div>
  `).join('');
}

/* ── HTML escaping ── */
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
function escAttr(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

/* ── Category actions ── */
function renameCategoryPrompt(catId, currentName) {
  const name = prompt('Category name:', currentName);
  if (name && name.trim()) {
    FaqAdmin.renameCategory(catId, name.trim());
    renderFaqEditor();
  }
}

function deleteCategoryConfirm(catId) {
  if (!confirm('Delete this entire category and all its questions? This cannot be undone.')) return;
  FaqAdmin.deleteCategory(catId);
  renderFaqEditor();
}

/* ── Item actions ── */
function addFaqItem(catId) {
  const catEl = document.querySelector(`[data-cat-id="${catId}"]`);
  if (!catEl) return;

  // Remove any existing add forms in this category
  const existing = catEl.querySelector('.faq-admin-edit-form');
  if (existing) { existing.remove(); return; }

  const addRow = catEl.querySelector('.faq-admin-add-row');
  const form = document.createElement('div');
  form.className = 'faq-admin-edit-form';
  form.innerHTML = `
    <label for="newFaqQ">Question</label>
    <input type="text" id="newFaqQ" placeholder="Enter the question..." />
    <label for="newFaqA">Answer</label>
    <textarea id="newFaqA" placeholder="Enter the answer..."></textarea>
    <div class="faq-admin-edit-actions">
      <button class="credit-save-btn" onclick="saveNewFaqItem('${catId}')">Add Question</button>
      <button class="credit-cancel-btn" onclick="this.closest('.faq-admin-edit-form').remove()">Cancel</button>
    </div>
  `;
  addRow.before(form);
  form.querySelector('#newFaqQ').focus();
}

function saveNewFaqItem(catId) {
  const q = document.getElementById('newFaqQ').value.trim();
  const a = document.getElementById('newFaqA').value.trim();
  if (!q) { document.getElementById('newFaqQ').style.borderColor = '#C0392B'; return; }
  if (!a) { document.getElementById('newFaqA').style.borderColor = '#C0392B'; return; }
  FaqAdmin.addItem(catId, q, a);
  renderFaqEditor();
}

function editFaqItem(catId, itemId) {
  const data = FaqAdmin.getData();
  const cat = data.find(c => c.id === catId);
  if (!cat) return;
  const item = cat.items.find(i => i.id === itemId);
  if (!item) return;

  const row = document.querySelector(`[data-item-id="${itemId}"]`);
  if (!row) return;

  row.outerHTML = `
    <div class="faq-admin-edit-form" data-editing="${itemId}">
      <label>Question</label>
      <input type="text" id="editFaqQ-${itemId}" value="${escHtml(item.question)}" />
      <label>Answer</label>
      <textarea id="editFaqA-${itemId}">${escHtml(item.answer)}</textarea>
      <div class="faq-admin-edit-actions">
        <button class="credit-save-btn" onclick="saveEditFaqItem('${catId}', '${itemId}')">Save</button>
        <button class="credit-cancel-btn" onclick="renderFaqEditor()">Cancel</button>
      </div>
    </div>
  `;
  document.getElementById('editFaqQ-' + itemId).focus();
}

function saveEditFaqItem(catId, itemId) {
  const q = document.getElementById('editFaqQ-' + itemId).value.trim();
  const a = document.getElementById('editFaqA-' + itemId).value.trim();
  if (!q || !a) return;
  FaqAdmin.updateItem(catId, itemId, q, a);
  renderFaqEditor();
}

function deleteFaqItem(catId, itemId) {
  if (!confirm('Delete this FAQ question?')) return;
  FaqAdmin.deleteItem(catId, itemId);
  renderFaqEditor();
}

/* ── Drag and drop reordering ── */
let faqDragData = null;

function faqDragStart(e, catId, index) {
  faqDragData = { catId: catId, index: index };
  e.dataTransfer.effectAllowed = 'move';
  e.target.style.opacity = '0.5';
  setTimeout(() => { e.target.style.opacity = ''; }, 0);
}

function faqDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function faqDrop(e, catId, toIndex) {
  e.preventDefault();
  if (!faqDragData || faqDragData.catId !== catId) return;
  if (faqDragData.index === toIndex) return;
  FaqAdmin.moveItem(catId, faqDragData.index, toIndex);
  faqDragData = null;
  renderFaqEditor();
}

/* ── Init: bind Add Category button and tab switching ── */
document.addEventListener('DOMContentLoaded', function() {
  // Add Category
  var addCatBtn = document.getElementById('faqAddCategoryBtn');
  if (addCatBtn) {
    addCatBtn.addEventListener('click', function() {
      var name = prompt('New category name:');
      if (name && name.trim()) {
        FaqAdmin.addCategory(name.trim());
        renderFaqEditor();
      }
    });
  }

  // Admin tab switching
  document.querySelectorAll('[data-admin-tab]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var tab = btn.dataset.adminTab;

      // Update tab buttons
      document.querySelectorAll('[data-admin-tab]').forEach(function(t) { t.classList.remove('active'); });
      btn.classList.add('active');

      // Update tab content
      document.querySelectorAll('.admin-tab-content').forEach(function(panel) { panel.classList.remove('active'); });

      if (tab === 'orders') {
        document.getElementById('tabOrders').classList.add('active');
      } else if (tab === 'faq') {
        document.getElementById('tabFaq').classList.add('active');
        renderFaqEditor();
      }
    });
  });
});

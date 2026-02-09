// --- CONFIGURAÇÕES E ESTADO GLOBAL ---
const CONFIG = {
    API_BASE: 'https://api.arasaac.org/api/pictograms',
    PICTO_SIZE: 96,
    CACHE_KEY: 'pictogram_cache',
    HISTORY_KEY: 'pictogram_history',
    LANG_KEY: 'pictogram_lang',
    THEME_KEY: 'theme_mode'
};

let currentEditingCard = null;
let sortableInstance = null;
let isDragging = false;
let currentLanguage = localStorage.getItem(CONFIG.LANG_KEY) || 'pt';
let undoStack = [];
let redoStack = [];

// --- CACHE LOCAL ---
const cache = {
    get(key) {
        const data = localStorage.getItem(CONFIG.CACHE_KEY);
        if (!data) return null;
        const parsed = JSON.parse(data);
        return parsed[key];
    },
    set(key, value) {
        const data = localStorage.getItem(CONFIG.CACHE_KEY) || '{}';
        const parsed = JSON.parse(data);
        parsed[key] = value;
        localStorage.setItem(CONFIG.CACHE_KEY, JSON.stringify(parsed));
    }
};

// --- REFERÊNCIAS DOM ---
const elements = {
    textInput: document.getElementById('text-input'),
    generateBtn: document.getElementById('generate-btn'),
    downloadBtn: document.getElementById('download-btn'),
    pictogramGrid: document.getElementById('pictogram-grid'),
    placeholderText: document.getElementById('placeholder-text'),
    loader: document.getElementById('loader'),
    btnText: document.getElementById('btn-text'),
    btnSpinner: document.getElementById('btn-spinner'),
    searchModal: document.getElementById('search-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalSearchInput: document.getElementById('modal-search-input'),
    modalSearchBtn: document.getElementById('modal-search-btn'),
    modalResultsGrid: document.getElementById('modal-results-grid'),
    modalLoader: document.getElementById('modal-loader'),
    modalPlaceholder: document.getElementById('modal-placeholder'),
    modalUploadBtn: document.getElementById('modal-upload-btn'),
    modalFileInput: document.getElementById('modal-file-input'),
    alertModal: document.getElementById('alert-modal'),
    alertMessage: document.getElementById('alert-message'),
    alertCloseBtn: document.getElementById('alert-close-btn'),
    customizationPanel: document.getElementById('customization-panel'),
    borderColorInput: document.getElementById('border-color-input'),
    toggleTextBtn: document.getElementById('toggle-text-btn'),
    columnSlider: document.getElementById('column-slider'),
    columnCount: document.getElementById('column-count'),
    boardTitleInput: document.getElementById('board-title-input'),
    langSelect: document.getElementById('lang-select'),
    themeToggle: document.getElementById('theme-toggle'),
    undoBtn: document.getElementById('undo-btn'),
    redoBtn: document.getElementById('redo-btn'),
    saveBtn: document.getElementById('save-btn'),
    loadBtn: document.getElementById('load-btn'),
    exportPdfBtn: document.getElementById('export-pdf-btn'),
    helpBtn: document.getElementById('help-btn')
};

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadTheme();
    loadLanguage();
    checkFirstVisit();
    loadHistory();
});

function initEventListeners() {
    elements.generateBtn.addEventListener('click', generatePictograms);
    elements.textInput.addEventListener('keyup', (e) => e.key === 'Enter' && generatePictograms());
    elements.downloadBtn.addEventListener('click', () => downloadBoard('png'));
    elements.modalCloseBtn.addEventListener('click', () => elements.searchModal.classList.replace('modal-visible', 'modal-hidden'));
    elements.modalSearchBtn.addEventListener('click', debounce(searchInModal, 300));
    elements.modalSearchInput.addEventListener('keyup', (e) => e.key === 'Enter' && searchInModal());
    elements.modalUploadBtn.addEventListener('click', () => elements.modalFileInput.click());
    elements.modalFileInput.addEventListener('change', handleImageUpload);
    elements.alertCloseBtn.addEventListener('click', () => elements.alertModal.classList.replace('modal-visible', 'modal-hidden'));
    elements.borderColorInput.addEventListener('input', () => applyBorderColorToAll(elements.borderColorInput.value));
    elements.toggleTextBtn.addEventListener('click', togglePictogramText);
    elements.columnSlider.addEventListener('input', updateGridColumns);
    if (elements.langSelect) elements.langSelect.addEventListener('change', changeLanguage);
    if (elements.themeToggle) elements.themeToggle.addEventListener('click', toggleTheme);
    if (elements.undoBtn) elements.undoBtn.addEventListener('click', undo);
    if (elements.redoBtn) elements.redoBtn.addEventListener('click', redo);
    if (elements.saveBtn) elements.saveBtn.addEventListener('click', saveBoard);
    if (elements.loadBtn) elements.loadBtn.addEventListener('click', loadBoard);
    if (elements.exportPdfBtn) elements.exportPdfBtn.addEventListener('click', () => downloadBoard('pdf'));
    if (elements.helpBtn) elements.helpBtn.addEventListener('click', showTutorial);
    
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// --- UTILITÁRIOS ---
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function showAlert(message) {
    elements.alertMessage.textContent = message;
    elements.alertModal.classList.replace('modal-hidden', 'modal-visible');
}

function setLoading(isLoading) {
    if (isLoading) {
        elements.btnText.classList.add('hidden');
        elements.btnSpinner.classList.remove('hidden');
        elements.generateBtn.disabled = true;
        elements.placeholderText.classList.add('hidden');
        elements.pictogramGrid.innerHTML = '';
        elements.loader.classList.remove('hidden');
    } else {
        elements.btnText.classList.remove('hidden');
        elements.btnSpinner.classList.add('hidden');
        elements.generateBtn.disabled = false;
        elements.loader.classList.add('hidden');
    }
}

// --- TEMA ---
function loadTheme() {
    const theme = localStorage.getItem(CONFIG.THEME_KEY);
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem(CONFIG.THEME_KEY, isDark ? 'dark' : 'light');
    showToast(`Modo ${isDark ? 'escuro' : 'claro'} ativado`, 'success');
}

// --- IDIOMA ---
function loadLanguage() {
    if (elements.langSelect) {
        elements.langSelect.value = currentLanguage;
    }
}

function changeLanguage() {
    currentLanguage = elements.langSelect.value;
    localStorage.setItem(CONFIG.LANG_KEY, currentLanguage);
    showToast('Idioma alterado. Gere novamente para aplicar.', 'info');
}

// --- ATALHOS DE TECLADO ---
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'z':
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
                break;
            case 'y':
                e.preventDefault();
                redo();
                break;
            case 's':
                e.preventDefault();
                saveBoard();
                break;
            case 'o':
                e.preventDefault();
                loadBoard();
                break;
        }
    }
}

// --- HISTÓRICO (UNDO/REDO) ---
function saveState() {
    const state = {
        html: elements.pictogramGrid.innerHTML,
        title: elements.boardTitleInput.value,
        columns: elements.columnSlider.value,
        borderColor: elements.borderColorInput.value
    };
    undoStack.push(state);
    redoStack = [];
    updateUndoRedoButtons();
}

function undo() {
    if (undoStack.length === 0) return;
    const currentState = {
        html: elements.pictogramGrid.innerHTML,
        title: elements.boardTitleInput.value,
        columns: elements.columnSlider.value,
        borderColor: elements.borderColorInput.value
    };
    redoStack.push(currentState);
    const prevState = undoStack.pop();
    restoreState(prevState);
    showToast('Desfeito', 'info');
}

function redo() {
    if (redoStack.length === 0) return;
    const currentState = {
        html: elements.pictogramGrid.innerHTML,
        title: elements.boardTitleInput.value,
        columns: elements.columnSlider.value,
        borderColor: elements.borderColorInput.value
    };
    undoStack.push(currentState);
    const nextState = redoStack.pop();
    restoreState(nextState);
    showToast('Refeito', 'info');
}

function restoreState(state) {
    elements.pictogramGrid.innerHTML = state.html;
    elements.boardTitleInput.value = state.title;
    elements.columnSlider.value = state.columns;
    elements.borderColorInput.value = state.borderColor;
    updateGridColumns();
    initSortable();
    updateUndoRedoButtons();
}

function updateUndoRedoButtons() {
    if (elements.undoBtn) {
        elements.undoBtn.disabled = undoStack.length === 0;
        elements.undoBtn.style.opacity = undoStack.length === 0 ? '0.5' : '1';
    }
    if (elements.redoBtn) {
        elements.redoBtn.disabled = redoStack.length === 0;
        elements.redoBtn.style.opacity = redoStack.length === 0 ? '0.5' : '1';
    }
}

// --- SALVAR/CARREGAR PRANCHA ---
function saveBoard() {
    const board = {
        html: elements.pictogramGrid.innerHTML,
        title: elements.boardTitleInput.value,
        columns: elements.columnSlider.value,
        borderColor: elements.borderColorInput.value,
        showText: !elements.pictogramGrid.classList.contains('hide-text'),
        timestamp: Date.now()
    };
    
    const history = JSON.parse(localStorage.getItem(CONFIG.HISTORY_KEY) || '[]');
    history.unshift(board);
    if (history.length > 10) history.pop();
    localStorage.setItem(CONFIG.HISTORY_KEY, JSON.stringify(history));
    
    const blob = new Blob([JSON.stringify(board, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prancha-${board.title || 'sem-titulo'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Prancha salva!', 'success');
}

function loadBoard() {
    const history = JSON.parse(localStorage.getItem(CONFIG.HISTORY_KEY) || '[]');
    
    if (history.length > 0) {
        const modal = document.createElement('div');
        modal.className = 'modal-fade modal-visible fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold text-gray-800">Carregar Prancha</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
                </div>
                <div class="space-y-2 mb-4">
                    ${history.map((board, i) => `
                        <div class="p-3 border rounded hover:bg-gray-50 cursor-pointer flex justify-between items-center" data-index="${i}">
                            <div>
                                <div class="font-bold">${board.title || 'Sem título'}</div>
                                <div class="text-sm text-gray-500">${new Date(board.timestamp).toLocaleString('pt-BR')}</div>
                            </div>
                            <button class="load-board bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Carregar</button>
                        </div>
                    `).join('')}
                </div>
                <div class="border-t pt-4">
                    <label class="block text-sm font-medium text-gray-600 mb-2">Ou carregar de arquivo:</label>
                    <input type="file" accept=".json" class="file-input w-full px-3 py-2 border rounded">
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        modal.querySelectorAll('.load-board').forEach((btn, i) => {
            btn.addEventListener('click', () => {
                saveState();
                restoreState(history[i]);
                if (!history[i].showText) togglePictogramText();
                showToast('Prancha carregada!', 'success');
                elements.downloadBtn.classList.remove('hidden');
                elements.exportPdfBtn?.classList.remove('hidden');
                elements.saveBtn?.classList.remove('hidden');
                elements.loadBtn?.classList.remove('hidden');
                elements.customizationPanel.classList.remove('hidden');
                initSortable();
                modal.remove();
            });
        });
        
        modal.querySelector('.file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const board = JSON.parse(event.target.result);
                    saveState();
                    restoreState(board);
                    if (!board.showText) togglePictogramText();
                    showToast('Prancha carregada!', 'success');
                    elements.downloadBtn.classList.remove('hidden');
                    elements.exportPdfBtn?.classList.remove('hidden');
                    elements.saveBtn?.classList.remove('hidden');
                    elements.loadBtn?.classList.remove('hidden');
                    elements.customizationPanel.classList.remove('hidden');
                    initSortable();
                    modal.remove();
                } catch (err) {
                    showToast('Erro ao carregar arquivo', 'error');
                }
            };
            reader.readAsText(file);
        });
    } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const board = JSON.parse(event.target.result);
                    saveState();
                    restoreState(board);
                    if (!board.showText) togglePictogramText();
                    showToast('Prancha carregada!', 'success');
                    elements.downloadBtn.classList.remove('hidden');
                    elements.exportPdfBtn?.classList.remove('hidden');
                    elements.saveBtn?.classList.remove('hidden');
                    elements.loadBtn?.classList.remove('hidden');
                    elements.customizationPanel.classList.remove('hidden');
                    initSortable();
                } catch (err) {
                    showToast('Erro ao carregar arquivo', 'error');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem(CONFIG.HISTORY_KEY) || '[]');
    if (history.length > 0 && elements.loadBtn) {
        const badge = document.createElement('span');
        badge.className = 'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center';
        badge.textContent = history.length;
        elements.loadBtn.style.position = 'relative';
        elements.loadBtn.appendChild(badge);
    }
}

// --- FUNÇÕES PRINCIPAIS ---
async function generatePictograms() {
    const text = elements.textInput.value.trim();
    if (!text) {
        showAlert('Por favor, digite um texto.');
        return;
    }

    const originalWords = text.split(/\s+/);
    const normalizedWords = originalWords.map(word => 
        word.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    );

    saveState();
    setLoading(true);
    elements.downloadBtn.classList.add('hidden');
    elements.customizationPanel.classList.add('hidden');

    try {
        const pictogramData = await Promise.all(
            normalizedWords.map(word => fetchPictogramForWord(word, true))
        );
        displayPictograms(pictogramData, originalWords);
        if (elements.pictogramGrid.hasChildNodes()) {
            elements.downloadBtn.classList.remove('hidden');
            elements.exportPdfBtn?.classList.remove('hidden');
            elements.saveBtn?.classList.remove('hidden');
            elements.loadBtn?.classList.remove('hidden');
            elements.customizationPanel.classList.remove('hidden');
            initSortable();
            showToast('Pictogramas gerados!', 'success');
        }
    } catch (error) {
        console.error('Erro ao buscar pictogramas:', error);
        elements.placeholderText.textContent = 'Erro na API. Tente novamente.';
        elements.placeholderText.classList.remove('hidden');
        showToast('Erro ao gerar pictogramas', 'error');
    } finally {
        setLoading(false);
    }
}

async function fetchPictogramForWord(word, findJustOne = true) {
    const searchWord = word.toLowerCase();
    const cacheKey = `${currentLanguage}_${searchWord}`;
    
    const cached = cache.get(cacheKey);
    if (cached) {
        return findJustOne ? (cached.length > 0 ? cached[0] : null) : cached;
    }

    const apiUrl = `${CONFIG.API_BASE}/${currentLanguage}/search/${encodeURIComponent(searchWord)}`;
    
    let retries = 2;
    while (retries > 0) {
        try {
            const response = await fetch(apiUrl, { timeout: 5000 });
            if (!response.ok) {
                console.warn(`API retornou status ${response.status} para "${word}"`);
                return findJustOne ? null : [];
            }
            const results = await response.json();
            cache.set(cacheKey, results);
            return findJustOne ? (results.length > 0 ? results[0] : null) : results;
        } catch (error) {
            retries--;
            if (retries === 0) {
                console.error(`Erro no fetch para "${word}":`, error);
                return findJustOne ? null : [];
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

function displayPictograms(pictogramData, originalWords) {
    elements.pictogramGrid.innerHTML = '';
    elements.placeholderText.classList.add('hidden');

    if (pictogramData.every(p => p === null)) {
        elements.placeholderText.textContent = 'Nenhum pictograma encontrado.';
        elements.placeholderText.classList.remove('hidden');
        return;
    }

    pictogramData.forEach((picto, index) => {
        const originalWord = originalWords[index];
        const card = createPictogramCard(originalWord, picto);
        elements.pictogramGrid.appendChild(card);
    });
}

function createPictogramCard(word, pictoData) {
    const card = document.createElement('div');
    card.className = 'pictogram-card flex flex-col items-center justify-start p-2 bg-white border-2 border-gray-200 rounded-lg text-center shadow-sm transition-transform transform hover:scale-105';
    card.dataset.word = word;
    card.style.borderColor = elements.borderColorInput.value;

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    actions.innerHTML = `
        <button class="duplicate-btn bg-blue-500 text-white p-1 rounded text-xs" title="Duplicar">📋</button>
        <button class="delete-btn bg-red-500 text-white p-1 rounded text-xs" title="Excluir">🗑️</button>
    `;
    card.appendChild(actions);

    const imageContainer = document.createElement('div');
    imageContainer.className = 'w-24 h-24 flex items-center justify-center mb-2';
    
    if (pictoData && pictoData._id) {
        const imageUrl = `${CONFIG.API_BASE}/${pictoData._id}`;
        const image = new Image();
        image.src = imageUrl;
        image.alt = word;
        image.className = 'w-full h-full object-contain pointer-events-none';
        image.crossOrigin = 'anonymous';
        imageContainer.appendChild(image);
    } else {
        imageContainer.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg pointer-events-none"><span class="text-gray-400 text-sm">Não<br>encontrado</span></div>';
    }
    card.appendChild(imageContainer);

    const wordText = document.createElement('p');
    wordText.textContent = word;
    wordText.className = 'pictogram-legend text-sm font-medium text-gray-700 break-words w-full pointer-events-none';
    card.appendChild(wordText);

    card.addEventListener('click', (e) => {
        if (isDragging) return;
        
        const target = e.target;
        if (target.closest('.duplicate-btn')) {
            e.stopPropagation();
            duplicateCard(card);
            return;
        }
        if (target.closest('.delete-btn')) {
            e.stopPropagation();
            deleteCard(card);
            return;
        }
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            card.style.borderColor = elements.borderColorInput.value;
            return;
        }
        openSearchModal(card);
    });
    
    return card;
}

function duplicateCard(card) {
    saveState();
    const clone = card.cloneNode(true);
    card.parentNode.insertBefore(clone, card.nextSibling);
    
    clone.addEventListener('click', (e) => {
        if (isDragging) return;
        const target = e.target;
        if (target.closest('.duplicate-btn')) {
            e.stopPropagation();
            duplicateCard(clone);
            return;
        }
        if (target.closest('.delete-btn')) {
            e.stopPropagation();
            deleteCard(clone);
            return;
        }
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            clone.style.borderColor = elements.borderColorInput.value;
            return;
        }
        openSearchModal(clone);
    });
    
    initSortable();
    showToast('Pictograma duplicado', 'success');
}

function deleteCard(card) {
    saveState();
    card.remove();
    showToast('Pictograma removido', 'success');
}

// --- CUSTOMIZAÇÃO ---
function applyBorderColorToAll(color) {
    const cards = elements.pictogramGrid.querySelectorAll('.pictogram-card');
    cards.forEach(card => card.style.borderColor = color);
}

function togglePictogramText() {
    elements.pictogramGrid.classList.toggle('hide-text');
    const isHidden = elements.pictogramGrid.classList.contains('hide-text');
    elements.toggleTextBtn.textContent = isHidden ? 'Mostrar Legendas' : 'Ocultar Legendas';
    elements.toggleTextBtn.classList.toggle('bg-indigo-500', !isHidden);
    elements.toggleTextBtn.classList.toggle('bg-red-500', isHidden);
    
    const legends = elements.pictogramGrid.querySelectorAll('.pictogram-legend');
    legends.forEach(legend => legend.classList.toggle('hidden'));
}

function updateGridColumns() {
    const count = elements.columnSlider.value;
    elements.columnCount.textContent = count;
    elements.pictogramGrid.className = elements.pictogramGrid.className.replace(/grid-cols-\d+/g, '');
    elements.pictogramGrid.classList.add(`grid-cols-${count}`);
}

function initSortable() {
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    sortableInstance = new Sortable(elements.pictogramGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        delay: 100,
        delayOnTouchOnly: true,
        onStart: () => { isDragging = true; },
        onEnd: () => {
            setTimeout(() => { isDragging = false; }, 50);
            saveState();
        }
    });
}

// --- MODAL DE BUSCA ---
function openSearchModal(cardElement) {
    currentEditingCard = cardElement;
    const word = cardElement.dataset.word;
    elements.modalSearchInput.value = word;
    elements.searchModal.classList.replace('modal-hidden', 'modal-visible');
    searchInModal();
}

async function searchInModal() {
    const searchTerm = elements.modalSearchInput.value.trim();
    if (!searchTerm) return;

    elements.modalResultsGrid.innerHTML = '';
    elements.modalPlaceholder.classList.add('hidden');
    elements.modalLoader.classList.remove('hidden');

    const results = await fetchPictogramForWord(searchTerm, false);
    
    elements.modalLoader.classList.add('hidden');
    if (results.length === 0) {
        elements.modalPlaceholder.classList.remove('hidden');
        return;
    }

    results.forEach(picto => {
        const imageUrl = `${CONFIG.API_BASE}/${picto._id}`;
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'p-1 bg-white rounded border hover:border-blue-500 hover:shadow-md cursor-pointer';
        const image = new Image();
        image.src = imageUrl;
        image.className = 'w-full h-full object-contain';
        imgWrapper.appendChild(image);
        imgWrapper.addEventListener('click', () => updatePictogram(imageUrl));
        elements.modalResultsGrid.appendChild(imgWrapper);
    });
}

function updatePictogram(newImageUrl) {
    saveState();
    const imageContainer = currentEditingCard.querySelector('.w-24.h-24');
    imageContainer.innerHTML = '';

    const newImage = new Image();
    newImage.src = newImageUrl;
    newImage.alt = currentEditingCard.dataset.word;
    newImage.className = 'w-full h-full object-contain pointer-events-none';
    
    if (!newImageUrl.startsWith('data:image')) {
        newImage.crossOrigin = 'anonymous';
    }
    
    imageContainer.appendChild(newImage);
    elements.searchModal.classList.replace('modal-visible', 'modal-hidden');
    showToast('Pictograma atualizado', 'success');
}

// --- UPLOAD DE IMAGEM ---
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
        showAlert('Selecione uma imagem válida.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        resizeImage(e.target.result, CONFIG.PICTO_SIZE, CONFIG.PICTO_SIZE, (resizedDataUrl) => {
            updatePictogram(resizedDataUrl);
        });
    };
    reader.readAsDataURL(file);
    elements.modalFileInput.value = '';
}

function resizeImage(base64Str, maxWidth, maxHeight, callback) {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
            }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/png'));
    };
}

// --- DOWNLOAD/EXPORTAÇÃO ---
function downloadBoard(format = 'png') {
    const boardTitle = elements.boardTitleInput.value.trim();
    const wasDarkMode = document.body.classList.contains('dark-mode');
    
    if (wasDarkMode) {
        document.body.classList.remove('dark-mode');
    }

    const downloadContainer = document.createElement('div');
    downloadContainer.style.position = 'absolute';
    downloadContainer.style.left = '-9999px';
    downloadContainer.style.backgroundColor = '#F9FAFB';
    downloadContainer.style.padding = '24px';
    downloadContainer.style.width = elements.pictogramGrid.offsetWidth + 48 + 'px';

    if (boardTitle) {
        const titleElement = document.createElement('h2');
        titleElement.textContent = boardTitle;
        titleElement.style.textAlign = 'center';
        titleElement.style.fontSize = '28px';
        titleElement.style.fontWeight = 'bold';
        titleElement.style.marginBottom = '20px';
        titleElement.style.color = '#1f2937';
        titleElement.style.fontFamily = "'Inter', sans-serif";
        downloadContainer.appendChild(titleElement);
    }

    const gridClone = elements.pictogramGrid.cloneNode(true);
    gridClone.querySelectorAll('.card-actions').forEach(el => el.remove());
    if (elements.pictogramGrid.classList.contains('hide-text')) {
        gridClone.querySelectorAll('.pictogram-legend').forEach(legend => legend.classList.add('hidden'));
    }
    downloadContainer.appendChild(gridClone);

    const footerText = document.createElement('div');
    footerText.textContent = 'Pictograma gerado em https://pranchas.netlify.app';
    footerText.style.marginTop = '16px';
    footerText.style.textAlign = 'center';
    footerText.style.fontSize = '12px';
    footerText.style.color = '#6B7280';
    footerText.style.fontFamily = "'Inter', sans-serif";
    downloadContainer.appendChild(footerText);

    document.body.appendChild(downloadContainer);

    html2canvas(downloadContainer, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#F9FAFB'
    }).then(canvas => {
        const sanitizedTitle = sanitizeFilename(boardTitle);
        
        if (format === 'png') {
            const link = document.createElement('a');
            link.download = `${sanitizedTitle || 'prancha-pictogramas'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('PNG baixado!', 'success');
        } else if (format === 'pdf') {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${sanitizedTitle || 'prancha-pictogramas'}.pdf`);
            showToast('PDF baixado!', 'success');
        }
    }).catch(err => {
        console.error("Erro ao gerar:", err);
        showToast("Erro ao gerar arquivo", 'error');
    }).finally(() => {
        document.body.removeChild(downloadContainer);
        if (wasDarkMode) {
            document.body.classList.add('dark-mode');
        }
    });
}

function sanitizeFilename(title) {
    return title
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/gi, '')
        .trim()
        .replace(/\s+/g, '-');
}

// --- TUTORIAL ---
function checkFirstVisit() {
    const hasVisited = localStorage.getItem('has_visited');
    if (!hasVisited) {
        setTimeout(() => {
            showTutorial();
            localStorage.setItem('has_visited', 'true');
        }, 1000);
    }
}

function showTutorial() {
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.id = 'tutorial-overlay';
    
    const steps = [
        {
            title: '👋 Bem-vindo!',
            text: 'Este é o Gerador de Pictogramas. Vamos fazer um tour rápido!',
            position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        },
        {
            title: '✍️ Digite seu texto',
            text: 'Digite palavras ou frases aqui e clique em "Gerar" para criar pictogramas.',
            target: elements.textInput,
            position: { top: '20%', left: '50%', transform: 'translateX(-50%)' }
        },
        {
            title: '🎨 Personalize',
            text: 'Altere cores, colunas e legendas. Arraste os pictogramas para reordenar.',
            position: { top: '40%', left: '50%', transform: 'translateX(-50%)' }
        },
        {
            title: '⌨️ Atalhos',
            text: 'Ctrl+Z: Desfazer | Ctrl+Y: Refazer | Ctrl+S: Salvar | Ctrl+O: Abrir',
            position: { bottom: '20%', left: '50%', transform: 'translateX(-50%)' }
        },
        {
            title: '✅ Pronto!',
            text: 'Clique em qualquer pictograma para editá-lo. Boa criação!',
            position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
    ];
    
    let currentStep = 0;
    
    function showStep(index) {
        const step = steps[index];
        const stepDiv = document.createElement('div');
        stepDiv.className = 'tutorial-step';
        Object.assign(stepDiv.style, step.position);
        
        stepDiv.innerHTML = `
            <h3 class="text-xl font-bold mb-2">${step.title}</h3>
            <p class="text-gray-600 mb-4">${step.text}</p>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-400 whitespace-nowrap">${index + 1}/${steps.length}</span>
                <div class="flex gap-2">
                    ${index > 0 ? '<button class="prev-btn bg-gray-300 px-4 py-2 rounded">Anterior</button>' : ''}
                    ${index < steps.length - 1 
                        ? '<button class="next-btn bg-blue-600 text-white px-4 py-2 rounded">Próximo</button>'
                        : '<button class="finish-btn bg-green-600 text-white px-4 py-2 rounded">Finalizar</button>'}
                </div>
            </div>
        `;
        
        overlay.innerHTML = '';
        overlay.appendChild(stepDiv);
        
        stepDiv.querySelector('.next-btn')?.addEventListener('click', () => {
            currentStep++;
            showStep(currentStep);
        });
        
        stepDiv.querySelector('.prev-btn')?.addEventListener('click', () => {
            currentStep--;
            showStep(currentStep);
        });
        
        stepDiv.querySelector('.finish-btn')?.addEventListener('click', () => {
            overlay.remove();
        });
    }
    
    showStep(0);
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

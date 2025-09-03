# 🖼️ Gerador de Pictogramas Interativo

(disponível online em https://pranchas.xo.je/)

Aplicação web que gera **pranchas de pictogramas** a partir de um texto, permitindo customização, reordenação e exportação como imagem.  
Os pictogramas são buscados automaticamente na **API do ARASAAC**, mas o usuário pode também substituir imagens ou enviar as suas próprias.

---

## ⚙️ Tecnologias Utilizadas
- **HTML5 / CSS3 / JavaScript**
- **[Tailwind CSS](https://tailwindcss.com/)** – para estilização responsiva e moderna  
- **[html2canvas](https://html2canvas.hertzen.com/)** – para capturar e exportar a prancha em formato de imagem  
- **[Sortable.js](https://sortablejs.github.io/Sortable/)** – para permitir drag-and-drop dos pictogramas  
- **[API do ARASAAC](https://arasaac.org/)** – fornecimento de pictogramas livres

---

## 🚀 Funcionalidades
- **Gerar pictogramas** automaticamente a partir de uma frase ou palavra.
- **Reordenar pictogramas** via drag-and-drop.
- **Customizar a prancha**:
  - Alterar cor da borda.
  - Mostrar/ocultar legendas.
  - Ajustar quantidade de colunas.
  - Adicionar título.
- **Editar pictogramas individualmente**:
  - Buscar alternativas na API do ARASAAC.
  - Substituir por imagem própria (upload).
- **Exportar prancha** em formato `.png`.
- Interface **responsiva** e **intuitiva**, otimizada para desktop e dispositivos móveis.

---

## 🖼️ Como Funciona
1. O usuário digita uma **frase ou palavra** no campo de entrada.
2. Para cada termo:
   - É feita uma **requisição à API ARASAAC** para buscar um pictograma correspondente.
   - Caso não encontre, é exibido um placeholder com a mensagem *“Não encontrado”*.
3. Os pictogramas são exibidos em forma de **cards**, cada um contendo:
   - A imagem do pictograma.
   - A legenda (palavra original).
4. O usuário pode:
   - **Arrastar** os cards para mudar a ordem.
   - **Editar** clicando em um card → abre modal para buscar outro pictograma ou enviar imagem personalizada.
   - **Customizar** bordas, colunas, legendas e título.
5. Ao finalizar, pode clicar em **Baixar Prancha** → o layout é convertido em imagem via `html2canvas`.

---

## 📂 Estrutura do Código
- **HTML principal**:  
  Estrutura da página, campos de input, botões, painéis de customização, modais e container dos pictogramas.

- **CSS customizado (inline no `<style>`)**:  
  - Animações de loading.  
  - Classes utilitárias para estados dos modais.  
  - Ajustes de drag-and-drop.  

- **JavaScript (inline em `<script>`)**:
  - Controle dos eventos (cliques, inputs, teclas).  
  - Funções principais:
    - `generatePictograms()` → busca pictogramas na API.  
    - `displayPictograms()` → renderiza os cards.  
    - `createPictogramCard()` → cria cada card interativo.  
    - `openSearchModal()` → abre modal de edição.  
    - `searchInModal()` → busca alternativas na API.  
    - `handleImageUpload()` → substitui pictograma por imagem local.  
    - `downloadBoard()` → exporta prancha como imagem.  
  - Funções auxiliares para personalização (cor, legendas, colunas).  
  - Integração com **Sortable.js** para drag-and-drop.

---

## 📥 Como Usar
1. Baixe ou clone o repositório:
   ```bash
   git clone https://github.com/seuusuario/pictogram-board-generator.git

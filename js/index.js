let currentFilterLabel = 'all';
let currentSearchText = '';

// Masonry grid: each note spans as many rows as its content needs
function resizeAllNotesHeight() {
    const items = Array.from(notesGrid.querySelectorAll('.notes'))
        .filter(note => note.style.display !== 'none' && !note.classList.contains('expandida'));
    resizeNotes(items);
}

function resizeNotes(items) {
    if (!items.length) return;
    const gridStyle = window.getComputedStyle(notesGrid);
    const rowHeight = parseFloat(gridStyle.gridAutoRows) || 1;
    const rowGap = parseFloat(gridStyle.rowGap) || 0;
    // Read every height first and only then write, so the browser lays out once
    const heights = items.map(item => item.querySelector('.notes-content').offsetHeight);
    items.forEach((item, i) => {
        item.style.gridRowEnd = 'span ' + Math.ceil((heights[i] + rowGap) / (rowHeight + rowGap));
    });
}

let resizeFrame = null;
window.addEventListener('resize', () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        resizeAllNotesHeight();
    });
});
if (document.fonts) document.fonts.ready.then(resizeAllNotesHeight);

// Dark mode
document.querySelector('.container-symbols-header').addEventListener('click', function(e) {
    e.preventDefault();
    document.body.classList.toggle('dark');
});

// Menu
document.querySelector('#button-menu').addEventListener('click', () => {
    document.querySelector('.menu-config').classList.toggle('closed');
});

// Labels
const dynamicLabelsContainer = document.getElementById('dynamic-labels');

notesDataPromise
    .then(data => {
        const labelsSet = new Set();
        data.notes.forEach(note => {
            (note.labels || []).forEach(label => labelsSet.add(label));
        });
        labelsSet.forEach(label => createLabelElement(label));
    })
    .catch(error => console.error('Erro ao carregar o arquivo JSON:', error));

function createLabelElement(label) {
    const labelElement = document.createElement('li');
    labelElement.className = 'menu-items';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu-button';
    button.dataset.label = label;
    if (label === currentFilterLabel) button.classList.add('active');

    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined icons-menu';
    icon.textContent = 'label';

    const text = document.createElement('span');
    text.className = 'menu-list-p';
    text.textContent = label;

    button.append(icon, text);
    labelElement.appendChild(button);
    dynamicLabelsContainer.appendChild(labelElement);
}

// Menu filter and search bar
document.querySelector('.menu-config').addEventListener('click', (event) => {
    const menuButton = event.target.closest('.menu-button');
    if (!menuButton) return;
    event.preventDefault(); // the "#" links inside the buttons would jump to the top

    document.querySelectorAll('.menu-config .menu-button').forEach(btn => btn.classList.remove('active'));
    menuButton.classList.add('active');

    closeExpandedNote();
    currentFilterLabel = menuButton.getAttribute('data-label');
    filterNotesByLabel(currentFilterLabel);
});

document.getElementById('search-input').addEventListener('input', (event) => {
    currentSearchText = event.target.value.trim().toLowerCase();
    filterNotesByLabel(currentFilterLabel);
});

function reapplyCurrentFilter() {
    filterNotesByLabel(currentFilterLabel);
}

// Does the note belong to the folder/label and match the search?
function noteMatchesFilter(note, label = currentFilterLabel) {
    const archived = note.dataset.archived === 'true';
    const trashed = note.dataset.trashed === 'true';

    let inFolder;
    if (label === 'trash') {
        inFolder = trashed;
    } else if (label === 'archive') {
        inFolder = archived && !trashed;
    } else if (archived || trashed) {
        inFolder = false;
    } else {
        inFolder = label === 'all' || note.dataset.labels.split(',').includes(label);
    }

    return inFolder && (!currentSearchText || note.searchText.includes(currentSearchText));
}

// Filter notes by label
function filterNotesByLabel(label) {
    notesGrid.querySelectorAll('.notes').forEach(note => {
        note.style.display = noteMatchesFilter(note, label) ? '' : 'none';
    });
    resizeAllNotesHeight();
}

// Dark mode
function resizeNoteHeight(item){
    grid = document.getElementsByClassName("container-notes")[0];
    rowHeight = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-auto-rows'));
    rowGap = parseInt(window.getComputedStyle(grid).getPropertyValue('grid-row-gap'));
    rowSpan = Math.ceil((item.querySelector('.notes-content').getBoundingClientRect().height+rowGap)/(rowHeight+rowGap));
    item.style.gridRowEnd = "span "+rowSpan;
}

function resizeAllNotesHeight(){
    allItems = document.getElementsByClassName("notes");
    for(x=0;x<allItems.length;x++){
        resizeNoteHeight(allItems[x]);
    }
}

document.querySelector('.container-symbols-header').addEventListener('click', function(e){
    e.preventDefault();
    if(document.body.classList.contains('dark')){
        document.body.classList.remove('dark');
    } else {
        document.body.classList.add('dark');
    }
});
window.addEventListener("resize", resizeAllNotesHeight);
resizeAllNotesHeight();

// Menu
document.querySelector('#button-menu').addEventListener('click', (event) => {
    if(document.querySelector('.menu-config').classList.contains('closed')){
        document.querySelector('.menu-config').classList.remove('closed');
    } else {
        document.querySelector('.menu-config').classList.add('closed');
    }
});

// Labels
document.addEventListener('DOMContentLoaded', function() {
    const notesContainer = document.getElementById('notes-container');
    const dynamicLabelsContainer = document.getElementById('dynamic-labels');

    fetch('json/dados.json')
        .then(response => response.json())
        .then(data => {
            const notes = data.notes;
            const labelsSet = new Set();

            notes.forEach(note => {
                note.labels.forEach(label => labelsSet.add(label));
                renderizarNota(note.id, note.title, note.text, note.controls, note.labels);
            });

            labelsSet.forEach(label => createLabelElement(label));
            addLabelFilterEvent();
        })
        .catch(error => console.error('Erro ao carregar o arquivo JSON:', error));

    function createLabelElement(label) {
        const labelElement = document.createElement('li');
        labelElement.className = 'menu-items';
        labelElement.innerHTML = `
            <button type="button" class="menu-button" data-label="${label}">
                <span class="material-symbols-outlined icons-menu">
                    label
                </span><span class="menu-list-p">${label}</span>
            </button>
        `;
        dynamicLabelsContainer.appendChild(labelElement);
    }

    // Filter the labels
    function addLabelFilterEvent() {
        const labelButtons = document.querySelectorAll('.menu-button[data-label]');
        labelButtons.forEach(button => {
            button.addEventListener('click', () => {
                const label = button.getAttribute('data-label');
                filterNotesByLabel(label);
            });
        });
        setTimeout(() => {
            resizeAllNotesHeight();
        }, 500);
    }

    function filterNotesByLabel(label) {
        const notes = document.querySelectorAll('.notes');
        notes.forEach(note => {
            const noteLabels = note.getAttribute('data-labels').split(',');
            if (label === 'all' || noteLabels.includes(label)) {
                note.style.display = '';
            } else {
                note.style.display = 'none';
            }
        });
    }
});

// File and Recycle Bin
document.querySelector('.menu-config').addEventListener('click', (event) => {
    const menuButton = event.target.closest('.menu-button');
    if (!menuButton) return;

    const label = menuButton.getAttribute('data-label');
    filterNotesByLabel(label);
    setTimeout(() => {
        resizeAllNotesHeight();
    }, 500);
});

// Search bar 
let currentFilterLabel = 'all';
let currentSearchText = '';

document.querySelector('.menu-config').addEventListener('click', (event) => {
    const menuButton = event.target.closest('.menu-button');
    if (!menuButton) return;

    currentFilterLabel = menuButton.getAttribute('data-label');
    filterNotesByLabel(currentFilterLabel);
});

document.getElementById('search-input').addEventListener('input', (event) => {
    currentSearchText = event.target.value.toLowerCase();
    filterNotesByLabel(currentFilterLabel);
});

function reapplyCurrentFilter() {
    filterNotesByLabel(currentFilterLabel);
}

// Filter notes by label
function filterNotesByLabel(label) {
    const notes = document.querySelectorAll('.notes');
    notes.forEach(note => {
        const noteLabels = note.getAttribute('data-labels').split(',');
        const archived = note.getAttribute('data-archived') === 'true';
        const trashed = note.getAttribute('data-trashed') === 'true';
        const title = note.querySelector('.notes-title').textContent.toLowerCase();
        const text = note.querySelector('.notes-text').textContent.toLowerCase();
        const labels = note.getAttribute('data-labels').toLowerCase();
        
        const matchesSearch = title.includes(currentSearchText) || text.includes(currentSearchText) || labels.includes(currentSearchText);

        if (label === 'all' && !archived && !trashed && matchesSearch) {
            note.style.display = '';
        } else if (label === 'archive' && archived && matchesSearch) {
            note.style.display = '';
        } else if (label === 'trash' && trashed && matchesSearch) {
            note.style.display = '';
        } else if (!archived && !trashed && noteLabels.includes(label) && matchesSearch) {
            note.style.display = '';
        } else {
            note.style.display = 'none';
        }
    });
}

// Search bar 
document.getElementById('search-input').addEventListener('input', (event) => {
    const searchText = event.target.value.toLowerCase();
    filterNotesBySearch(searchText);
});

function filterNotesBySearch(searchText) {
    const notes = document.querySelectorAll('.notes');
    notes.forEach(note => {
        const title = note.querySelector('.notes-title').textContent.toLowerCase();
        const text = note.querySelector('.notes-text').textContent.toLowerCase();
        const labels = note.getAttribute('data-labels').toLowerCase();
        
        if (title.includes(searchText) || text.includes(searchText) || labels.includes(searchText)) {
            note.style.display = '';
        } else {
            note.style.display = 'none';
        }
    });
}
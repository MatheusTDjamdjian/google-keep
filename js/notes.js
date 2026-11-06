// Notes: loading, rendering, expand/close and moving between folders
const notesGrid = document.querySelector('.container-notes');
const overlay = document.querySelector('.overlay');
const STATUS_STORAGE_KEY = 'keep-notes-status';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Fetched once and shared with index.js (labels menu)
const notesDataPromise = fetch('json/dados.json').then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
});

// index.js is loaded after this file, so wait for every script before rendering
const domReady = new Promise(resolve => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
    } else {
        resolve();
    }
});

Promise.all([notesDataPromise, domReady])
    .then(([data]) => {
        const savedStatus = readSavedStatus();
        const fragment = document.createDocumentFragment();
        data.notes.forEach(note => {
            fragment.appendChild(createNoteElement({ ...note, ...savedStatus[note.id] }));
        });
        notesGrid.appendChild(fragment);
        reapplyCurrentFilter();
    })
    .catch(error => console.error('Erro ao carregar as notas:', error));

// Status persistence (archived / trashed) in the browser
function readSavedStatus() {
    try {
        return JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY)) || {};
    } catch (error) {
        return {};
    }
}

function saveNoteStatus(id, status) {
    try {
        const allStatus = readSavedStatus();
        allStatus[id] = { ...allStatus[id], ...status };
        localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(allStatus));
    } catch (error) {
        console.error('Erro ao salvar o status da nota!', error);
    }
}

const colorClasses = ['notes-color-one', 'notes-color-two', 'notes-color-three', 'notes-color-four'];

function getRandomColorClass() {
    return colorClasses[Math.floor(Math.random() * colorClasses.length)];
}

const archiveButtonText = archived => archived ? 'Desarquivar' : 'Arquivar';
const trashButtonText = trashed => trashed ? 'Restaurar' : 'Lixeira';

// Function rendering notes
function createNoteElement({ id, title, text, controls = [], labels = [], archived = false, trashed = false }) {
    const notaHtml = document.createElement('div');
    notaHtml.classList.add('notes', getRandomColorClass());
    notaHtml.dataset.id = id;
    notaHtml.dataset.labels = labels.join(',');
    notaHtml.dataset.archived = archived;
    notaHtml.dataset.trashed = trashed;
    notaHtml.searchText = `${title} ${text} ${labels.join(' ')}`.toLowerCase();

    const notesContent = document.createElement('div');
    notesContent.classList.add('notes-content');

    const titleElement = document.createElement('h1');
    titleElement.classList.add('notes-title');
    titleElement.textContent = title;

    const textElement = document.createElement('p');
    textElement.classList.add('notes-text');
    textElement.textContent = text;

    const labelsContainer = document.createElement('div');
    labelsContainer.classList.add('notes-labels');
    labels.forEach(label => {
        const labelElement = document.createElement('span');
        labelElement.classList.add('note-label');
        labelElement.textContent = label;
        labelsContainer.appendChild(labelElement);
    });

    const controlsContainer = document.createElement('div');
    controlsContainer.classList.add('notes-controls');

    controls.forEach(control => {
        const controlButton = document.createElement('button');
        controlButton.type = 'button';
        controlButton.textContent = control;
        controlButton.classList.add('btn-notes-fechar');
        controlsContainer.appendChild(controlButton);
    });

    const archiveButton = document.createElement('button');
    archiveButton.type = 'button';
    archiveButton.textContent = archiveButtonText(archived);
    archiveButton.classList.add('btn-notes-archive');
    controlsContainer.appendChild(archiveButton);

    const trashButton = document.createElement('button');
    trashButton.type = 'button';
    trashButton.textContent = trashButtonText(trashed);
    trashButton.classList.add('btn-notes-trash');
    controlsContainer.appendChild(trashButton);

    notesContent.append(titleElement, textElement, labelsContainer, controlsContainer);
    notaHtml.appendChild(notesContent);
    return notaHtml;
}

// Expand / close
function openNote(note) {
    if (note.classList.contains('expandida')) return;
    closeExpandedNote();
    note.classList.add('expandida');
    overlay.style.display = 'block';
}

function closeExpandedNote() {
    const note = notesGrid.querySelector('.notes.expandida');
    if (!note) return;
    note.classList.remove('expandida');
    overlay.style.display = 'none';
    if (note.contains(document.activeElement)) document.activeElement.blur();
}

// One listener for every note (no duplicated listeners per click)
notesGrid.addEventListener('click', (e) => {
    const note = e.target.closest('.notes');
    if (!note || note.classList.contains('note-moving')) return;

    if (e.target.closest('.btn-notes-archive')) {
        const archived = note.dataset.archived === 'true';
        moveNote(note, { archived: !archived }, archived ? 'Nota desarquivada' : 'Nota arquivada');
    } else if (e.target.closest('.btn-notes-trash')) {
        const trashed = note.dataset.trashed === 'true';
        moveNote(note, { trashed: !trashed }, trashed ? 'Nota restaurada' : 'Nota movida para a lixeira');
    } else if (e.target.closest('.btn-notes-fechar')) {
        closeExpandedNote();
    } else {
        openNote(note);
    }
});

overlay.addEventListener('click', closeExpandedNote);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeExpandedNote();
});

// Moving notes between folders (archive / trash / restore)
function getNoteStatus(note) {
    return {
        archived: note.dataset.archived === 'true',
        trashed: note.dataset.trashed === 'true',
    };
}

function applyNoteStatus(note, status) {
    note.dataset.archived = status.archived;
    note.dataset.trashed = status.trashed;
    note.querySelector('.btn-notes-archive').textContent = archiveButtonText(status.archived);
    note.querySelector('.btn-notes-trash').textContent = trashButtonText(status.trashed);
    saveNoteStatus(note.dataset.id, status);
}

// Menu button of the folder where a note with this status lives
function folderButtonFor(status) {
    const folder = status.trashed ? 'trash' : status.archived ? 'archive' : 'all';
    return document.querySelector(`.menu-config .menu-button[data-label="${folder}"]`);
}

function moveNote(note, changes, message, { undoable = true } = {}) {
    const previous = getNoteStatus(note);
    const next = { ...previous, ...changes };
    const wasExpanded = note.classList.contains('expandida');
    const wasVisible = note.style.display !== 'none';

    applyNoteStatus(note, next);
    const willBeVisible = noteMatchesFilter(note);
    const destination = folderButtonFor(next);

    const finish = () => {
        if (wasExpanded && !willBeVisible) closeExpandedNote();
        animateGridChange(() => reapplyCurrentFilter());
        if (!wasVisible && willBeVisible) animateNoteEnter(note);
        bumpMenuButton(destination);
    };

    if (wasVisible && !willBeVisible && !reducedMotion.matches) {
        flyNoteTo(note, destination, wasExpanded, finish);
    } else {
        finish();
    }

    if (undoable) {
        showToast(message, () => moveNote(note, previous, '', { undoable: false }));
    } else {
        hideToast();
    }
}

// The note shrinks and flies to the folder it was moved to
function flyNoteTo(note, destination, expanded, done) {
    const target = (destination && destination.querySelector('.icons-menu')) || destination;
    const from = note.getBoundingClientRect();
    const to = target ? target.getBoundingClientRect() : { left: from.left, top: from.top, width: from.width, height: from.height };
    const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
    const base = expanded ? 'translate(-50%, -50%) ' : '';

    note.classList.add('note-moving');
    const overlayFade = expanded
        ? overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: 'ease', fill: 'forwards' })
        : null;
    const flight = note.animate([
        { transform: `${base}translate(0, 0) scale(1)`, opacity: 1, easing: 'ease-out' },
        { transform: `${base}translate(0, -6px) scale(1.04)`, opacity: 1, offset: 0.15, easing: 'cubic-bezier(.45, 0, .8, .45)' },
        { transform: `${base}translate(${dx}px, ${dy}px) scale(0.06)`, opacity: 0.15 },
    ], { duration: 520, fill: 'forwards' });

    flight.finished.catch(() => {}).then(() => {
        note.classList.remove('note-moving');
        done();
        // note and overlay are already hidden, so dropping the fills causes no flash
        flight.cancel();
        if (overlayFade) overlayFade.cancel();
    });
}

// Notes that reappear (e.g. undo) pop back in
function animateNoteEnter(note) {
    if (reducedMotion.matches) return;
    note.animate([
        { opacity: 0, transform: 'scale(.85)' },
        { opacity: 1, transform: 'scale(1)' },
    ], { duration: 320, easing: 'cubic-bezier(.2, 0, 0, 1)' });
}

// FLIP: the remaining notes slide into their new places instead of jumping
function animateGridChange(mutate) {
    if (reducedMotion.matches) {
        mutate();
        return;
    }
    const notes = Array.from(notesGrid.querySelectorAll('.notes'));
    const before = new Map();
    notes.forEach(note => {
        if (note.style.display !== 'none' && !note.classList.contains('expandida')) {
            before.set(note, note.getBoundingClientRect());
        }
    });

    mutate();

    const viewportBottom = window.innerHeight + 200;
    const moves = [];
    notes.forEach(note => {
        const old = before.get(note);
        if (!old || note.style.display === 'none' || note.classList.contains('expandida')) return;
        const now = note.getBoundingClientRect();
        if ((old.bottom < -200 || old.top > viewportBottom) && (now.bottom < -200 || now.top > viewportBottom)) return;
        const dx = old.left - now.left;
        const dy = old.top - now.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
        moves.push([note, dx, dy]);
    });
    moves.forEach(([note, dx, dy]) => {
        note.animate([
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: 'translate(0, 0)' },
        ], { duration: 380, easing: 'cubic-bezier(.2, 0, 0, 1)' });
    });
}

function bumpMenuButton(button) {
    if (!button || reducedMotion.matches) return;
    const icon = button.querySelector('.icons-menu') || button;
    icon.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.45) rotate(-8deg)', offset: 0.4 },
        { transform: 'scale(1)' },
    ], { duration: 450, easing: 'ease-out' });
    button.classList.remove('menu-bump');
    void button.offsetWidth; // restart the CSS animation
    button.classList.add('menu-bump');
}

document.querySelector('.menu-config').addEventListener('animationend', (e) => {
    if (e.animationName === 'menu-bump-bg') e.target.classList.remove('menu-bump');
});

// Toast with "Desfazer"
const toast = document.createElement('div');
toast.className = 'toast';
toast.setAttribute('role', 'status');
toast.setAttribute('aria-live', 'polite');
toast.innerHTML = '<span class="toast-text"></span><button type="button" class="toast-undo">Desfazer</button>';
document.body.appendChild(toast);

let toastTimer = null;
let toastUndo = null;

toast.querySelector('.toast-undo').addEventListener('click', () => {
    const undo = toastUndo;
    hideToast();
    if (undo) undo();
});

function showToast(message, onUndo) {
    toast.querySelector('.toast-text').textContent = message;
    toastUndo = onUndo;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 5000);
}

function hideToast() {
    clearTimeout(toastTimer);
    toastUndo = null;
    toast.classList.remove('show');
}

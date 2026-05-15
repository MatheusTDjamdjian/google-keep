// Fetch data in JSON 
var overlay = document.querySelector('.overlay');

fetch('json/dados.json')
    .then(response => response.json())
    .then(data => {
        data.notes.forEach(note => {
            renderizarNota(note.id, note.title, note.text, note.controls, note.labels, note.archived, note.trashed);
        });
        resizeAllNotesHeight();
        
        addEventListenersToNotes();
    });

function getRandomNumber() {
    return Math.floor(Math.random() * 4) + 1;
}

const colorClasses = {
    1: 'notes-color-one',
    2: 'notes-color-two',
    3: 'notes-color-three',
    4: 'notes-color-four',
}

// Function rendering notes
const renderizarNota = (id, title, text, controls, labels = [], archived = false, trashed = false) => {
    const notaHtml = document.createElement('div');
    notaHtml.classList.add('notes');
    notaHtml.classList.add(colorClasses[getRandomNumber()]);
    notaHtml.setAttribute('data-labels', labels.join(','));
    notaHtml.setAttribute('data-archived', archived);
    notaHtml.setAttribute('data-trashed', trashed);
    notaHtml.addEventListener('click', (e) => {
        overlay.style.display = 'block';
        if (Array.from(e.target.classList).indexOf('notes') === -1) {
            e.target.closest('.notes').classList.add('expandida');
        } else {
            e.target.classList.add('expandida');
        }
        addEventListenersToControls(e.target.closest('.notes') || e.target);
    });

    const notesContent = document.createElement('div');
    notesContent.classList.add('notes-content');

    const idInput = document.createElement('input');
    idInput.setAttribute('type', 'hidden');
    idInput.classList.add('id-nota');
    idInput.value = id;

    const titleElement = document.createElement('h1');
    titleElement.classList.add('notes-title');
    titleElement.textContent = title;

    const textElement = document.createElement('p');
    textElement.classList.add('notes-text');
    textElement.textContent = text;

    const controlsContainer = document.createElement('div');
    controlsContainer.classList.add('notes-controls');

    controls.forEach(control => {
        const controlButton = document.createElement('button');
        controlButton.textContent = control;
        controlButton.classList.add('btn-notes-fechar');
        controlsContainer.appendChild(controlButton);
    });

    const archiveButton = document.createElement('button');
    archiveButton.textContent = archived ? 'Unarchive' : 'Arquivar';
    archiveButton.classList.add('btn-notes-archive');
    archiveButton.addEventListener('click', (e) => {
        e.stopPropagation();
        archiveNote(id);
    });
    controlsContainer.appendChild(archiveButton);

    const trashButton = document.createElement('button');
    trashButton.textContent = trashed ? 'Restore' : 'Lixeira';
    trashButton.classList.add('btn-notes-trash');
    trashButton.addEventListener('click', (e) => {
        e.stopPropagation();
        trashNote(id);
    });
    controlsContainer.appendChild(trashButton);

    const labelsContainer = document.createElement('div');
    labelsContainer.classList.add('notes-labels');
    labels.forEach(label => {
        const labelElement = document.createElement('span');
        labelElement.classList.add('note-label');
        labelElement.textContent = label;
        labelsContainer.appendChild(labelElement);
    });

    notesContent.appendChild(idInput);
    notesContent.appendChild(titleElement);
    notesContent.appendChild(textElement);
    notesContent.appendChild(labelsContainer);
    notesContent.appendChild(controlsContainer);
    notaHtml.appendChild(notesContent);

    document.querySelector('.container-notes').appendChild(notaHtml);
}

// Close the expanded view of a note (if open) and hide the overlay
const closeExpandedNote = (note) => {
    if (note.classList.contains('expandida')) {
        note.classList.remove('expandida');
        if (overlay) overlay.style.display = 'none';
    }
}

// Archive the note
const archiveNote = (id) => {
    const note = document.querySelector(`.notes .id-nota[value="${id}"]`).closest('.notes');
    const isArchived = note.getAttribute('data-archived') === 'true';
    note.setAttribute('data-archived', !isArchived);
    const archiveButton = note.querySelector('.btn-notes-archive');
    archiveButton.textContent = !isArchived ? 'Unarchive' : 'Arquivar';
    closeExpandedNote(note);
    updateNoteStatus(id, { archived: !isArchived });
    reapplyCurrentFilter();
}

// Bin
const trashNote = (id) => {
    const note = document.querySelector(`.notes .id-nota[value="${id}"]`).closest('.notes');
    const isTrashed = note.getAttribute('data-trashed') === 'true';
    note.setAttribute('data-trashed', !isTrashed);
    const trashButton = note.querySelector('.btn-notes-trash');
    trashButton.textContent = !isTrashed ? 'Restore' : 'Lixeira';
    closeExpandedNote(note);
    updateNoteStatus(id, { trashed: !isTrashed });
    reapplyCurrentFilter();
}

// Function to change note statuses
const updateNoteStatus = (id, status) => {
    fetch('json/dados.json')
        .then(response => response.json())
        .then(data => {
            const note = data.notes.find(note => note.id === id);
            Object.assign(note, status);
            return fetch('json/dados.json', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        })
        .catch(error => console.error('Erro no update dos status da nota!', error));
}

// Function to add events to control buttons
const addEventListenersToControls = (note) => {
    const closeButton = note.querySelectorAll(".btn-notes-fechar");

    closeButton.forEach(button => {
        button.addEventListener("click", function(e) {
            e.stopPropagation();
            var expandedNote = document.querySelector(".notes.expandida");

            if (expandedNote) {
                expandedNote.classList.remove("expandida"); 
                overlay.style.display = 'none';

                var controls = expandedNote.querySelector(".notes-controls");
                var content = expandedNote.querySelector(".notes-content");

                controls.classList.add("controls-off");
                controls.classList.remove("controls-on");
                setTimeout(() => {
                    resizeAllNotesHeight();
                }, 500);
            }
        });
    });
}

// Function to add event to notes
const addEventListenersToNotes = () => {
    var notes = document.querySelectorAll(".notes");

    notes.forEach(note => {
        note.addEventListener("mouseenter", () => {
            var controls = note.querySelector(".notes-controls");
            if (controls && !note.classList.contains('expandida')) {
                controls.classList.add("controls-on");
                controls.classList.remove("controls-off");
                setTimeout(() => {
                    resizeAllNotesHeight();
                }, 500);
            }
        });

        note.addEventListener("mouseleave", () => {
            var controls = note.querySelector(".notes-controls");
            if (controls && !note.classList.contains('expandida')) {
                controls.classList.add("controls-off");
                controls.classList.remove("controls-on");
                setTimeout(() => {
                    resizeAllNotesHeight();
                }, 500);
            }
        });
        addEventListenersToControls(note);
    });

    if (overlay) {             
        overlay.addEventListener('click', () => {
            overlay.style.display = 'none';
            notes.forEach(note => {
                note.classList.remove('expandida');
            });
        });
    }
}

document.addEventListener("DOMContentLoaded", function() {
    addEventListenersToNotes();
});
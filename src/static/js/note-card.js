class NoteCardOperator {

    constructor() {
        this.#getInitElements();
    }

    #getInitElements() {
        this.cardContainer = document.getElementById("cards");
    }

    #generateCardNode(noteUUID, serialNumber, note) {
        let title = sanitizeText(note.title);
        let description = sanitizeText(note.description);

        let noteContent;
        if (GlobalConfig.previewNoteContent) {
            noteContent = `<p class="card-text card-text-ellipsis" style="white-space: pre-wrap;">${description}</p>\n`;
        } else {
            noteContent = '<div>\n' +
                '<div class="placeholder-line mt-3" style="width: 85%"></div>\n' +
                '<div class="placeholder-line" style="width: 100%"></div>\n' +
                '<div class="placeholder-line" style="width: 95%"></div>\n' +
                '<div class="placeholder-line" style="width: 70%"></div>\n' +
                '<div class="placeholder-line" style="width: 60%"></div>\n' +
                '<div class="placeholder-line" style="width: 85%"></div>\n' +
                '</div>\n';
        }

        let noteHeader;
        if (note.pinned) {
            noteHeader = '<div class="row">\n' +
                '             <div class="col-1 pe-0">\n' +
                '                 <span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pin-angle" viewBox="0 0 16 16">\n' +
                '                     <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146zm.122 2.112v-.002.002zm0-.002v.002a.5.5 0 0 1-.122.51L6.293 6.878a.5.5 0 0 1-.511.12H5.78l-.014-.004a4.507 4.507 0 0 0-.288-.076 4.922 4.922 0 0 0-.765-.116c-.422-.028-.836.008-1.175.15l5.51 5.509c.141-.34.177-.753.149-1.175a4.924 4.924 0 0 0-.192-1.054l-.004-.013v-.001a.5.5 0 0 1 .12-.512l3.536-3.535a.5.5 0 0 1 .532-.115l.096.022c.087.017.208.034.344.034.114 0 .23-.011.343-.04L9.927 2.028c-.029.113-.04.23-.04.343a1.779 1.779 0 0 0 .062.46z"/>\n' +
                '                 </svg></span>\n' +
                '             </div>\n' +
                '             <div class="col-9">\n' +
                `                 <h5 class="card-title fw-bold">${title}</h5>\n` +
                '             </div>\n' +
                '             <div class="col-2">\n' +
                `                 <input class="form-check-input note-checkbox" type="checkbox" id="checkbox-${noteUUID}">\n` +
                '             </div>\n' +
                '         </div>\n';
        } else {
            noteHeader = '<div class="row">\n' +
                '             <div class="col-10">\n' +
                `                 <h5 class="card-title fw-bold">${title}</h5>\n` +
                '             </div>\n' +
                '             <div class="col-2">\n' +
                `                 <input class="form-check-input note-checkbox" type="checkbox" id="checkbox-${noteUUID}">\n` +
                '             </div>\n' +
                '         </div>\n';
        }

        let cardHtml = '<div class="col-sm-6 col-md-4 col-lg-3">\n' +
            `            <div class="card h-100 bg-light card-hover" id="${noteUUID}">\n` +
            '                <div class="card-body">\n' +
            `                    ${noteHeader}` +
            `                    ${noteContent}` +
            '                </div>\n' +
            '                <div class="card-footer" style="font-size: 0.8rem;">\n' +
            '                    <div class="row">\n' +
            `                        <span class="col-8 text-start">${note.time}</span>\n` +
            '                        <span class="col-4 text-end">\n' +
            `                            <span class="badge bg-dark-subtle rounded-pill">${serialNumber}</span>\n` +
            '                        </span>\n' +
            '                    </div>\n' +
            '                </div>\n' +
            '            </div>\n' +
            '        </div>';
        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = cardHtml;
        this.cardContainer.appendChild(tempDiv.firstChild);
    }

    #clearCards() {
        this.cardContainer.replaceChildren();
    }

    #setCardListeners() {
        document.querySelectorAll(".card").forEach(card => {
            card.addEventListener("click", e => {
                let checkboxEle = document.getElementById(`checkbox-${e.currentTarget.id}`);
                checkboxEle.checked = !checkboxEle.checked;
            });
            card.addEventListener("dblclick", e => GlobalNoteOpener.open(e.currentTarget.id));
        });
    }

    // TODO 更新时，可以只更新某个card？应对不需要全部重新创建的场景？
    generateNoteCards(notes) {
        this.#clearCards();
        let noteSerialNumber = 1;
        for (let [uuid, note] of Object.entries(notes)) {
            this.#generateCardNode(uuid, noteSerialNumber, note);
            noteSerialNumber += 1;
        }
        this.#setCardListeners();
    }
}
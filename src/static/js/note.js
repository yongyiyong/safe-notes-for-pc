class Note {
    constructor(note) {
        this.title = note["title"];
        this.description = note["description"];
        this.time = note["time"];
        this.autoOpen = note["auto_open"];
        this.pinned = note["pinned"];

        // 笔记MD5值，用于校验笔记内容是否发生了变化
        this.initMD5 = this.getCurrentMD5();
    }

    update(note) {
        if (note.title) this.title = note.title;
        if (note.description) this.description = note.description;
        if (note.time) this.time = note.time;
    }

    getCurrentMD5() {
        return CryptoJS.MD5(this.title + this.description).toString();
    }

    isContentChanged() {
        let currentMD5 = this.getCurrentMD5();

        return currentMD5 !== this.initMD5;
    }

    // 内容发生变化后，重新生成 MD5 值
    refreshInitMD5() {
        this.initMD5 = this.getCurrentMD5();
    }
}

class NoteOpener {
    constructor() {
        this.titleElementIdPrefix = "note-title-";

        this.uuidGroup = [];
        this.uuid = null;
        this.note = null;
        this.defaultView = null;
        this.lastSelectedView = null;
        this.autoSaveInterval = null;

        this.#getInitElements();
        this.#setListeners();
    }

    #reinitialize() {
        this.uuidGroup = [];
        this.uuid = null;
        this.note = null;
        this.activeNoteEditContent.value = "";
        this.activeNoteMDContent.innerHTML = "";
        this.#clearTitleElements();
        this.#initSaveStatus();
        this.activeNoteModal.hide();
        this.#unsetAutoSaveNote();
    }

    #debounce(fn, delay = 200) {
        let timer;
        return function () {
            clearTimeout(timer);
            timer = setTimeout(fn.bind(this, ...arguments), delay);
        }
    }

    #getInitElements() {
        this.activeNoteModal = new bootstrap.Modal(document.getElementById("activeNoteModal"));
        this.noteTitleContainer = document.getElementById("noteTitleContainer");
        this.activeNoteMDContent = document.getElementById("activeNoteMDContent");
        this.activeNoteEditContent = document.getElementById("activeNoteEditContent");

        this.noteCloseBtn = document.getElementById("noteCloseBtn");
        this.saveNoteBtn = document.getElementById("saveNoteBtn");
        this.editViewBtn = document.getElementById("editView");
        this.readTimeViewBtn = document.getElementById("readTimeView");
        this.markdownViewBtn = document.getElementById("markdownView");

        this.noteChangedIcon = document.getElementById("noteChangedIcon");
        this.noteSavedIcon = document.getElementById("noteSavedIcon");
    }

    #setListeners() {
        this.noteCloseBtn.addEventListener("click", () => this.#close());
        this.saveNoteBtn.addEventListener("click", () => this.#saveNote());

        this.editViewBtn.addEventListener("click", () => this.#switchView(NoteOperationView.edit));
        this.markdownViewBtn.addEventListener("click", () => this.#switchView(NoteOperationView.markdown));
        this.readTimeViewBtn.addEventListener("click", () => this.#switchView(NoteOperationView.realTime));

        this.activeNoteEditContent.oninput = this.#debounce((e) => this.#noteChangeCallback(), 500);

        // 双击自动复制 sc 标签中的文本
        this.activeNoteMDContent.addEventListener("dblclick", (e) => {
            if (e.target.tagName.toLowerCase() === "sc") copyText(e.target.innerText);
        });

        // 绑定快捷方式
        let _this = this;
        document.addEventListener("keydown", function (e) {
            // Ctrl+S 保存修改
            if (e.ctrlKey && e.key === "s") {
                _this.saveNoteBtn.click();
            }
            // Ctrl+Q 关闭笔记
            if (e.ctrlKey && e.key === "q") {
                _this.noteCloseBtn.click();
            }
            // Ctrl+W 切换笔记
            if (e.ctrlKey && e.key === "w") {
                _this.#quicklySwitchNote();
            }
        });
    }

    #setNoteTitle(uuid, title) {
        let activeNoteTitle = document.getElementById(`${this.titleElementIdPrefix}${uuid}`);
        activeNoteTitle.value = title;
    }

    #setNoteContent(content) {
        if (!content) {
            content = this.note.description;
        }

        this.activeNoteEditContent.value = content;
        this.activeNoteMDContent.innerHTML = safeMarkedParse(this.activeNoteEditContent.value);
    }

    #trySetTitleReadonly(uuid) {
        let titleElement = document.getElementById(`${this.titleElementIdPrefix}${uuid}`);
        titleElement.readOnly = GlobalConfig.openRepoWithReadonly;
    }

    #trySetContentReadonly() {
        this.activeNoteEditContent.readOnly = GlobalConfig.openRepoWithReadonly;
    }

    #noteChangeCallback(renderMD = true) {
        // 实时渲染 markdown
        if (renderMD) this.activeNoteMDContent.innerHTML = safeMarkedParse(this.activeNoteEditContent.value);
        this.#switchSaveStatus();
    }

    #saveNote() {
        if (!this.note) {
            return;
        }

        if (!this.#hasUnsavedEdit()) {
            warnNotify("所有编辑都已保存");
            return;
        }

        this.note.update({
            title: this.#getCurrentEditTitle(),
            description: this.activeNoteEditContent.value,
            time: getCurrentTime()
        });
        let _this = this;
        PyNoteRepo.save_note(this.uuid, this.note.title, this.note.description, this.note.time)
            .then(receiveResponse)
            .then(() => {
                _this.#switchSaveStatus();
                successNotify("保存成功");
            });
    }

    #autoSaveNote() {
        if (!this.note || !this.#hasUnsavedEdit()) return;

        this.note.update({
            title: this.#getCurrentEditTitle(),
            description: this.activeNoteEditContent.value,
            time: getCurrentTime()
        });
        PyNoteRepo.save_note(this.uuid, this.note.title, this.note.description, this.note.time)
            .then(receiveResponse)
            .then(() => this.#switchSaveStatus());
    }

    #setAutoSaveNote() {
        this.autoSaveInterval = setInterval(() => this.#autoSaveNote(), 3000);
    }

    #unsetAutoSaveNote() {
        clearInterval(this.autoSaveInterval);
    }

    #resetNoteTitle() {
        this.#setNoteTitle(this.uuid, this.#getCurrentEditTitle());
    }

    #resetNoteContent() {
        this.#setNoteContent(this.activeNoteEditContent.value);
    }

    #switchView(view, resetNote = true) {
        if (view === NoteOperationView.edit) {
            this.activeNoteEditContent.hidden = false;
            this.activeNoteMDContent.hidden = true;
            this.activeNoteEditContent.classList.add("note-content-exclusive");
            this.activeNoteMDContent.classList.remove("note-content-exclusive");
            this.editViewBtn.checked = true;
        } else if (view === NoteOperationView.markdown) {
            this.activeNoteEditContent.hidden = true;
            this.activeNoteMDContent.hidden = false;
            this.activeNoteEditContent.classList.remove("note-content-exclusive");
            this.activeNoteMDContent.classList.add("note-content-exclusive");
            this.markdownViewBtn.checked = true;
        } else {
            this.activeNoteEditContent.hidden = false;
            this.activeNoteMDContent.hidden = false;
            this.activeNoteEditContent.classList.remove("note-content-exclusive");
            this.activeNoteMDContent.classList.remove("note-content-exclusive");
            this.readTimeViewBtn.checked = true;
        }

        this.lastSelectedView = view;

        if (!resetNote) {
            return;
        }

        // 标题或内容可能发生了变化，所以要重新渲染
        this.#resetNoteTitle();
        this.#resetNoteContent();
    }

    isNoteOpened() {
        return !!this.note;
    }

    #getCurrentEditTitle() {
        return document.getElementById(`${this.titleElementIdPrefix}${this.uuid}`).value;
    }

    #getCurrentEditMD5() {
        return CryptoJS.MD5(this.#getCurrentEditTitle() + this.activeNoteEditContent.value).toString();
    }

    #hasUnsavedEdit() {
        return this.#getCurrentEditMD5() !== this.note.getCurrentMD5();
    }

    #initSaveStatus() {
        this.noteSavedIcon.classList.add("force-hidden");
        this.noteChangedIcon.classList.add("force-hidden");
    }

    #switchSaveStatus() {
        if (this.#hasUnsavedEdit()) {
            this.noteSavedIcon.classList.add("force-hidden");
            this.noteChangedIcon.classList.remove("force-hidden");
        } else {
            this.noteSavedIcon.classList.remove("force-hidden");
            this.noteChangedIcon.classList.add("force-hidden");
        }
    }

    // 如果发生了编辑，则需要重新更新笔记清单，更新笔记内容以及排序
    #refreshNotes() {
        if (!this.note.isContentChanged()) return;
        this.note.refreshInitMD5();
        GlobalNoteRepo.refreshNotes();
    }

    #finallyClose(refreshNotes = true, clearLastOpenedNotes = true) {
        if (refreshNotes) this.#refreshNotes();
        this.#reinitialize();
        if (GlobalConfig.rememberNoteOpenStatus && clearLastOpenedNotes) PyNoteRepo.record_opened_notes([]).then(receiveResponse);
    }

    #close() {
        if (!this.isNoteOpened()) return;

        if (this.#hasUnsavedEdit()) {
            let _this = this;
            popupConfirm({
                message: "有未保存的编辑，确定关闭吗？",
                sureCallbackFunc: () => _this.#finallyClose()
            });
        } else {
            this.#finallyClose();
        }
    }

    // 将未保存的编辑备份成新的笔记，避免锁定时丢失编辑
    #backupEdited() {
        PyNoteRepo.backup_note(this.#getCurrentEditTitle(), this.activeNoteEditContent.value)
            .then(receiveResponse)
            .then(() => successNotify("备份成功"));
    }

    #createTitleElement(uuid) {
        let titleElement = document.getElementById(`${this.titleElementIdPrefix}${uuid}`);
        if (titleElement) return;

        let titleEle = document.createElement("input");
        titleEle.id = `${this.titleElementIdPrefix}${uuid}`;
        titleEle.type = "text";
        // 禁用单词检查
        titleEle.spellcheck = false;
        titleEle.className = "px-2 fs-5 fw-bold d-flex align-items-center text-center note-title";
        this.noteTitleContainer.appendChild(titleEle);

        titleEle.addEventListener("click", e => {
            let uuid = e.target.id.split("-")[2];
            this.#switchNote(uuid);
        });
        titleEle.addEventListener("input", () => this.#noteChangeCallback(false));
    }

    #selectNoteTitle(uuid) {
        this.noteTitleContainer.querySelectorAll(".note-title").forEach(titleElement => {
            titleElement.classList.remove("note-title-activate");
        });

        let selectedTitle = document.getElementById(`${this.titleElementIdPrefix}${uuid}`);
        selectedTitle.classList.add("note-title-activate");
    }

    #clearTitleElements() {
        this.noteTitleContainer.querySelectorAll(".note-title").forEach(titleElement => {
            titleElement.remove();
        });
    }

    #switchNote(uuid) {
        if (uuid === this.uuid) return;

        if (this.#hasUnsavedEdit()) {
            let _this = this;
            popupConfirm({
                message: "有未保存的编辑，确定切换吗？",
                sureCallbackFunc: () => {
                    // 切换前重新渲染当前打开笔记的标题，避免编辑后不保存时暂时显示未保存的标题
                    _this.#setNoteTitle(_this.uuid, _this.note.title);
                    _this.open(uuid);
                }
            });
        } else {
            this.open(uuid);
        }
    }

    #quicklySwitchNote() {
        if (!this.uuid || this.uuidGroup.length <= 1) return;

        let currentNoteIndex = this.uuidGroup.indexOf(this.uuid);
        let maxNoteIndex = this.uuidGroup.length - 1;
        let nextNoteUuid;
        if (currentNoteIndex >= maxNoteIndex) {
            nextNoteUuid = this.uuidGroup[0];
        } else {
            nextNoteUuid = this.uuidGroup[currentNoteIndex + 1];
        }
        this.#switchNote(nextNoteUuid);
    }

    open(uuid) {
        // 使用上次使用的视图，如果是第一次打开，则从配置中读取
        this.defaultView = this.lastSelectedView || GlobalConfig.defaultNoteView;

        this.uuid = uuid;
        this.note = GlobalNoteRepo.getNoteByUUID(this.uuid);
        this.#createTitleElement(uuid);
        this.#selectNoteTitle(uuid);
        this.#setNoteTitle(uuid, this.note.title);
        this.#setNoteContent();
        this.#trySetTitleReadonly(uuid);
        this.#trySetContentReadonly();
        // 首次切换视图，无需重置笔记（标题+内容）
        this.#switchView(this.defaultView, false);
        this.activeNoteModal.show();

        if (GlobalConfig.autoSaveNote) {
            this.#setAutoSaveNote();
        }
    }

    openInGroup(uuids) {
        this.uuidGroup = uuids;
        // 默认打开第一个
        this.open(this.uuidGroup[0]);

        // 其他笔记只设置标题
        for (const uuid of this.uuidGroup.slice(1)) {
            let note = GlobalNoteRepo.getNoteByUUID(uuid);
            this.#createTitleElement(uuid);
            this.#setNoteTitle(uuid, note.title);
            this.#trySetTitleReadonly(uuid);
        }
    }

    closeForLockRepo() {
        if (!this.isNoteOpened()) return;
        if (this.#hasUnsavedEdit()) this.#backupEdited();
        this.#finallyClose(false, false);
    }
}
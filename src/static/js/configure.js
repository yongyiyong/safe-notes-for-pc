class Configure {
    constructor() {
        this.lastNoteRepo = "";
        this.noteSortOrder = "time-desc";
        this.autoLockTimeout = 120;
        this.autoExitTimeout = 300;
        this.defaultNoteView = "real-time";
        this.previewNoteContent = false;
        this.autoSaveNote = true;
        this.openRepoWithReadonly = false;
        this.rememberNoteOpenStatus = true;

        this.#getInitElements();
        this.#setListeners();
    }

    #getInitElements() {
        this.noteSortOrderSelect = document.getElementById("noteSortOrderSelect");
        this.noteDefaultView = document.getElementById("noteDefaultView");
        this.setLockTimeout = document.getElementById("setLockTimeout");
        this.setExitTimeout = document.getElementById("setExitTimeout");
        this.enablePreviewNoteCheck = document.getElementById("enablePreviewNoteCheck");
        this.enableAutoSaveNote = document.getElementById("enableAutoSaveNote");
        this.enableOpenRepoWithReadonly = document.getElementById("enableOpenRepoWithReadonly");
        this.enableRememberNoteOpenStatus = document.getElementById("enableRememberNoteOpenStatus");
        this.generalSetupBtn = document.getElementById("generalSetupBtn");
    }

    #setListeners() {
        this.generalSetupBtn.addEventListener("click", () => this.#save());
    }

    #save() {
        let autoLockTimeout = this.setLockTimeout.value;
        let autoExitTimeout = this.setExitTimeout.value;

        if (autoExitTimeout < autoLockTimeout) {
            errorNotify("自动退出时间不能小于自动锁定时间！");
            return;
        }

        this.noteSortOrder = this.noteSortOrderSelect.value;
        this.defaultNoteView = this.noteDefaultView.value;
        this.previewNoteContent = this.enablePreviewNoteCheck.checked;
        this.autoSaveNote = this.enableAutoSaveNote.checked;
        this.openRepoWithReadonly = this.enableOpenRepoWithReadonly.checked;
        this.rememberNoteOpenStatus = this.enableRememberNoteOpenStatus.checked;
        this.autoLockTimeout = autoLockTimeout;
        this.autoExitTimeout = autoExitTimeout;

        GlobalNoteRepo.refreshNotes();
        this.#dump();
    }

    #dump() {
        let config = {
            "auto_exit_timeout": this.autoExitTimeout,
            "auto_lock_timeout": this.autoLockTimeout,
            "note_sort_order": this.noteSortOrder,
            "default_note_view": this.defaultNoteView,
            "preview_note_content": this.previewNoteContent,
            "auto_save_note": this.autoSaveNote,
            "open_repo_with_readonly": this.openRepoWithReadonly,
            "remember_note_open_status": this.rememberNoteOpenStatus,
        };
        pywebview.api.sn_config.frontend_save(JSON.stringify(config));
    }

    async load() {
        let cnf = await pywebview.api.sn_config.frontend_get();
        if (cnf.hasOwnProperty("last_note_repo")) this.lastNoteRepo = cnf["last_note_repo"];
        if (cnf.hasOwnProperty("note_sort_order")) this.noteSortOrder = cnf["note_sort_order"];
        if (cnf.hasOwnProperty("auto_lock_timeout")) this.autoLockTimeout = cnf["auto_lock_timeout"];
        if (cnf.hasOwnProperty("auto_exit_timeout")) this.autoExitTimeout = cnf["auto_exit_timeout"];
        if (cnf.hasOwnProperty("default_note_view")) this.defaultNoteView = cnf["default_note_view"];
        if (cnf.hasOwnProperty("preview_note_content")) this.previewNoteContent = cnf["preview_note_content"];
        if (cnf.hasOwnProperty("auto_save_note")) this.autoSaveNote = cnf["auto_save_note"];
        if (cnf.hasOwnProperty("open_repo_with_readonly")) this.openRepoWithReadonly = cnf["open_repo_with_readonly"];
        if (cnf.hasOwnProperty("remember_note_open_status")) this.rememberNoteOpenStatus = cnf["remember_note_open_status"];

        this.noteSortOrderSelect.value = this.noteSortOrder;
        this.noteDefaultView.value = this.defaultNoteView;
        this.enablePreviewNoteCheck.checked = this.previewNoteContent;
        this.enableAutoSaveNote.checked = this.autoSaveNote;
        this.enableOpenRepoWithReadonly.checked = this.openRepoWithReadonly;
        this.enableRememberNoteOpenStatus.checked = this.rememberNoteOpenStatus;
        this.setLockTimeout.value = this.autoLockTimeout;
        this.setExitTimeout.value = this.autoExitTimeout;
    }

    hasNoteRepoHis() {
        return !!this.lastNoteRepo;
    }
}
class NoteRepoCreator {
    constructor() {
        this.#getInitElements();
        this.#setListeners();
    }

    #getInitElements() {
        this.newNoteRepoPath = document.getElementById("newNoteRepoPath");
        this.newNoteRepoName = document.getElementById("newNoteRepoName");
        this.newNoteRepoPwdInput = document.getElementById("newNoteRepoPwdInput");
        this.newNoteRepoRepeatPwdInput = document.getElementById("newNoteRepoRepeatPwdInput");
        this.createNoteRepoBtn = document.getElementById("createNoteRepoBtn");
        this.createNoteRepoModal = document.getElementById("createNoteRepoModal");
        this.cancelCreateNoteRepoBtn = document.getElementById("cancelCreateNoteRepoBtn");
    }

    #setListeners() {
        this.newNoteRepoPath.addEventListener("click", () => this.#selectNoteRepoDir());
        this.createNoteRepoBtn.addEventListener("click", () => this.#createNoteRepo());

        this.newNoteRepoName.addEventListener("input", () => this.#changeSubmitBtnStatus());
        this.newNoteRepoPwdInput.addEventListener("input", () => this.#changeSubmitBtnStatus());
        this.newNoteRepoRepeatPwdInput.addEventListener("input", () => this.#changeSubmitBtnStatus());
    }

    #selectNoteRepoDir() {
        let _this = this;
        PyNoteRepo.select_note_repo_dir()
            .then(receiveResponse)
            .then(data => {
                _this.newNoteRepoPath.value = data["repo_dir"];
                _this.#changeSubmitBtnStatus();
            });
    }

    #createNoteRepo() {
        let repoDir = this.newNoteRepoPath.value;
        let repoName = this.newNoteRepoName.value;
        let repoPwd = this.newNoteRepoPwdInput.value;
        let repoRepeatPwd = this.newNoteRepoRepeatPwdInput.value;

        if (repoRepeatPwd !== repoPwd) {
            errorNotify("两次设置的密钥不同！");
            return;
        }

        let repoPath = `${repoDir}\\${repoName}`;
        let _this = this;
        GlobalNoteRepo.lockNoteRepo();
        PyNoteRepo.create_note_repo(repoPath, repoPwd)
            .then(receiveResponse)
            .then(data => {
                _this.#hideModal();
                successNotify(`成功创建笔记库 ${repoName}`);
                GlobalConfig.lastNoteRepo = data["repo_path"];
                GlobalNoteRepo.loadNotes(data["notes"]);
                clearPwdInput();
            });
    }

    #isModalVisible() {
        return this.createNoteRepoModal.classList.contains("show");
    }

    #enableSubmitBtn() {
        this.createNoteRepoBtn.disabled = false;
    }

    #disableSubmitBtn() {
        this.createNoteRepoBtn.disabled = true;
    }

    #changeSubmitBtnStatus() {
        let requiredInput = [
            this.newNoteRepoPath.value,
            this.newNoteRepoName.value,
            this.newNoteRepoPwdInput.value,
            this.newNoteRepoRepeatPwdInput.value
        ];
        if (requiredInput.every(Boolean)) {
            this.#enableSubmitBtn();
            return;
        }
        this.#disableSubmitBtn();
    }

    #hideModal() {
        this.cancelCreateNoteRepoBtn.click();
    }

    showModal() {
        if (this.#isModalVisible()) {
            return;
        }

        this.#disableSubmitBtn();
        let modal = new bootstrap.Modal(this.createNoteRepoModal);
        modal.show();
    }
}

class NoteRepoSetter {
    constructor() {
        this.#getInitElements();
        this.#setListeners();
    }

    #getInitElements() {
        this.selectNoteRepoInput = document.getElementById("selectNoteRepoInput");
        this.noteRepoPwdInput = document.getElementById("noteRepoPwdInput");
        this.setNoteRepoBtn = document.getElementById("setNoteRepoBtn");
        this.setNoteRepoModal = document.getElementById("setNoteRepoModal");
        this.cancelSetNoteRepoBtn = document.getElementById("cancelSetNoteRepoBtn");
    }

    #setListeners() {
        this.selectNoteRepoInput.addEventListener("click", () => this.#selectNoteRepo());
        this.setNoteRepoBtn.addEventListener("click", () => this.#setNoteRepo());

        this.noteRepoPwdInput.addEventListener("input", () => this.#changeSubmitBtnStatus());

        let _this = this;
        // 自动聚焦到密码输入框
        this.setNoteRepoModal.addEventListener('shown.bs.modal', () => {
            if (!_this.selectNoteRepoInput.value) return;
            _this.noteRepoPwdInput.focus();
        });
        this.noteRepoPwdInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                _this.setNoteRepoBtn.click();
            }
        });
    }

    #selectNoteRepo() {
        let _this = this;
        PyNoteRepo.select_note_repo()
            .then(receiveResponse)
            .then(data => {
                _this.selectNoteRepoInput.value = data["repo_path"];
                _this.#changeSubmitBtnStatus();
            });
    }

    #setNoteRepo() {
        let repoPath = this.selectNoteRepoInput.value;
        let repoPwd = this.noteRepoPwdInput.value;
        let _this = this;

        GlobalNoteRepo.lockNoteRepo();
        PyNoteRepo.load_notes(repoPath, repoPwd)
            .then(receiveResponse)
            .then(data => {
                _this.#hideModal();
                GlobalConfig.lastNoteRepo = repoPath;
                GlobalNoteRepo.loadNotes(data["notes"]);
                clearPwdInput();
            });
    }

    #isModalVisible() {
        return this.setNoteRepoModal.classList.contains("show");
    }

    #enableSubmitBtn() {
        this.setNoteRepoBtn.disabled = false;
    }

    #disableSubmitBtn() {
        this.setNoteRepoBtn.disabled = true;
    }

    #changeSubmitBtnStatus() {
        if (!this.selectNoteRepoInput.value || !this.noteRepoPwdInput.value) {
            this.#disableSubmitBtn();
            return;
        }
        this.#enableSubmitBtn();
    }

    #hideModal() {
        this.cancelSetNoteRepoBtn.click();
    }

    showModal() {
        if (this.#isModalVisible()) {
            return;
        }

        this.selectNoteRepoInput.value = GlobalConfig.lastNoteRepo;
        this.#disableSubmitBtn();
        let modal = new bootstrap.Modal(this.setNoteRepoModal);
        modal.show();
    }
}

class NoteRepo {
    #initialize() {
        // notes 不是展示的笔记清单，所以无需排序
        this.notes = {};

        // 可展示的笔记，需排序
        this._displayNotes = {};
        this.displayNotes = {};

        this.isLoaded = false;
    }

    constructor() {
        this.#initialize();
        this.#getInitElements();
        this.#setListeners();
    }

    #getInitElements() {
        this.noteCardContainer = document.getElementById("noteCardContainer");

        this.lockSafeNotesBtn = document.getElementById("lockSafeNotesBtn");
        this.navbarNewNoteBtn = document.getElementById("navbarNewNoteBtn");
        this.moreOperationBtn = document.getElementById("moreOperationBtn");
        this.lockSafeNotesIcon = document.getElementById("lockSafeNotesIcon");
        this.unlockSafeNotesIcon = document.getElementById("unlockSafeNotesIcon");

        this.changeRepoPwdBtn = document.getElementById("changeRepoPwdBtn");
        this.changeRepoPwdInput = document.getElementById("changeRepoPwdInput");
        this.changeRepoRepeatPwdInput = document.getElementById("changeRepoRepeatPwdInput");
        this.changeRepoPwdModalBtn = document.getElementById("changeRepoPwdModalBtn");
        this.cancelChangeRepoPwdBtn = document.getElementById("cancelChangeRepoPwdBtn");

        this.searchNotesInput = document.getElementById("searchNotesInput");

        this.contextMenu = document.getElementById("contextMenu");
        this.menuPosition = document.getElementById("menuPosition");
    }

    #setListeners() {
        let _this = this;

        this.lockSafeNotesBtn.addEventListener("click", () => {
            this.lockNoteRepo();
            GlobalNoteRepoSetter.showModal();
        });

        document.querySelectorAll(".new-note-btn").forEach(ele => {
            ele.addEventListener("click", () => _this.#newNote());
        });
        document.querySelectorAll(".open-in-group-btn").forEach(ele => {
            ele.addEventListener("click", () => NoteRepo.#openInGroup());
        });
        document.querySelectorAll(".pin-note-btn").forEach(ele => {
            ele.addEventListener("click", () => _this.#pinNotes());
        });
        document.querySelectorAll(".cancel-select-btn").forEach(ele => {
            ele.addEventListener("click", () => NoteRepo.#cancelSelectedNotes());
        });
        document.querySelectorAll(".cancel-pin-note-btn").forEach(ele => {
            ele.addEventListener("click", () => _this.#cancelPinNotes());
        });
        document.querySelectorAll(".note-copy-btn").forEach(ele => {
            ele.addEventListener("click", () => _this.#copyNotes());
        });
        document.querySelectorAll(".note-delete-btn").forEach(ele => {
            ele.addEventListener("click", () => _this.#deleteNotes());
        });

        this.changeRepoPwdBtn.addEventListener("click", () => this.#changeRepoPwd());
        this.searchNotesInput.addEventListener("input", e => this.#matchNotes());

        this.changeRepoPwdInput.addEventListener("input", e => this.#changeSubmitBtnStatus());
        this.changeRepoRepeatPwdInput.addEventListener("input", e => this.#changeSubmitBtnStatus());

        // 搜索时只匹配到唯一的笔记时，回车快速打开笔记
        this.searchNotesInput.addEventListener("keydown", function (e) {
            if (e.key !== "Enter" || !_this.searchNotesInput.value || Object.keys(_this.displayNotes).length !== 1) return;
            GlobalNoteOpener.open(Object.keys(_this.displayNotes)[0]);
        });

        // 绑定快捷键
        document.addEventListener("keydown", function (e) {
            // Ctrl+F 自动聚焦到搜索框
            if (e.ctrlKey && e.key === "f") {
                // 阻止浏览器默认的查找行为
                e.preventDefault();
                _this.searchNotesInput.focus();
            }
            // Ctrl+L 锁定笔记库
            if (e.ctrlKey && e.key === "l") {
                _this.lockNoteRepo();
                GlobalNoteRepoSetter.showModal();
            }
            // Ctrl+N 新增笔记
            if (e.ctrlKey && e.key === "n") {
                if (GlobalNoteOpener.isNoteOpened()) return;
                // _this.navbarNewNoteBtn.click();
                _this.#newNote();
            }
            // Ctrl+G 分组打开笔记
            if (e.ctrlKey && e.key === "g") {
                if (GlobalNoteOpener.isNoteOpened()) return;
                NoteRepo.#openInGroup();
            }
        });

        // 右键菜单
        this.noteCardContainer.addEventListener("contextmenu", function (e) {
            if (!_this.isLoaded) return;
            e.preventDefault();
            _this.#showContextMenu(e.clientX, e.clientY);
        });
        document.querySelectorAll(".menu-item").forEach(ele => {
            ele.addEventListener("click", () => _this.#hideContextMenu());
        });
        document.addEventListener("click", function (e) {
            if (!_this.contextMenu.contains(e.target)) {
                _this.#hideContextMenu();
            }
        });
    }

    #showContextMenu(x, y) {
        // 隐藏之前可能显示的菜单
        this.contextMenu.classList.remove("show");

        // 获取视窗尺寸
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // 获取菜单尺寸
        const menuWidth = this.contextMenu.offsetWidth;
        const menuHeight = this.contextMenu.offsetHeight;

        // 调整位置，确保菜单不会超出视窗
        let adjustedX = x;
        let adjustedY = y;

        if (x + menuWidth > viewportWidth) {
            adjustedX = viewportWidth - menuWidth - 10;
        }

        if (y + menuHeight > viewportHeight) {
            adjustedY = viewportHeight - menuHeight - 10;
        }

        // 设置菜单位置
        this.contextMenu.style.left = adjustedX + 'px';
        this.contextMenu.style.top = adjustedY + 'px';
        this.contextMenu.classList.add("show");

        // 更新位置显示
        this.menuPosition.textContent = `X: ${adjustedX}, Y: ${adjustedY}`;
    }

    #hideContextMenu() {
        this.contextMenu.classList.remove("show");
    }

    #showLockIcon() {
        this.lockSafeNotesIcon.hidden = false;
        this.unlockSafeNotesIcon.hidden = true;
    }

    #showUnlockIcon() {
        this.lockSafeNotesIcon.hidden = true;
        this.unlockSafeNotesIcon.hidden = false;
    }

    #enableButtons() {
        this.searchNotesInput.disabled = false;
        this.navbarNewNoteBtn.disabled = false;
        this.moreOperationBtn.disabled = false;
        this.changeRepoPwdModalBtn.disabled = false;
    }

    #disableButtons() {
        this.searchNotesInput.disabled = true;
        this.navbarNewNoteBtn.disabled = true;
        this.moreOperationBtn.disabled = true;
        this.changeRepoPwdModalBtn.disabled = true;
    }

    #enableSubmitBtn() {
        this.changeRepoPwdBtn.disabled = false;
    }

    #disableSubmitBtn() {
        this.changeRepoPwdBtn.disabled = true;
    }

    #changeSubmitBtnStatus() {
        if (!this.changeRepoPwdInput.value || !this.changeRepoRepeatPwdInput.value) {
            this.#disableSubmitBtn();
            return;
        }
        this.#enableSubmitBtn();
    }

    #hideChangePwdModal() {
        this.cancelChangeRepoPwdBtn.click();
    }

    get displayNotes() {
        return this._displayNotes;
    }

    set displayNotes(notes) {
        this._displayNotes = NoteRepo.#sortNotes(notes);
        // 展示笔记发生变化，自动重新生成笔记卡片
        GlobalNoteCardOperator.generateNoteCards(this._displayNotes);
    }

    static #sortNotesByTime(notes, direction) {
        let sortedNotes = {};
        let timeList = [];

        // 通过转换成时间对象实现按时间排序
        for (let [uuid, note] of Object.entries(notes)) {
            let dateObj = new Date(note.time);
            // 将 uuid 和 note 挂载到日期对象上
            dateObj.uuid = uuid;
            dateObj.note = note;
            timeList.push(dateObj);
        }

        // 升序
        timeList.sort((a, b) => a.getTime() - b.getTime());
        if (direction === SortDirection.desc) {
            // 反转后降序
            timeList.reverse();
        }
        for (let dateObj of timeList) {
            sortedNotes[dateObj.uuid] = dateObj.note;
        }

        return sortedNotes;
    }

    static #sortNotesByTitle(notes, direction) {
        let sortedNotes = {};
        let titleList = [];

        // 通过转换成字符串对象实现按标题排序
        for (let [uuid, note] of Object.entries(notes)) {
            let strObj = new String(note.title);
            // 将 uuid 和 note 挂载到字符串对象上
            strObj.uuid = uuid;
            strObj.note = note;
            titleList.push(strObj);
        }

        // 升序
        titleList.sort((a, b) => {
            return a.localeCompare(b, undefined, {
                numeric: true,
                sensitivity: "base"
            });
        });
        if (direction === SortDirection.desc) {
            // 反转后降序
            titleList.reverse();
        }
        for (let strObj of titleList) {
            sortedNotes[strObj.uuid] = strObj.note;
        }

        return sortedNotes;
    }

    static #sortNotes(notes) {
        let [order, direction] = GlobalConfig.noteSortOrder.split("-");

        let pinnedNotes = {};
        let otherNotes = {};
        for (let [uuid, note] of Object.entries(notes)) {
            if (note.pinned) {
                pinnedNotes[uuid] = note;
            } else {
                otherNotes[uuid] = note;
            }
        }

        if (order === SortOrder.time) {
            pinnedNotes = NoteRepo.#sortNotesByTime(pinnedNotes, direction);
            otherNotes = NoteRepo.#sortNotesByTime(otherNotes, direction);
        } else if (order === SortOrder.title) {
            pinnedNotes = NoteRepo.#sortNotesByTitle(pinnedNotes, direction);
            otherNotes = NoteRepo.#sortNotesByTitle(otherNotes, direction);
        } else {
            return notes;
        }

        return {...pinnedNotes, ...otherNotes};
    }

    #isNullRepo() {
        return Object.keys(this.notes).length === 0;
    }

    #promptCreateNote() {
        popupConfirm({
            message: "该笔记库中没有任何笔记，是否新建一个？",
            sureBtnName: "现在创建",
            cancelBtnName: "以后再说",
            sureCallbackFunc: () => this.navbarNewNoteBtn.click()
        });
    }

    loadNotes(notes) {
        if (!notes) {
            return
        }

        let uuids = [];
        for (const [uuid, note] of Object.entries(notes)) {
            let noteObj = new Note(note);
            this.notes[uuid] = noteObj;
            if (noteObj.autoOpen) uuids.push(uuid);
        }

        this.isLoaded = true;
        this.displayNotes = this.notes;
        this.#showLockIcon();
        this.#enableButtons();

        if (this.#isNullRepo()) {
            this.#promptCreateNote();
            return;
        }

        if (GlobalConfig.rememberNoteOpenStatus && uuids.length > 0) GlobalNoteOpener.openInGroup(uuids);
    }

    // 重置笔记库
    reinitialize() {
        this.#initialize();
        PyNoteRepo.reinitialize();
        clearPwdInput();
        this.#showUnlockIcon();
        this.#disableButtons();
    }

    #matchNotes() {
        let keyword = this.searchNotesInput.value;
        if (!keyword) {
            this.displayNotes = this.notes;
            return;
        }

        let matchedNotes = {};
        let matchRep = new RegExp(keyword, "i");

        for (let [uuid, note] of Object.entries(this.notes)) {
            if (matchRep.test(note.title) || matchRep.test(note.description)) {
                matchedNotes[uuid] = note;
            }
        }

        this.displayNotes = matchedNotes;
    }

    getNoteByUUID(uuid) {
        return this.notes[uuid];
    }

    refreshNotes() {
        if (!this.isLoaded) {
            return;
        }

        // 触发重新排序
        this.displayNotes = this.displayNotes;
    }

    static #getSelectedNotes() {
        let selectedNoteCheckboxes = document.querySelectorAll('.note-checkbox:checked');
        let uuids = [];
        for (const checkbox of selectedNoteCheckboxes) {
            let uuid = checkbox.id.replace("checkbox-", "");
            uuids.push(uuid);
        }

        return uuids;
    }

    static #cancelSelectedNotes() {
        let selectedNoteCheckboxes = document.querySelectorAll('.note-checkbox:checked');
        if (selectedNoteCheckboxes.length === 0) {
            warnNotify("未选择任何笔记！");
            return;
        }

        for (const checkbox of selectedNoteCheckboxes) {
            checkbox.checked = false;
        }
    }

    #newNote() {
        let _this = this;
        PyNoteRepo.new_note()
            .then(receiveResponse)
            .then(data => {
                _this.notes[data["uuid"]] = new Note(data["note"]);
                _this.displayNotes = _this.notes;
                GlobalNoteOpener.open(data["uuid"]);
            });
    }

    #deleteNotes() {
        let uuids = NoteRepo.#getSelectedNotes();
        if (uuids.length === 0) {
            errorNotify("至少选择删除一条笔记！");
            return;
        }

        let _this = this;
        popupConfirm({
            message: `确定删除选择的 ${uuids.length} 条笔记吗？`,
            sureCallbackFunc: () => {
                PyNoteRepo.delete_notes(uuids)
                    .then(receiveResponse)
                    .then(data => {
                        let uuids = data["uuids"];
                        for (const uuid of uuids) {
                            delete _this.notes[uuid];
                        }
                        _this.displayNotes = _this.notes;
                        successNotify(`删除 ${uuids.length} 条笔记`)
                    });
            }
        });
    }

    #copyNotes() {
        let uuids = NoteRepo.#getSelectedNotes();
        if (uuids.length === 0) {
            errorNotify("至少选择一条笔记创建副本！");
            return;
        }

        let _this = this;
        PyNoteRepo.copy_notes(uuids)
            .then(receiveResponse)
            .then(data => {
                let notes = data["notes"];
                for (const [uuid, note] of Object.entries(notes)) {
                    _this.notes[uuid] = new Note(note);
                }

                _this.displayNotes = _this.notes;
                successNotify(`成功创建 ${Object.keys(notes).length} 条笔记副本`);
            });
    }

    #pinNotes() {
        let uuids = NoteRepo.#getSelectedNotes();
        if (uuids.length === 0) {
            errorNotify("至少选择一条笔记进行置顶！");
            return;
        }

        let _this = this;
        PyNoteRepo.pin_notes(uuids, "add")
            .then(receiveResponse)
            .then(data => {
                let notes = data["notes"];
                for (const [uuid, note] of Object.entries(notes)) {
                    _this.notes[uuid] = new Note(note);
                }
                _this.displayNotes = _this.notes;
            });
    }

    #cancelPinNotes() {
        let uuids = NoteRepo.#getSelectedNotes();
        if (uuids.length === 0) {
            errorNotify("至少选择一条笔记取消置顶！");
            return;
        }

        let _this = this;
        PyNoteRepo.pin_notes(uuids, "remove")
            .then(receiveResponse)
            .then(data => {
                let notes = data["notes"];
                for (const [uuid, note] of Object.entries(notes)) {
                    _this.notes[uuid] = new Note(note);
                }
                _this.displayNotes = _this.notes;
            });
    }

    static #openInGroup() {
        let uuids = NoteRepo.#getSelectedNotes();
        if (uuids.length === 0) {
            errorNotify("至少选择一条笔记分组打开！");
            return;
        }

        if (uuids.length > 3) {
            errorNotify("最多选择三条笔记分组打开！");
            return;
        }

        GlobalNoteOpener.openInGroup(uuids);
    }

    #changeRepoPwd() {
        let newRepoPwd = this.changeRepoPwdInput.value;
        let newRepoRepeatPwd = this.changeRepoRepeatPwdInput.value;

        if (newRepoRepeatPwd !== newRepoPwd) {
            errorNotify("两次设置的密钥不同！");
            return;
        }

        let _this = this;
        PyNoteRepo.change_repo_pwd(newRepoPwd)
            .then(receiveResponse)
            .then(() => {
                successNotify("更换密钥成功");
                _this.#hideChangePwdModal();
                clearPwdInput();
            });
    }

    static #recordOpenedNotes() {
        let uuids;
        if (GlobalNoteOpener.uuidGroup.length > 0) {
            uuids = GlobalNoteOpener.uuidGroup;
        } else if (GlobalNoteOpener.uuid) {
            uuids = [GlobalNoteOpener.uuid];
        } else {
            uuids = [];
        }

        PyNoteRepo.record_opened_notes(uuids).then(receiveResponse);
    }

    // 锁定无需二次确认
    lockNoteRepo() {
        if (!this.isLoaded) {
            return;
        }

        if (GlobalConfig.rememberNoteOpenStatus) NoteRepo.#recordOpenedNotes();
        GlobalNoteOpener.closeForLockRepo();
        this.reinitialize();
    }
}
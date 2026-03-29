async function waitAllReady() {
    // 等待 pywebview 对象可用
    const pywebviewReady = new Promise((resolve) => {
        if (window.pywebview) {
            resolve(); // 如果已经注入，直接 resolve
        } else {
            window.addEventListener("pywebviewready", resolve);
        }
    });

    // 等待页面加载完成
    const windowLoaded = new Promise((resolve) => {
        if (document.readyState === "complete") {
            resolve(); // 如果已经加载完成，直接 resolve
        } else {
            window.addEventListener("load", resolve);
        }
    });

    // 同时等待两个事件
    await Promise.all([pywebviewReady, windowLoaded]);
}

// 初始化 Tooltip，否则不会正常显示
function initTooltip() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
        .forEach(ele => new bootstrap.Tooltip(ele));
}

async function initializeEnvironment() {
    window.GlobalHelper = new Helper();
    window.GlobalConfig = new Configure();
    await GlobalHelper.load();
    await GlobalConfig.load();

    // pywebview 暴露的接口
    window.PyNoteRepo = pywebview.api.note_repo;

    window.GlobalNoteCardOperator = new NoteCardOperator();
    window.GlobalNoteRepo = new NoteRepo();
    window.GlobalNoteOpener = new NoteOpener();
    window.GlobalNoteRepoSetter = new NoteRepoSetter();
    window.GlobalNoteRepoCreator = new NoteRepoCreator();

    window.GlobalLockTimer = null;
    window.GlobalLockNotifyTimer = null;
    window.GlobalExitTimer = null;
    window.GlobalExitNotifyTimer = null;
    window.GlobalSafeNote = new SafeNote();

    initTooltip();
}
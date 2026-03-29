function resetLockTimer() {
    // 如果已经锁定，则无需再设置计时器
    if (!GlobalNoteRepo.isLoaded) {
        return;
    }

    clearTimeout(GlobalLockNotifyTimer);
    clearTimeout(GlobalLockTimer);
    // 提前五秒进行提醒
    window.GlobalLockNotifyTimer = setTimeout(function () {
        autoNotify("长时间无操作，将于 5 秒后锁定笔记库！");
    }, (GlobalConfig.autoLockTimeout - 5) * 1000);
    // 锁定
    window.GlobalLockTimer = setTimeout(() => {
        GlobalNoteRepo.lockNoteRepo();
        GlobalNoteRepoSetter.showModal();
    }, GlobalConfig.autoLockTimeout * 1000);
}

function resetExitTimer() {
    clearTimeout(GlobalExitNotifyTimer);
    clearTimeout(GlobalExitTimer);
    // 提前五秒进行提醒
    window.GlobalExitNotifyTimer = setTimeout(function () {
        autoNotify("长时间无操作，将于 5 秒后退出程序！");
    }, (GlobalConfig.autoExitTimeout - 5) * 1000);
    // 退出
    window.GlobalExitTimer = setTimeout(GlobalSafeNote.exit, GlobalConfig.autoExitTimeout * 1000);
}

class SafeNote {
    constructor() {
        this.activityEvents = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];
        this.#getInitElements();
        this.#setListeners();
    }

    #getInitElements() {
        this.navbar = document.getElementById("navbar");
        this.exitSafeNotes = document.getElementById("exitSafeNotes");
    }

    #setListeners() {
        // 双击导航栏返回顶部
        this.navbar.addEventListener("dblclick", () => SafeNote.#scrollToTop());
        this.exitSafeNotes.addEventListener("click", () => this.exit());

        // 监听用户活动，长时间不操作自动锁定退出
        this.activityEvents.forEach(e => {
            window.addEventListener(e, resetLockTimer, false);
            window.addEventListener(e, resetExitTimer, false);
        });
    }

    static #scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    start() {
        if (GlobalConfig.hasNoteRepoHis()) {
            GlobalNoteRepoSetter.showModal();
            return;
        }

        popupConfirm({
            message: "还没有打开过任何笔记库，你可以选择打开或新建一个笔记库。",
            sureBtnName: "打开笔记库",
            cancelBtnName: "创建笔记库",
            sureCallbackFunc: function () {
                GlobalNoteRepoSetter.showModal();
            },
            cancelCallbackFunc: function () {
                GlobalNoteRepoCreator.showModal();
            }
        });
    }

    exit() {
        // 退出无需二次确认
        pywebview.api.close_window();
    }
}
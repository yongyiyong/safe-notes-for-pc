function popupAlert(params) {
    let type = params.type || "danger";
    let message = params.message;

    let alertModalContent = document.getElementById("alertModalContent");
    alertModalContent.innerHTML = `<div class="alert alert-${type} alert-dismissible m-0" role="alert">\n` +
        `                <div>${message}</div>\n` +
        '                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>\n' +
        '            </div>';

    let alertModal = new bootstrap.Modal(document.getElementById("alertModal"));
    alertModal.show();
}

function popupConfirm(params) {
    let confirmModalContent = document.getElementById("confirmModalContent");
    let sureBtn = document.getElementById("confirmModalSureBtn");
    let cancelBtn = document.getElementById("confirmModalCancelBtn");
    let confirmModal = document.getElementById("confirmModal");

    if (confirmModal.classList.contains("show")) return;

    sureBtn.innerText = params.sureBtnName || "确定";
    cancelBtn.innerText = params.cancelBtnName || "取消";
    sureBtn.onclick = params.sureCallbackFunc || function () {
    };
    cancelBtn.onclick = params.cancelCallbackFunc || function () {
    };

    confirmModalContent.innerHTML = `<h6>${params.message}</h6>`;
    confirmModal = new bootstrap.Modal(confirmModal);
    confirmModal.show();
}

function notify(params) {
    let liveToast = document.getElementById("liveToast");
    let liveToastContent = document.getElementById("liveToastContent");

    let liveToastDelay = 1000;
    if (params.delay) liveToastDelay = params.delay;
    let type = params.type || "secondary";
    let bgClass = `bg-${type}-subtle`;

    liveToast.setAttribute("data-bs-delay", String(liveToastDelay));
    liveToast.className = `toast align-items-center ${bgClass}`;
    liveToastContent.innerText = params.message;
    let toast = new bootstrap.Toast(liveToast);
    toast.show()
}

function successNotify(message) {
    notify({type: "success", message: message});
}

function warnNotify(message) {
    notify({type: "warning", message: message});
}

function errorNotify(message) {
    notify({delay: 1500, type: "danger", message: message});
}

function autoNotify(message) {
    notify({delay: 3000, type: "warning", message: message});
}

function getCurrentTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function clearPwdInput() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    passwordInputs.forEach(input => {
        input.value = '';
    });
}

function copyText(text) {
    const input = document.createElement("input");
    input.value = text;
    input.style.position = "absolute";
    input.style.left = "-9999px";
    document.body.appendChild(input);

    // 选择文本
    input.select();
    input.setSelectionRange(0, input.value.length);

    try {
        document.execCommand("copy");
        successNotify("复制成功");
    } catch (err) {
        errorNotify("复制失败");
    }

    // 移除临时元素
    document.body.removeChild(input);
}

function receiveResponse(response) {
    if (!response.status) {
        errorNotify(response.message);
        return Promise.reject();
    }

    return response.data;
}
// 阻止可能的网络请求，避免泄露笔记数据
(function () {
    function report(url, type) {
        console.warn("[NETWORK DETECTED]", type, url)
    }

    // ---- Hook fetch ----
    const _fetch = window.fetch;
    window.fetch = function () {
        let url = arguments[0];
        report(url, "fetch");
        return _fetch.apply(this, arguments);
    };

    // ---- Hook XHR ----
    const _open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        report(url, "xhr");
        return _open.apply(this, arguments);
    };

    // ---- Hook WebSocket ----
    const _ws = window.WebSocket;
    window.WebSocket = function (url) {
        report(url, "websocket");
        return new _ws(url);
    };

    // ---- Hook sendBeacon ----
    const _beacon = navigator.sendBeacon;
    navigator.sendBeacon = function (url) {
        report(url, "beacon");
        return _beacon.apply(this, arguments);
    };

    // ---- Monitor <img> / <script> / <link> / iframe ----
    function hookElement(tag) {
        if (!tag) return;
        const proto = tag.prototype;
        const _setAttribute = proto.setAttribute;
        proto.setAttribute = function (name, value) {
            if (["src", "href"].includes(name.toLowerCase())) {
                if (typeof value === "string" && value.startsWith("http")) {
                    report(value, tag.name);
                }
            }
            return _setAttribute.call(this, name, value);
        };

        // Also hook direct property assignment (e.g. img.src = ...)
        const watchedProps = ["src", "href"];
        for (let prop of watchedProps) {
            let desc = Object.getOwnPropertyDescriptor(proto, prop);
            if (desc && desc.set) {
                Object.defineProperty(proto, prop, {
                    set(value) {
                        if (typeof value === "string" && value.startsWith("http")) {
                            report(value, tag.name + "_prop");
                        }
                        return desc.set.call(this, value);
                    },
                    get: desc.get
                });
            }
        }
    }

    hookElement(window.HTMLImageElement);
    hookElement(window.HTMLScriptElement);
    hookElement(window.HTMLLinkElement);
    hookElement(window.HTMLIFrameElement);

    // ---- Monitor dynamic DOM additions ----
    const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.tagName) {
                    const tag = node.tagName.toLowerCase();
                    const url = node.src || node.href;
                    if (url && url.startsWith("http")) {
                        report(url, tag + "_added");
                    }
                }
            }
        }
    });

    observer.observe(document, {childList: true, subtree: true});

    console.log("Network hook installed");
})();
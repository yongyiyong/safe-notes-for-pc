// 只允许 Markdown 生成的标签
const allowedTags = [
    // 标题
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // 段落和内联元素
    'p', 'br', 'span', 'strong', 'em', 'b', 'i', 'u',
    // 列表
    'ul', 'ol', 'li',
    // 链接和图片
    // 'a', 'img',
    // 代码
    'pre', 'code', 'blockquote',
    // 表格
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // 分割线
    'hr',
    // 自定义标签，智能拷贝（smart copy）
    'sc'
];
const allowedAttributes = {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
    '*': ['class', 'id']  // 允许所有标签的 class 和 id
};
const sanitizeConfig = {
    KEEP_CONTENT: true,
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    ALLOW_DATA_ATTR: false,  // 不允许 data-* 属性
    ALLOW_UNKNOWN_PROTOCOLS: false,   // 不允许未知协议
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick']  // 禁止事件属性
};

const renderer = new marked.Renderer();
// 安全起见，禁止网络连接，所以不允许出现跳转行为
// 通过重写链接渲染方法，直接返回原始文本，不渲染链接
renderer.link = function (href) {
    return href.text;
};
// 使用自定义渲染器
marked.setOptions({
    renderer: renderer,
});

// 通过钩子对不允许的标签，保留原始字符串（不渲染为HTML）
DOMPurify.addHook('beforeSanitizeElements', function (node, data, config) {
    const tagName = node.nodeName.toLowerCase();

    // 如果是不允许的标签，将其转换为文本节点
    if (node.nodeType === 1 && !allowedTags.includes(tagName)) {
        // 获取完整的原始HTML
        const originalHtml = node.outerHTML;
        // 创建文本节点
        const textNode = document.createTextNode(originalHtml);

        // 替换节点
        if (node.parentNode) {
            node.parentNode.replaceChild(textNode, node);
            // 返回null表示已处理
            return null;
        }
    }

    return node;
});

// 清理 Markdown 文本中的 HTML 元素，避免出现网络请求
function safeMarkedParse(text) {
    return DOMPurify.sanitize(marked.parse(text), sanitizeConfig);
}

function sanitizeText(text) {
    return DOMPurify.sanitize(text, sanitizeConfig);
}
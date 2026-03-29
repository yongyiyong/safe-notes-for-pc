# -*- coding:utf-8 -*-

import re
import os
import sys
import webview
from lib.js_api import JSApi
from lib.const import SafeNote, PlaceholderType


def has_webview2():
    paths = [
        r"C:\Program Files (x86)\Microsoft\EdgeWebView\Application",
        r"C:\Program Files\Microsoft\EdgeWebView\Application",
    ]
    return any(os.path.exists(p) for p in paths)


def resource_path(relative_path):
    """
    处理 PyInstaller 打包后找不到内部文件的问题
    """
    if hasattr(sys, "_MEIPASS"):
        return os.path.join(sys._MEIPASS, relative_path)

    return os.path.join(os.path.abspath("."), relative_path)


class Placeholder(object):

    def __init__(self, ph_string):
        self._parse_ph_pattern = re.compile(r"(?:<!--|/\*)\s*PLACEHOLDER:\s*(\w+)\s+([a-zA-Z0-9._-]+)\s*(?:-->|\*/)")
        self.file_type, self.filename = re.match(self._parse_ph_pattern, ph_string).groups()
        self.keyword = ph_string

    def is_html(self):
        return self.file_type == PlaceholderType.HTML

    def is_css(self):
        return self.file_type == PlaceholderType.CSS

    def is_svg(self):
        return self.file_type == PlaceholderType.SVG

    def is_js(self):
        return self.file_type == PlaceholderType.JS


class HTMLLoader(object):

    def __init__(self):
        self.no_webview2_html = resource_path("static/no-webview2.html")

        self.main_html = resource_path("static/main.html")
        self.main_html_content = ""

        self.css_dir = resource_path("static/css")
        self.js_dir = resource_path("static/js")
        self.svg_dir = resource_path("static/svg")
        self.html_dir = resource_path("static/html")

        # 匹配占位符的正则表达式
        # 示例：
        #     <!-- PLACEHOLDER: html main.html -->
        #     <!-- PLACEHOLDER: svg bi-info-circle.svg -->
        #     /* PLACEHOLDER: css bootstrap.min.css */
        #     /* PLACEHOLDER: js marked.min.js */
        self.ph_pattern = re.compile(r"(?:<!--|/\*)\s*PLACEHOLDER:\s*\w+\s+[a-zA-Z0-9._-]+\s*(?:-->|\*/)")
        self.placeholders = []

    @classmethod
    def load_file_content(cls, file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        return "".join(lines)

    def find_placeholders(self):
        placeholders = re.findall(self.ph_pattern, self.main_html_content)
        self.placeholders = [Placeholder(ph) for ph in placeholders]

    def is_placeholder_exists(self):
        return len(self.placeholders) > 0

    # 通过替换占位符的方式实现自己组装页面
    def replace_placeholders(self):
        for ph in self.placeholders:
            if ph.is_svg():
                file_path = f"{self.svg_dir}/{ph.filename}"
                comment_prefix = "<!-- "
                comment_suffix = " -->"
            elif ph.is_html():
                file_path = f"{self.html_dir}/{ph.filename}"
                comment_prefix = "<!-- "
                comment_suffix = " -->"
            elif ph.is_js():
                file_path = f"{self.js_dir}/{ph.filename}"
                comment_prefix = "/* "
                comment_suffix = " */"
            elif ph.is_css():
                file_path = f"{self.css_dir}/{ph.filename}"
                comment_prefix = "/* "
                comment_suffix = " */"
            else:
                continue

            if os.path.exists(file_path):
                ph_content = self.load_file_content(file_path)
            else:
                ph_content = f"{comment_prefix} PLACEHOLDER ERROR: cannot load {self.css_dir}/{ph.filename} {comment_suffix}"

            # 使用 re.sub 替换时必须使用一个函数，否则会把新字符串中的特殊字符当作元字符处理
            def replacer(match):
                return ph_content

            # re.escape 将 pattern 当作纯字符串
            self.main_html_content = re.sub(re.escape(ph.keyword), replacer, self.main_html_content)

    def generate_html(self):
        if not has_webview2():
            return self.load_file_content(self.no_webview2_html)

        self.main_html_content = self.load_file_content(self.main_html)
        # 用循环处理占位符嵌套问题（占位符内容中还包含占位符，例如 HTML 中包含 SVG）
        while True:
            self.find_placeholders()
            if not self.is_placeholder_exists():
                break
            self.replace_placeholders()

        return self.main_html_content


if __name__ == "__main__":
    html_loader = HTMLLoader()
    js_api = JSApi()
    window = webview.create_window(
        SafeNote.APP_NAME,
        html=html_loader.generate_html(),
        js_api=js_api,
        width=1400,
        height=850
    )
    js_api.set_window_obj(window)

    # 启动时使用 --debug 选项，打开 WebView 控制台，方便 DEBUG
    if len(sys.argv) > 1 and sys.argv[1] == "--debug":
        webview.start(debug=True, http_server=False)
    else:
        webview.start(debug=False, http_server=False)

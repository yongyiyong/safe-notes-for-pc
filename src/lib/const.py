# -*- coding:utf-8 -*-


class SafeNote(object):
    APP_NAME = "Safe Notes For PC"


class PlaceholderType(object):
    HTML = "html"
    CSS = "css"
    SVG = "svg"
    JS = "js"


class NoteName(object):
    NEW = "未命名笔记"
    SUFFIX_COPY = " - 副本"
    SUFFIX_BACKUP = " - 未保存"


class Configure(object):
    # 放在用户家目录中
    USER_CONF_FILE = "~/.snconfig.json"
    DEFAULT = {
        "auto_exit_timeout": 300,
        "auto_lock_timeout": 120,
        "default_note_view": "real-time",
        "note_sort_order": "time-desc",
        "last_note_repo": "",
        "preview_note_content": False,
        "auto_save_note": True,
        "open_repo_with_readonly": False,
        "remember_note_open_status": True,
        "pinned_notes": {},
        "last_opened_notes": {}
    }

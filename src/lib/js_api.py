# -*- coding:utf-8 -*-

from lib.help import Helper
from lib.note import NoteRepo
from lib.config import SNConfig


class JSApi(object):

    def __init__(self):
        self._window = None

        self.helper = Helper()
        self.sn_config = SNConfig()
        self.note_repo = NoteRepo(sn_config=self.sn_config)

    # 各个子对象中可能会用到 window 对象
    # 所以提供该方法，以供 window 对象创建后传入
    def set_window_obj(self, window):
        self._window = window
        self.note_repo.set_window_obj(window)

    def close_window(self):
        if not self._window:
            return

        self._window.destroy()

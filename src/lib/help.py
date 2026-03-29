# -*- coding:utf-8 -*-

import os
import sys


def resource_path(relative_path):
    """
    处理 PyInstaller 打包后找不到内部文件的问题
    """
    if hasattr(sys, "_MEIPASS"):
        return os.path.join(sys._MEIPASS, relative_path)

    return os.path.join(os.path.abspath("."), relative_path)


class Helper(object):

    def __init__(self):
        self._help_dir = resource_path("help")
        self._version_file = f"{self._help_dir}/version.md"
        self._about_file = f"{self._help_dir}/about.md"
        self._manual_file = f"{self._help_dir}/manual.md"

    @classmethod
    def _read_file(cls, file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.readlines()

        return content

    def version(self):
        return self._read_file(self._version_file)

    def about(self):
        return self._read_file(self._about_file)

    def manual(self):
        return self._read_file(self._manual_file)

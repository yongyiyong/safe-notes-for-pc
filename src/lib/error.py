# -*- coding:utf-8 -*-


class NoteRepoError(Exception):

    def __init__(self, message):
        self.message = message

    def __str__(self):
        return self.message


class NotNoteRepoError(NoteRepoError):

    def __init__(self):
        super(NotNoteRepoError, self).__init__("该文件不是笔记库文件！")


class RepoReadonlyError(NoteRepoError):

    def __init__(self):
        super(RepoReadonlyError, self).__init__("笔记库当前是只读的！")

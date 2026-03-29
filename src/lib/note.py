# -*- coding:utf-8 -*-

import os
import json
import uuid
import hashlib
import webview
from functools import wraps
from datetime import datetime
from lib.const import SafeNote, NoteName
from lib.aes_encryption import encrypt_aes, decrypt_aes
from lib.response import SuccessResponse, FailedResponse
from lib.error import NoteRepoError, NotNoteRepoError, RepoReadonlyError


def hash_with_sha256(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def repo_readonly_check(func):
    @wraps(func)
    def wrapper(self, *args, **kwargs):
        try:
            open_repo_with_readonly = self._sn_config.backend_get("open_repo_with_readonly")
            if open_repo_with_readonly:
                raise RepoReadonlyError()

            return func(self, *args, **kwargs)
        except RepoReadonlyError as ex:
            return FailedResponse(ex.message)

    return wrapper


class Note(object):

    def __init__(self, password, cipher_note=None, plain_note=None, touch_time=False):
        """不能同时传入 cipher_note 和 plain_note"""
        self._password = password

        self._cipher_title = None
        self._cipher_description = None
        self._plain_title = None
        self._plain_description = None
        self._time = None

        self._auto_open = False
        self._pinned = False

        if cipher_note:
            self._parse_cipher(**cipher_note)

        if plain_note:
            self._parse_plain(**plain_note)

        if touch_time:
            self._touch_time()

    def _touch_time(self):
        self._time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def _parse_cipher(self, title=None, description=None, time=None):
        if title is not None:
            self._cipher_title = title
            self._plain_title = decrypt_aes(title, self._password)

        if description is not None:
            self._cipher_description = description
            self._plain_description = decrypt_aes(description, self._password)

        if time is not None:
            self._time = time

    def _parse_plain(self, title=None, description=None, time=None):
        if title is not None:
            self._plain_title = title
            self._cipher_title = encrypt_aes(title, self._password)

        if description is not None:
            self._plain_description = description
            self._cipher_description = encrypt_aes(description, self._password)

        if time is not None:
            self._time = time

    @property
    def title(self):
        return self._plain_title

    @property
    def description(self):
        return self._plain_description

    @property
    def time(self):
        return self._time

    def set_auto_open(self):
        self._auto_open = True

    def set_pinned(self):
        self._pinned = True

    def unset_pinned(self):
        self._pinned = False

    def is_pinned(self):
        return self._pinned

    def change_pwd(self, password):
        self._password = password
        self._parse_plain(title=self._plain_title, description=self._plain_description)

    # 明文内容
    def update(self, title=None, description=None, time=None):
        self._parse_plain(title=title, description=description, time=time)

    def stringify_plain(self):
        return {"title": self._plain_title, "description": self._plain_description, "time": self._time,
                "auto_open": self._auto_open, "pinned": self._pinned}

    def stringify_cipher(self):
        return {"title": self._cipher_title, "description": self._cipher_description, "time": self._time}


class NoteRepo(object):

    def __init__(self, sn_config=None):
        self._sn_config = sn_config
        self._window = None

        # 如下属性在切换笔记库时需要重置
        self._repo_path = None
        self._password = None
        # 密码的 sha256sum 值
        self._record_handler_hash = None
        self._notes = {}
        # 未解密的笔记库内容缓存，避免重复读取笔记库文件
        self._content_cache = {}

    def reinitialize(self):
        self._repo_path = None
        self._password = None
        self._record_handler_hash = None
        self._notes = {}
        self._content_cache = {}
        self._reset_window_title()

    @property
    def _repo_hash(self):
        return hash_with_sha256(self._repo_path)

    def _get_last_repo(self):
        return self._sn_config.backend_get("last_note_repo")

    # 确认路径和密码正确之后将笔记库路径保存到配置文件中
    def _record_last_repo(self):
        self._sn_config.backend_save({"last_note_repo": self._repo_path})

    def _load_repo(self):
        last_opened_notes = self._sn_config.backend_get("last_opened_notes") or {}
        repo_last_opened_notes = last_opened_notes.get(self._repo_hash, [])

        pinned_notes = self._sn_config.backend_get("pinned_notes") or {}
        repo_pinned_notes = pinned_notes.get(self._repo_hash, [])

        record_handler_hash = self._content_cache.get("recordHandlerHash", None)
        self._record_handler_hash = record_handler_hash or self._gen_record_handler_hash(self._password)
        for record in self._content_cache["records"]:
            note_uuid = self._gen_note_uuid()
            note = Note(self._password, cipher_note=record)
            title_hash = hash_with_sha256(note.title)
            if title_hash in repo_pinned_notes:
                note.set_pinned()
            if title_hash in repo_last_opened_notes:
                note.set_auto_open()
            self._notes[note_uuid] = note

    def _dump_repo(self):
        repo_content = {
            "recordHandlerHash": self._record_handler_hash,
            "total": len(self._notes.keys()),
            "records": [note.stringify_cipher() for note in self._notes.values()]
        }

        with open(self._repo_path, "w", encoding="utf-8") as f:
            json.dump(repo_content, f)

    @classmethod
    def _gen_record_handler_hash(cls, password):
        return hash_with_sha256(password)

    @classmethod
    def _gen_note_uuid(cls):
        return str(uuid.uuid4()).replace("-", "")

    def _gen_new_note(self, title, description):
        note_uuid = self._gen_note_uuid()
        new_note = Note(self._password, plain_note={"title": title, "description": description}, touch_time=True)
        self._notes[note_uuid] = new_note

        return note_uuid, new_note

    def set_window_obj(self, window):
        self._window = window

    def _reset_window_title(self):
        title = SafeNote.APP_NAME
        if self._repo_path:
            repo_name = os.path.basename(self._repo_path.rstrip(".json"))
            title = f"{SafeNote.APP_NAME} - {repo_name}"

        self._window.title = title

    def select_note_repo(self):
        return SuccessResponse({"repo_path": self._window.create_file_dialog(webview.OPEN_DIALOG)})

    def select_note_repo_dir(self):
        return SuccessResponse({"repo_dir": self._window.create_file_dialog(webview.FOLDER_DIALOG)})

    @classmethod
    def _check_repo_path(cls, repo_path):
        if not repo_path:
            raise NoteRepoError("未正确选择笔记库文件！")

        if not os.path.exists(repo_path):
            raise NoteRepoError("选择的笔记库文件不存在！")

    @classmethod
    def _check_new_repo_path(cls, repo_path):
        repo_dir = os.path.dirname(repo_path)
        if not os.path.exists(repo_dir):
            raise NoteRepoError("选择的目录不存在！")

        # 避免覆盖已经存在的文件
        if os.path.exists(repo_path):
            raise NoteRepoError("笔记库命名冲突！")

    @classmethod
    def _check_repo_content(cls, repo_path):
        # 不是 json 文件则不是笔记库文件
        try:
            with open(repo_path, "r", encoding="utf-8") as f:
                content = json.load(f)
        except json.JSONDecodeError:
            raise NotNoteRepoError()

        # 不是字典则不是笔记库文件
        if not isinstance(content, dict):
            raise NotNoteRepoError()

        # 没有 records 属性则不是笔记库文件
        records = content.get("records", None)
        if not isinstance(records, list):
            raise NotNoteRepoError()

        # 笔记没有 time、title、description 属性则不是笔记库文件
        if len(records) > 1:
            first_note = records[0]
            required_attrs = ["time", "title", "description"]
            if not all([k in first_note for k in required_attrs]):
                raise NotNoteRepoError()

        return content

    def _check_note_pwd(self, password):
        if not password:
            raise NoteRepoError("未设置笔记库解密密钥！")

        input_handler_hash = self._gen_record_handler_hash(password)
        if input_handler_hash != self._content_cache["recordHandlerHash"]:
            raise NoteRepoError("笔记库解密密钥不正确！")

    def load_notes(self, repo_path, password):
        try:
            self._check_repo_path(repo_path)
            self._content_cache = self._check_repo_content(repo_path)
            self._check_note_pwd(password)

            self._repo_path = repo_path
            self._password = password
            self._record_last_repo()
            self._reset_window_title()
            self._load_repo()

            notes = {note_uuid: note.stringify_plain() for note_uuid, note in self._notes.items()}
            return SuccessResponse({"notes": notes})
        except NoteRepoError as ex:
            return FailedResponse(ex.message)

    @repo_readonly_check
    def save_note(self, note_uuid, title, description, time):
        note = self._notes[note_uuid]

        old_title_hash = hash_with_sha256(note.title)
        new_title_hash = hash_with_sha256(title)
        # 标题改变，更新置顶信息
        if new_title_hash != old_title_hash and note.is_pinned():
            pinned_notes = self._sn_config.backend_get("pinned_notes") or {}
            repo_pinned_notes = set(pinned_notes.get(self._repo_hash, []))
            repo_pinned_notes.remove(old_title_hash)
            repo_pinned_notes.add(new_title_hash)
            pinned_notes[self._repo_hash] = list(repo_pinned_notes)
            self._sn_config.backend_save({"pinned_notes": pinned_notes})

        note.update(title=title, description=description, time=time)
        self._dump_repo()

        return SuccessResponse()

    @repo_readonly_check
    def backup_note(self, title, description):
        self._gen_new_note(f"{title}{NoteName.SUFFIX_BACKUP}", description)
        self._dump_repo()

        return SuccessResponse()

    @repo_readonly_check
    def delete_notes(self, uuids):
        self._notes = {note_uuid: note for note_uuid, note in self._notes.items() if note_uuid not in uuids}
        self._dump_repo()

        return SuccessResponse({"uuids": uuids})

    @repo_readonly_check
    def new_note(self):
        note_uuid, note = self._gen_new_note(NoteName.NEW, "")
        self._dump_repo()

        return SuccessResponse({"uuid": note_uuid, "note": note.stringify_plain()})

    @repo_readonly_check
    def copy_notes(self, uuids):
        notes = {}
        for note_uuid in uuids:
            old_note = self._notes[note_uuid]
            new_uuid, new_note = self._gen_new_note(f"{old_note.title}{NoteName.SUFFIX_COPY}", old_note.description)
            notes[new_uuid] = new_note.stringify_plain()

        self._dump_repo()

        return SuccessResponse({"notes": notes})

    @repo_readonly_check
    def change_repo_pwd(self, password):
        self._password = password
        self._record_handler_hash = self._gen_record_handler_hash(self._password)
        for note in self._notes.values():
            note.change_pwd(self._password)
        self._dump_repo()

        return SuccessResponse()

    def create_note_repo(self, repo_path, password):
        # 保证后缀为 .json，并且不会产生多余的 .json 后缀
        repo_path = repo_path.rstrip(".json") + ".json"

        try:
            self._check_new_repo_path(repo_path)
            repo_content = {
                "recordHandlerHash": self._gen_record_handler_hash(password),
                "total": 0,
                "records": []
            }
            with open(repo_path, "w", encoding="utf-8") as f:
                json.dump(repo_content, f)

            self.reinitialize()
            response = self.load_notes(repo_path, password)
            response["data"]["repo_path"] = repo_path
            return response
        except NoteRepoError as ex:
            return FailedResponse(ex.message)

    def pin_notes(self, uuids, operate):
        pinned_notes = self._sn_config.backend_get("pinned_notes") or {}
        repo_pinned_notes = set(pinned_notes.get(self._repo_hash, []))

        notes = {}
        for note_uuid in uuids:
            note = self._notes[note_uuid]
            # 使用标题进行标记
            title_hash = hash_with_sha256(note.title)
            if operate == "add":
                note.set_pinned()
                repo_pinned_notes.add(title_hash)
            elif operate == "remove":
                note.unset_pinned()
                repo_pinned_notes.discard(title_hash)
            notes[note_uuid] = note.stringify_plain()

        pinned_notes[self._repo_hash] = list(repo_pinned_notes)
        self._sn_config.backend_save({"pinned_notes": pinned_notes})

        return SuccessResponse({"notes": notes})

    def record_opened_notes(self, uuids):
        last_opened_notes = self._sn_config.backend_get("last_opened_notes") or {}
        # 每次都重置为空
        repo_last_opened_notes = set()

        for note_uuid in uuids:
            note = self._notes[note_uuid]
            # 使用标题进行标记
            title_hash = hash_with_sha256(note.title)
            repo_last_opened_notes.add(title_hash)

        last_opened_notes[self._repo_hash] = list(repo_last_opened_notes)
        self._sn_config.backend_save({"last_opened_notes": last_opened_notes})

        return SuccessResponse()

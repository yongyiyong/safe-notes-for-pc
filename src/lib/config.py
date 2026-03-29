# -*- coding:utf-8 -*-

import os
import json
from lib.const import Configure


class SNConfig(object):

    def __init__(self):
        self._config_path = os.path.expanduser(Configure.USER_CONF_FILE)
        self._config = self._load()

    def _gen_default_conf(self):
        with open(self._config_path, "w", encoding="utf-8") as f:
            json.dump(Configure.DEFAULT, f, sort_keys=True, indent=2)

    def _load(self):
        if not os.path.exists(self._config_path):
            self._gen_default_conf()

        with open(self._config_path, "r", encoding="utf-8") as f:
            content = json.load(f)

        return content

    def _dump(self):
        with open(self._config_path, "w", encoding="utf-8") as f:
            json.dump(self._config, f, sort_keys=True, indent=2)

    def backend_save(self, config: dict):
        self._config.update(config)
        self._dump()

    def frontend_save(self, config: str):
        self._config.update(json.loads(config))
        self._dump()

    def backend_get(self, key):
        return self._config.get(key, "")

    def frontend_get(self):
        return self._config

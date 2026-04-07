# -*- mode: python ; coding: utf-8 -*-

import os
from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

hiddenimports = collect_submodules('webview')

a = Analysis(
    ['src/main.py'],
    pathex=[os.getcwd()],
    binaries=[],
    datas=[
        ('resources', 'resources'),
        ('src/static', 'static'),
        ('src/help', 'help'),
    ],
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,  # 保持默认值即可
    win_private_assemblies=False,  # 保持默认值即可
    cipher=block_cipher,  # 保持默认值即可
    noarchive=False,  # 保持默认值即可
)

pyz = PYZ(
    a.pure,
    a.zipped_data,
    cipher=block_cipher
)

# 打包成单文件
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    exclude_binaries=False,
    name='safe-notes-for-pc',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    icon='resources/icons/app.ico',
    console=False,  # GUI 程序必须 False
    disable_windowed_traceback=False,  # 程序出错时是否弹出错误信息
    target_arch=None,  # 打包目标平台，保持默认值即可
    codesign_identity=None,  # 仅 MacOS 中有效
    entitlements_file=None,  # 仅 MacOS 中有效
)

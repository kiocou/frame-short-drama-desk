# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for the Tauri bridge. Produces a self-contained
# tauri_bridge.exe (onedir) that bundles the Python interpreter and every pip
# dependency, so the Tauri installer does not require Python on the user's
# machine. lib.rs prefers this bundled exe over the system python fallback.

from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

a = Analysis(
    ['tauri_bridge.py'],
    pathex=['liushen'],
    binaries=[],
    datas=[
        ('1.py', '.'),
        ('app.py', '.'),
        ('desktop_downloads.py', '.'),
        ('desktop_state.py', '.'),
        ('liushen', 'liushen'),
        ('插件', '插件'),
        ('config.example.json', '.'),
        ('.env.example', '.'),
    ],
    hiddenimports=[
        # Third-party deps the bridge transitively needs.
        'requests',
        'bs4',
        'lxml',
        'lxml._elementpath',
        'Crypto.Cipher.AES',
        'Crypto.Util.Counter',
        'Crypto.Util.Padding',
        'gmssl',
        'gmssl.sm3',
        'betterproto',
        'betterproto.lib',
        # The signing module tree lives under liushen/flurl and is imported by
        # string/attribute at runtime, so collect every submodule explicitly.
        *collect_submodules('flurl'),
        'device_register',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'PIL', 'PyQt5', 'PySide2'],
    noarchive=False,
    optimize=0,
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='tauri_bridge',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=['ffmpeg.exe', 'ffprobe.exe'],
    name='tauri_bridge',
)

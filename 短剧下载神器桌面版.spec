# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['desktop_app.py'],
    pathex=[],
    binaries=[('ffmpeg.exe', '.')],
    datas=[('1.py', '.'), ('app.py', '.'), ('desktop_downloads.py', '.'), ('desktop_state.py', '.'), ('liushen', 'liushen'), ('插件', '插件'), ('static/assets', 'static/assets'), ('.env.example', '.')],
    hiddenimports=[
        'tkinter',
        'tkinter.ttk',
        'requests',
        'bs4',
        'lxml',
        'Crypto.Cipher.AES',
        'Crypto.Util.Counter',
        'Crypto.Util.Padding',
        'gmssl.sm3',
        'betterproto',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='短剧下载神器桌面版',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='static/assets/app_icon.ico',
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=['ffmpeg.exe', 'ffprobe.exe'],
    name='短剧下载神器桌面版',
)

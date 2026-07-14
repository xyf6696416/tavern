#!/usr/bin/env python3
"""
tavern_sync_gui.py  ---  SillyTavern 同步工具 Qt 图形界面

用法:
    python tavern_sync_gui.py
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from enum import Enum, auto
from pathlib import Path

from PySide6.QtCore import Qt, QTimer, QThread
from PySide6.QtGui import QAction, QColor, QFont, QTextCharFormat, QTextCursor
from PySide6.QtWidgets import (
    QApplication,
    QCheckBox,
    QComboBox,
    QDialog,
    QDialogButtonBox,
    QFormLayout,
    QGroupBox,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QMenu,
    QMessageBox,
    QPlainTextEdit,
    QProgressBar,
    QPushButton,
    QStatusBar,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

# 同级模块
from tavern_sync_config import ConfigManager
from tavern_sync_worker import PortCleaner, ProcessWorker

SCRIPT_DIR = Path(__file__).resolve().parent
CONFIG_PATH = SCRIPT_DIR / "tavern_sync.yaml"
NODE_SCRIPT = SCRIPT_DIR / "tavern_sync.mjs"

# SillyTavern 各类型存储目录
TAVERN_CHARACTERS_DIR = Path("E:/SillyTavern/data/default-user/characters")
TAVERN_PRESETS_DIR    = Path("E:/SillyTavern/data/default-user/OpenAI Settings")
TAVERN_WORLDBOOKS_DIR = Path("E:/SillyTavern/data/default-user/worlds")

# 后备: 如果默认路径不存在, 尝试常见路径
_FALLBACK_CHAR_DIRS = [
    Path("E:/SillyTavern/data/default-user/characters"),
    Path("E:/SillyTavern/data/user/characters"),
    Path.home() / "SillyTavern/data/default-user/characters",
]
_FALLBACK_PRESET_DIRS = [
    Path("E:/SillyTavern/data/default-user/OpenAI Settings"),
    Path("E:/SillyTavern/data/default-user/KoboldAI Settings"),
    Path("E:/SillyTavern/data/default-user/TextGen Settings"),
    Path("E:/SillyTavern/data/default-user/NovelAI Settings"),
    Path.home() / "SillyTavern/data/default-user/OpenAI Settings",
]
_FALLBACK_WORLD_DIRS = [
    Path("E:/SillyTavern/data/default-user/worlds"),
    Path.home() / "SillyTavern/data/default-user/worlds",
]

# 类型目录映射
TYPE_DIR_CONFIG_KEY = {
    "character": "characters_dir",
    "preset":    "presets_dir",
    "worldbook": "worlds_dir",
}
TYPE_DIR_DEFAULT = {
    "character": TAVERN_CHARACTERS_DIR,
    "preset":    TAVERN_PRESETS_DIR,
    "worldbook": TAVERN_WORLDBOOKS_DIR,
}
TYPE_FALLBACK_DIRS = {
    "character": _FALLBACK_CHAR_DIRS,
    "preset":    _FALLBACK_PRESET_DIRS,
    "worldbook": _FALLBACK_WORLD_DIRS,
}
TYPE_FILE_PATTERNS = {
    "character": (".png", ".json"),
    "preset":    (".json",),
    "worldbook": (".json",),
}
TYPE_SCAN_LABEL = {
    "character": "角色卡",
    "preset":    "预设",
    "worldbook": "世界书",
}

# 反向映射: 中文类型名 → 英文 key
TYPE_ZH_TO_EN = {v: k for k, v in TYPE_SCAN_LABEL.items()}

# 持久化配置 (存储用户自定义的各类型目录)
GUI_CONFIG_PATH = SCRIPT_DIR / "tavern_sync_gui.json"

# 日志文件 (环形缓冲, 最多保留 200 行)
LOG_FILE_PATH = SCRIPT_DIR / "tavern_sync_gui.log"
_MAX_LOG_LINES = 200
_log_buffer: list[str] = []


def _append_to_logfile(line: str):
    """将一行写入日志文件环形缓冲。"""
    global _log_buffer
    _log_buffer.append(line)
    if len(_log_buffer) > _MAX_LOG_LINES:
        _log_buffer = _log_buffer[-_MAX_LOG_LINES:]
    try:
        with open(LOG_FILE_PATH, "w", encoding="utf-8") as f:
            f.writelines(_log_buffer)
    except Exception:
        pass  # 写入失败不影响 GUI


def _load_gui_config() -> dict:
    """读取 GUI 持久化配置。"""
    if GUI_CONFIG_PATH.exists():
        import json as _j
        try:
            with open(GUI_CONFIG_PATH, "r", encoding="utf-8") as _f:
                return _j.load(_f)
        except Exception:
            return {}
    return {}


def _save_gui_config(key: str, value: str) -> None:
    """保存 GUI 配置项到 JSON 文件。"""
    import json as _j
    config = _load_gui_config()
    config[key] = value
    with open(GUI_CONFIG_PATH, "w", encoding="utf-8") as _f:
        _j.dump(config, _f, ensure_ascii=False, indent=2)


# ── 设计系统 ────────────────────────────────────────────────
# 色板: "羊皮纸工作台" 暖调浅色

C = {
    "bg_page":       "#f5f2eb",
    "bg_surface":    "#faf8f4",
    "bg_elevated":   "#efebe4",
    "bg_hover":      "#e6e1d8",
    "primary":       "#7a5a3e",
    "primary_light": "#8d6b4e",
    "amber":         "#bf8f5a",
    "amber_bright":  "#d4a373",
    "green":         "#4a7c59",
    "green_dim":     "#3d6b4b",
    "red":           "#b85450",
    "red_dim":       "#a34845",
    "text_primary":  "#2c2824",
    "text_secondary":"#756e68",
    "text_muted":    "#a69e96",
    "border":        "#dcd6ce",
    "border_focus":  "#bf8f5a",
    # 类型身份色
    "type_char":     "#7a5a3e",  # 角色卡 棕褐
    "type_world":    "#4a7c59",  # 世界书 墨绿
    "type_preset":   "#5a7aad",  # 预设 灰蓝
}

# 类型身份色映射 (英文 key → 色值)
TYPE_COLORS = {
    "character": C["type_char"],
    "worldbook": C["type_world"],
    "preset":    C["type_preset"],
}

# ── 类型 Badge HTML ─────────────────────────────────────────

def _type_badge_html(type_en: str) -> str:
    """生成带类型色点的 HTML Badge，用于详情面板。"""
    color = TYPE_COLORS.get(type_en, C["text_muted"])
    label = TYPE_SCAN_LABEL.get(type_en, type_en)
    return (
        f'<span style="color:{color}; font-weight:700; font-size:13px;">'
        f'●</span>'
        f'<span style="color:{C["text_secondary"]}; font-size:13px; '
        f'margin-left:4px;">{label}</span>'
    )

FONT_LABEL = '"Microsoft YaHei UI", "Segoe UI", "Noto Sans SC", sans-serif'
FONT_MONO  = '"Cascadia Code", "JetBrains Mono", "Consolas", monospace'

QSS_APP = f"""
    QMainWindow {{ background: {C['bg_page']}; }}
    QWidget {{ color: {C['text_primary']}; font-family: {FONT_LABEL}; }}

    QGroupBox {{
        font-size: 13px; font-weight: 600;
        border: 1px solid {C['border']}; border-radius: 8px;
        margin-top: 14px; padding: 18px 12px 12px;
        background: {C['bg_surface']};
    }}
    QGroupBox::title {{
        subcontrol-origin: margin; left: 14px; padding: 0 8px;
        color: {C['amber']};
    }}

    QPushButton {{
        background: {C['bg_elevated']}; border: 1px solid {C['border']};
        border-radius: 6px; padding: 7px 18px;
        font-size: 13px; color: {C['text_primary']};
    }}
    QPushButton:hover {{ background: {C['bg_hover']}; border-color: {C['text_muted']}; }}
    QPushButton:pressed {{ background: {C['bg_elevated']}; }}
    QPushButton:disabled {{ color: {C['text_muted']}; background: {C['bg_surface']}; }}

    QPushButton#btn_pull {{
        background: qlineargradient(x1:0,y1:0,x2:0,y2:1,
            stop:0 #2d7a4b, stop:1 #1e5a37);
        border-color: {C['green_dim']}; font-weight: 600;
        font-size: 14px; padding: 8px 28px; min-width: 100px;
    }}
    QPushButton#btn_pull:hover {{
        background: qlineargradient(x1:0,y1:0,x2:0,y2:1,
            stop:0 #3fb950, stop:1 #2ea043);
    }}
    QPushButton#btn_pull:disabled {{
        background: {C['bg_elevated']}; color: {C['text_muted']};
        border-color: {C['border']};
    }}

    QPushButton#btn_watch {{
        background: qlineargradient(x1:0,y1:0,x2:0,y2:1,
            stop:0 #b8860b, stop:1 #8b6914);
        border-color: {C['amber']}; font-weight: 600;
        font-size: 14px; padding: 8px 28px; min-width: 100px;
    }}
    QPushButton#btn_watch:hover {{
        background: qlineargradient(x1:0,y1:0,x2:0,y2:1,
            stop:0 {C['amber_bright']}, stop:1 {C['amber']});
    }}
    QPushButton#btn_watch:disabled {{
        background: {C['bg_elevated']}; color: {C['text_muted']};
        border-color: {C['border']};
    }}

    QComboBox {{
        background: {C['bg_elevated']}; border: 1px solid {C['border']};
        border-radius: 6px; padding: 6px 12px; font-size: 13px;
        min-height: 20px;
    }}
    QComboBox:hover {{ border-color: {C['text_muted']}; }}
    QComboBox::drop-down {{
        border: none; width: 28px;
        border-left: 1px solid {C['border']};
    }}
    QComboBox QAbstractItemView {{
        background: {C['bg_surface']}; border: 1px solid {C['border']};
        selection-background-color: {C['bg_hover']};
        outline: none;
    }}

    QTextEdit#txt_output {{
        background: {C['bg_elevated']}; color: {C['text_primary']};
        border: 1px solid {C['border']}; border-radius: 6px;
        font-family: {FONT_MONO}; font-size: 10pt;
        padding: 10px; selection-background-color: {C['amber']};
        selection-color: {C['bg_surface']};
    }}

    QCheckBox {{
        spacing: 6px; font-size: 13px;
    }}
    QCheckBox::indicator {{
        width: 16px; height: 16px; border-radius: 3px;
        border: 1px solid {C['border']}; background: {C['bg_elevated']};
    }}
    QCheckBox::indicator:checked {{
        background: {C['amber']}; border-color: {C['amber']};
    }}
    QCheckBox:disabled {{ color: {C['text_muted']}; }}

    QStatusBar {{
        background: {C['bg_surface']}; border-top: 1px solid {C['border']};
        font-size: 12px; color: {C['text_secondary']};
    }}

    QProgressBar {{
        background: {C['bg_elevated']}; border: 1px solid {C['border']};
        border-radius: 4px; height: 8px; text-align: center;
    }}
    QProgressBar::chunk {{
        background: qlineargradient(x1:0,y1:0,x2:1,y2:0,
            stop:0 {C['amber']}, stop:1 {C['amber_bright']});
        border-radius: 3px;
    }}

    QMenuBar {{
        background: {C['bg_surface']}; border-bottom: 1px solid {C['border']};
        padding: 2px 0; font-size: 13px;
    }}
    QMenuBar::item:selected {{ background: {C['bg_hover']}; }}
    QMenu {{
        background: {C['bg_surface']}; border: 1px solid {C['border']};
        padding: 4px 0; font-size: 13px;
    }}
    QMenu::item {{ padding: 6px 28px 6px 20px; }}
    QMenu::item:selected {{ background: {C['bg_hover']}; }}

    QLabel#title_label {{
        font-size: 15px; font-weight: 700; color: {C['amber']};
        padding: 0 4px;
    }}
    QLabel#status_icon {{
        font-size: 22px;
    }}
    QLabel#detail_value {{
        font-size: 13px; color: {C['text_primary']};
    }}
    QLabel#detail_label {{
        font-size: 12px; color: {C['text_secondary']}; font-weight: 500;
    }}

    QPushButton#btn_icon {{
        background: {C['bg_elevated']}; border: 1px solid {C['border']};
        border-radius: 6px; padding: 4px 4px; font-size: 16px;
        min-width: 32px; max-width: 38px; min-height: 30px;
        color: {C['text_secondary']};
    }}
    QPushButton#btn_icon:hover {{
        background: {C['bg_hover']}; border-color: {C['text_muted']};
        color: {C['text_primary']};
    }}
"""


# ── 状态机 ────────────────────────────────────────────────

class AppState(Enum):
    IDLE = auto()       # 空闲
    PULLING = auto()    # 拉取中
    WATCHING = auto()   # 监听中
    STOPPING = auto()   # 正在停止


# ── 主窗口 ────────────────────────────────────────────────

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("tavern_sync — 酒馆同步工具")
        self.resize(960, 720)
        self.setMinimumSize(720, 540)

        # 状态
        self._state: AppState = AppState.IDLE
        self._current_config: str | None = None
        self._force = True  # 默认启用强制模式（本地优先）
        self._debug = False

        # 类型过滤: 存储全部配置名 → 类型的映射
        self._all_config_types: dict[str, str] = {}

        # 子进程管理
        self._thread: QThread | None = None
        self._worker: ProcessWorker | None = None
        self._elapsed_timer: QTimer | None = None
        self._timeout_timer: QTimer | None = None
        self._start_time: float = 0.0
        self._is_watch_mode: bool = False

        # 组件
        self._config_mgr = ConfigManager(CONFIG_PATH, self)
        self._port_cleaner = PortCleaner()

        # 构建 UI
        self._build_ui()
        self._apply_stylesheet()
        self._connect_signals()
        self._update_ui_state()

        # 初始加载配置
        QTimer.singleShot(100, self._refresh_configs)

    # ── 日志快捷方法 ──────────────────────────────────

    def _log(self, msg: str, level: str = "INFO"):
        """输出带时间戳的日志（与 _append_output 同界面的封装）。"""
        self._append_output(msg, level)

    def _log_scan(self, msg: str):
        self._append_output(f"🔍 [扫描] {msg}", "INFO")

    def _log_find(self, msg: str):
        self._append_output(f"📁 [查找] {msg}", "INFO")

    def _log_cmp(self, msg: str):
        self._append_output(f"⚖️  [比对] {msg}", "DEBUG")

    def _log_pull(self, msg: str):
        self._append_output(f"⬇️  [拉取] {msg}", "INFO")

    def _log_watch(self, msg: str):
        self._append_output(f"👁️  [监听] {msg}", "INFO")

    def _log_debug(self, msg: str):
        self._append_output(f"🔧 [调试] {msg}", "DEBUG")

    def _log_warn(self, msg: str):
        self._append_output(f"⚠️  [警告] {msg}", "WARN")

    # ── UI 构建 ───────────────────────────────────────────

    def _build_ui(self):
        self._create_menu()
        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setSpacing(6)
        layout.setContentsMargins(12, 8, 12, 8)

        # ─ 标题栏 ─
        title_bar = QHBoxLayout()
        title_icon = QLabel("[|]")
        title_icon.setStyleSheet(f"font-size: 18px; color: {C['amber']}; padding-right: 2px; font-weight: bold;")
        title_bar.addWidget(title_icon)
        title_label = QLabel("tavern_sync")
        title_label.setObjectName("title_label")
        title_bar.addWidget(title_label)
        title_bar.addSpacing(8)
        sep = QLabel("|")
        sep.setStyleSheet(f"color: {C['text_muted']}; font-size: 13px;")
        title_bar.addWidget(sep)
        title_bar.addSpacing(8)
        subtitle = QLabel("SillyTavern 同步工具")  # 同步工具
        subtitle.setStyleSheet(f"color: {C['text_secondary']}; font-size: 12px;")
        title_bar.addWidget(subtitle)
        title_bar.addStretch()
        self._status_icon = QLabel("●")  # ●
        self._status_icon.setObjectName("status_icon")
        self._status_icon.setStyleSheet(f"color: {C['text_muted']}; font-size: 22px;")
        self._status_icon.setToolTip("就绪")  # 就绪
        title_bar.addWidget(self._status_icon)
        layout.addLayout(title_bar)

        # ─ 配置选择行 ─
        row_config = QHBoxLayout()
        row_config.setSpacing(8)
        lbl_cfg = QLabel("配置")  # 配置
        lbl_cfg.setObjectName("detail_label")
        row_config.addWidget(lbl_cfg)
        # 类型过滤器
        self._type_filter = QComboBox()
        self._type_filter.setMinimumWidth(100)
        self._type_filter.setToolTip("按类型过滤配置列表")
        self._type_filter.addItem("▼ 全部", None)  # 显示全部
        for en_type, label in TYPE_SCAN_LABEL.items():
            color = TYPE_COLORS.get(en_type, C["text_muted"])
            self._type_filter.addItem(f"● {label}", en_type)
        row_config.addWidget(self._type_filter)
        self._combo = QComboBox()
        self._combo.setMinimumWidth(240)
        row_config.addWidget(self._combo)
        self._btn_refresh = QPushButton("↻")
        self._btn_refresh.setObjectName("btn_icon")
        self._btn_refresh.setToolTip("重新加载配置文件 (Ctrl+R)")
        row_config.addWidget(self._btn_refresh)
        self._btn_scan = QPushButton("···")
        self._btn_scan.setObjectName("btn_icon")
        self._btn_scan.setToolTip("扫描酒馆内容, 发现新条目可加入配置")
        # 点击时弹出类型选择菜单
        self._scan_menu = QMenu(self)
        for en_type, label in TYPE_SCAN_LABEL.items():
            color = TYPE_COLORS.get(en_type, C["text_muted"])
            action = self._scan_menu.addAction(f"● {label}")
            action.setData(en_type)
            action.triggered.connect(lambda checked=False, t=en_type: self._scan_type(t))
        self._btn_scan.clicked.connect(self._show_scan_menu)
        row_config.addWidget(self._btn_scan)
        row_config.addStretch()
        layout.addLayout(row_config)

        # ─ 配置详情 ─
        self._detail_group = QGroupBox("当前配置")
        detail_form = QFormLayout(self._detail_group)
        detail_form.setSpacing(6)
        detail_form.setLabelAlignment(Qt.AlignRight | Qt.AlignVCenter)
        self._lbl_config_name = QLabel("-")
        self._lbl_config_name.setObjectName("detail_value")
        self._lbl_type = QLabel("-")
        self._lbl_type.setObjectName("detail_value")
        self._lbl_tavern = QLabel("-")
        self._lbl_tavern.setObjectName("detail_value")
        self._lbl_path = QLabel("-")
        self._lbl_path.setObjectName("detail_value")

        def _mk_label(text):
            lbl = QLabel(text)
            lbl.setObjectName("detail_label")
            return lbl

        detail_form.addRow(_mk_label("名称"), self._lbl_config_name)
        detail_form.addRow(_mk_label("类型"), self._lbl_type)
        detail_form.addRow(_mk_label("酒馆"), self._lbl_tavern)
        detail_form.addRow(_mk_label("路径"), self._lbl_path)
        layout.addWidget(self._detail_group)

        # ─ 操作栏 ─
        ops = QHBoxLayout()
        self._btn_pull = QPushButton("↓ 拉取")
        self._btn_pull.setObjectName("btn_pull")
        ops.addWidget(self._btn_pull)
        self._btn_watch = QPushButton("⟳ 实时同步")
        self._btn_watch.setObjectName("btn_watch")
        self._btn_watch.setToolTip("修改本地文件后自动推送到酒馆")
        ops.addWidget(self._btn_watch)
        ops.addSpacing(12)

        self._cb_force = QCheckBox("强制")
        self._cb_force.setToolTip("跳过条目差异检查（本地优先）")
        self._cb_force.setChecked(True)  # 默认开启
        ops.addWidget(self._cb_force)
        self._cb_debug = QCheckBox("调试")
        self._cb_debug.setToolTip("显示所有 Node.js 输出")
        ops.addWidget(self._cb_debug)
        ops.addStretch()

        self._btn_edit_cfg = QPushButton("编辑配置")
        ops.addWidget(self._btn_edit_cfg)
        layout.addLayout(ops)

        # ─ 操作日志 ─
        out_group = QGroupBox("操作日志")
        out_layout = QVBoxLayout(out_group)
        self._output = QTextEdit()
        self._output.setReadOnly(True)
        self._output.setObjectName("txt_output")
        self._output.setStyleSheet("""
            QTextEdit#txt_output {
                background-color: #1e272e;
                color: #d2dae2;
                border: 1px solid #485460;
                font-family: "Consolas", "Microsoft YaHei Mono", monospace;
                font-size: 10pt;
            }
        """)
        self._output.setLineWrapMode(QTextEdit.LineWrapMode.NoWrap)
        self._output.document().setMaximumBlockCount(5000)
        out_layout.addWidget(self._output)
        layout.addWidget(out_group, stretch=1)

        # ─ 状态栏 ─
        self._status_text = QLabel("就绪")
        self._progress = QProgressBar()
        self._progress.setMaximumWidth(200)
        self._progress.setMaximum(0)
        self._progress.hide()
        self._timer_label = QLabel("")
        sb = QStatusBar()
        sb.addWidget(self._status_text, 1)
        sb.addPermanentWidget(self._progress)
        sb.addPermanentWidget(self._timer_label)
        self.setStatusBar(sb)

    def _apply_stylesheet(self):
        self.setStyleSheet(QSS_APP)

    def _create_menu(self):
        mb = self.menuBar()

        fm = mb.addMenu("文件(&F)")
        act_refresh = QAction("刷新配置(&R)", self)
        act_refresh.setShortcut("Ctrl+R")
        act_refresh.triggered.connect(self._refresh_configs)
        fm.addAction(act_refresh)

        act_clean = QAction("清理端口(&C)", self)
        act_clean.setShortcut("Ctrl+Shift+C")
        act_clean.triggered.connect(self._clean_port)
        fm.addAction(act_clean)

        fm.addSeparator()
        act_exit = QAction("退出(&Q)", self)
        act_exit.setShortcut("Ctrl+Q")
        act_exit.triggered.connect(self.close)
        fm.addAction(act_exit)

        om = mb.addMenu("操作(&O)")
        act_pull = QAction("拉取(&P)", self)
        act_pull.setShortcut("Ctrl+Return")
        act_pull.triggered.connect(self._start_pull)
        om.addAction(act_pull)

        act_watch = QAction("监听(&W)", self)
        act_watch.setShortcut("Ctrl+W")
        act_watch.triggered.connect(self._toggle_watch)
        om.addAction(act_watch)

        act_stop = QAction("停止(&S)", self)
        act_stop.setShortcut("Ctrl+Shift+S")
        act_stop.triggered.connect(self._stop_process)
        om.addAction(act_stop)

        hm = mb.addMenu("帮助(&H)")
        act_about = QAction("关于 tavern_sync(&A)", self)
        act_about.triggered.connect(self._show_about)
        hm.addAction(act_about)

    # ── 信号连接 ──────────────────────────────────────────

    def _connect_signals(self):
        self._config_mgr.configLoaded.connect(self._on_config_loaded)
        self._config_mgr.errorOccurred.connect(self._show_error)
        self._type_filter.currentIndexChanged.connect(self._apply_type_filter)
        self._combo.currentIndexChanged.connect(self._on_config_selected)
        self._btn_refresh.clicked.connect(self._refresh_configs)
        # _btn_scan 使用 QMenu actions 触发 _scan_type，无需 click 信号
        self._btn_pull.clicked.connect(self._start_pull)
        self._btn_watch.clicked.connect(self._toggle_watch)
        self._cb_force.toggled.connect(lambda c: setattr(self, "_force", c))
        self._cb_debug.toggled.connect(lambda c: setattr(self, "_debug", c))
        self._btn_edit_cfg.clicked.connect(self._open_config_editor)

    # ── 配置管理 ──────────────────────────────────────────

    def _refresh_configs(self):
        self._log("重新加载配置...", "INFO")
        self._config_mgr.load()

    def _on_config_loaded(self, names: list[str]):
        # 构建全部配置的类型映射 (type 在 YAML 中是中文, 转成英文)
        self._all_config_types = {}
        for n in names:
            d = self._config_mgr.get_detail(n)
            if d:
                raw_type = d["type"]
                self._all_config_types[n] = TYPE_ZH_TO_EN.get(raw_type, raw_type)
        # 按类型分组统计
        counts: dict[str, int] = {}
        for en_t in self._all_config_types.values():
            counts[en_t] = counts.get(en_t, 0) + 1
        detail_parts = [f"{TYPE_SCAN_LABEL.get(k,k)}: {v}" for k, v in counts.items()]
        self._log(f"配置已加载: {len(names)} 个 [{', '.join(detail_parts)}]", "INFO")
        # 应用当前类型过滤
        self._apply_type_filter()

    def _apply_type_filter(self):
        """根据类型过滤下拉框中的配置列表。"""
        filter_type = self._type_filter.currentData()
        names = list(self._all_config_types.keys())
        if filter_type is not None:
            names = [n for n in names if self._all_config_types.get(n) == filter_type]
        self._log_debug(f"类型过滤: filter={filter_type or '全部'}, 展示 {len(names)}/{len(self._all_config_types)} 条")
        current = self._combo.currentText()
        self._combo.blockSignals(True)
        self._combo.clear()
        self._combo.addItems(names)
        # 尝试保持当前选中的配置
        if current in names:
            self._combo.setCurrentText(current)
        elif names:
            self._combo.setCurrentIndex(0)
        self._combo.blockSignals(False)
        if names:
            self._on_config_selected(self._combo.currentIndex())
        else:
            self._current_config = None
            self._lbl_config_name.setText("-")
            self._lbl_type.setText("-")
            self._lbl_tavern.setText("-")
            self._lbl_path.setText("-")

    def _on_config_selected(self, index: int):
        name = self._combo.currentText()
        if not name:
            return
        self._current_config = name
        detail = self._config_mgr.get_detail(name)
        if detail:
            self._lbl_config_name.setText(detail["config_name"])
            # detail['type'] 是中文, 转成英文用于色点渲染
            en_type = TYPE_ZH_TO_EN.get(detail["type"], detail["type"])
            self._lbl_type.setText(_type_badge_html(en_type))
            self._lbl_tavern.setText(detail["tavern_name"])
            fp = detail.get("file", "")
            self._lbl_path.setText(fp if fp else "-")
            self._log_debug(f"选中配置 \"{name}\" → tavern_name=\"{detail['tavern_name']}\", file=\"{fp}\"")

    # ── 操作: 拉取 ────────────────────────────────────────

    def _start_pull(self):
        if self._state != AppState.IDLE:
            self._log_debug("拉取被跳过: 当前状态不允许")
            return
        if not self._current_config or not self._combo.currentText():
            self._show_error("请先选择一个配置")
            return

        detail = self._config_mgr.get_detail(self._current_config)
        t_name = detail["tavern_name"] if detail else "(未知)"
        self._log_pull(f"开始拉取 \"{self._current_config}\" (酒馆名称: \"{t_name}\")")

        # 端口清理
        self._port_cleaner.cleanup()
        self._log_debug("端口 6620 已清理")

        cmd = ["node", str(NODE_SCRIPT), "pull", self._current_config]
        if self._force:
            cmd.append("-f")
            self._log_debug("强制模式已启用")

        self._log_debug(f"执行命令: {' '.join(cmd)}")
        self._is_watch_mode = False
        self._start_worker(cmd)

    # ── 操作: 监听 ────────────────────────────────────────

    def _toggle_watch(self):
        if self._state == AppState.IDLE:
            # 启动监听
            if not self._current_config or not self._combo.currentText():
                self._show_error("请先选择一个配置")
                return
            detail = self._config_mgr.get_detail(self._current_config)
            t_name = detail["tavern_name"] if detail else "(未知)"
            self._log_watch(f"开始实时监听 \"{self._current_config}\" (酒馆名称: \"{t_name}\")")
            self._port_cleaner.cleanup()
            self._log_debug("端口 6620 已清理")
            cmd = ["node", str(NODE_SCRIPT), "watch", self._current_config]
            if self._force:
                cmd.append("-f")
                self._log_debug("强制模式已启用")
            self._log_debug(f"执行命令: {' '.join(cmd)}")
            self._is_watch_mode = True
            self._start_worker(cmd)
        elif self._state == AppState.WATCHING:
            self._log_watch("用户手动停止监听")
            self._stop_process()

    # ── 工作线程管理 ──────────────────────────────────────

    def _start_worker(self, cmd: list[str]):
        # 清理旧线程
        self._cleanup_thread()

        # 创建 worker 和 thread
        self._worker = ProcessWorker(cmd, SCRIPT_DIR)
        self._thread = QThread(self)
        self._worker.moveToThread(self._thread)

        # 信号连接
        self._worker.outputLine.connect(self._on_output_line)
        self._worker.statusUpdate.connect(self._on_status_update)
        self._worker.processFinished.connect(self._on_process_finished)
        self._worker.errorOccurred.connect(self._show_error)
        self._thread.started.connect(self._worker.run)
        self._thread.finished.connect(self._thread.deleteLater)

        # 定时器
        self._start_time = time.monotonic()
        self._elapsed_timer = QTimer(self)
        self._elapsed_timer.timeout.connect(self._update_timer)
        self._elapsed_timer.start(1000)

        if not self._is_watch_mode:
            self._timeout_timer = QTimer(self)
            self._timeout_timer.setSingleShot(True)
            self._timeout_timer.timeout.connect(self._on_timeout)
            self._timeout_timer.start(300_000)
            self._log_debug("超时定时器已启动 (300s)")

        # 清空输出
        self._output.clear()

        # 更新状态
        self._state = AppState.PULLING if not self._is_watch_mode else AppState.WATCHING
        self._update_ui_state()
        self._progress.show()
        self._log_debug(f"工作线程已启动 (mode={'pull' if not self._is_watch_mode else 'watch'})")

        # 启动线程
        self._thread.start()

    def _stop_process(self):
        if self._worker:
            self._state = AppState.STOPPING
            self._update_ui_state()
            self._worker.stop()
            self._log_warn("正在停止...")

    def _cleanup_thread(self):
        if self._thread:
            if self._thread.isRunning():
                self._log_debug("正在关闭工作线程...")
                self._thread.quit()
                if not self._thread.wait(3000):
                    self._log_warn("线程未能正常结束, 强制终止")
            self._thread.deleteLater()
            self._thread = None
        self._worker = None
        if self._elapsed_timer:
            self._elapsed_timer.stop()
            self._elapsed_timer = None
        if self._timeout_timer:
            self._timeout_timer.stop()
            self._timeout_timer = None

    # ── 信号处理 ──────────────────────────────────────────

    def _on_output_line(self, text: str, level: str):
        if level == "DEBUG" and not self._debug:
            return  # 调试模式未开启时忽略 DEBUG 行
        self._append_output(text, level)

    def _on_status_update(self, key: str):
        self._log_debug(f"状态更新: {key}")
        if key == "connected":
            self._status_icon.setStyleSheet(f"color: {C['green']}; font-size: 22px;")
            self._status_icon.setToolTip("已连接到酒馆")
            self._status_text.setText("已连接到酒馆网页")
        elif key == "disconnected":
            self._status_icon.setStyleSheet(f"color: {C['red']}; font-size: 22px;")
            self._status_icon.setToolTip("连接已断开")
            self._status_text.setText("连接已断开")
        elif key == "server_started":
            self._status_text.setText("等待酒馆网页连接...")
        elif key == "pull_done":
            self._status_text.setText("拉取完成")
            self._log_pull("拉取操作完成")
        elif key == "init_done":
            self._status_text.setText("实时同步中...")
            self._log_watch("初始化完成, 开始监听文件变化")
        elif key == "push_success":
            self._status_text.setText("自动推送成功")
            self._log_watch("自动推送成功")
        elif key == "pull_failed":
            self._status_text.setText("拉取失败")
            self._status_icon.setStyleSheet(f"color: {C['red']}; font-size: 22px;")
            self._log_pull("拉取失败")

    def _on_process_finished(self, exit_code: int, success: bool, summary: str):
        self._cleanup_thread()

        if success:
            self._status_icon.setStyleSheet(f"color: {C['green']}; font-size: 22px;")
            elapsed = time.monotonic() - self._start_time
            self._append_output(f"操作成功完成 ({elapsed:.0f}s)", "OK")
        else:
            self._status_icon.setStyleSheet(f"color: {C['red']}; font-size: 22px;")
            self._append_output(f"操作失败: {summary}", "ERROR")

        elapsed = time.monotonic() - self._start_time
        self._timer_label.setText(f"{elapsed:.0f}s")
        self._log_debug(f"进程结束: exit_code={exit_code}, success={success}, 耗时={elapsed:.0f}s")

        self._state = AppState.IDLE
        self._update_ui_state()
        self._progress.hide()
        self._status_text.setText("就绪")

    def _on_timeout(self):
        self._append_output("拉取超时 (300s), 正在停止...", "ERROR")
        self._log_debug("触发超时处理")
        self._stop_process()

    def _update_timer(self):
        elapsed = time.monotonic() - self._start_time
        self._timer_label.setText(f"{elapsed:.0f}s")

    # ── 输出渲染 ──────────────────────────────────────────

    def _append_output(self, text: str, level: str = "INFO"):
        """输出一行到日志面板, 同时写入日志文件。"""
        ts = time.strftime("%H:%M:%S")
        log_line = f"{ts} [{level}] {text}\n"
        _append_to_logfile(log_line)

        colors = {
            "OK":    C.get("green", "#4a7c59"),
            "INFO":  C.get("primary", "#7a5a3e"),
            "WARN":  C.get("amber_bright", "#d4a373"),
            "ERROR": C.get("red", "#b85450"),
            "DEBUG": C.get("text_muted", "#a69e96"),
        }
        cursor = self._output.textCursor()
        cursor.movePosition(QTextCursor.MoveOperation.End)

        base_fmt = QTextCharFormat()
        base_fmt.setFontFamily("Cascadia Code, JetBrains Mono, Consolas, monospace")
        base_fmt.setFontPointSize(10)

        ts_fmt = QTextCharFormat(base_fmt)
        ts_fmt.setForeground(QColor(C["text_muted"]))
        cursor.insertText(f"{ts} ", ts_fmt)

        lvl_fmt = QTextCharFormat(base_fmt)
        lvl_fmt.setForeground(QColor(colors.get(level, C["text_secondary"])))
        if level in ("OK", "ERROR"):
            lvl_fmt.setFontWeight(70)
        cursor.insertText(f"[{level}] ", lvl_fmt)

        msg_fmt = QTextCharFormat(base_fmt)
        msg_fmt.setForeground(QColor({
            "OK": C["green"], "INFO": C["text_primary"],
            "WARN": C["amber_bright"], "ERROR": C["red"],
            "DEBUG": C["text_muted"],
        }.get(level, C["text_primary"])))
        cursor.insertText(f"{text}\n", msg_fmt)

        self._output.setTextCursor(cursor)
        self._output.ensureCursorVisible()

    # ── UI 状态更新 ───────────────────────────────────────

    def _update_ui_state(self):
        idle = self._state == AppState.IDLE
        pulling = self._state == AppState.PULLING
        watching = self._state == AppState.WATCHING

        self._btn_pull.setEnabled(idle)
        self._btn_watch.setText("停止实时同步" if watching else "实时同步")
        self._btn_watch.setEnabled(idle or watching)
        self._combo.setEnabled(idle)
        self._type_filter.setEnabled(idle)
        self._cb_force.setEnabled(idle)
        self._cb_debug.setEnabled(idle or pulling or watching)
        self._btn_edit_cfg.setEnabled(idle)
        self._btn_refresh.setEnabled(idle)
        self._btn_scan.setEnabled(idle)

        if idle:
            self._status_icon.setStyleSheet(f"color: {C['text_muted']}; font-size: 22px;")
            self._status_icon.setToolTip("就绪")
            self._status_text.setText("就绪")
            self._progress.hide()
            self._timer_label.setText("")

    # ── 端口清理 ──────────────────────────────────────────

    def _clean_port(self):
        self._port_cleaner.cleanup()
        self._log("端口 6620 已清理", "INFO")
        self._log_debug("调用 PortCleaner.cleanup() 完成")

    # ── 扫描 (角色卡/世界书/预设) ─────────────────────────

    def _show_scan_menu(self):
        """在扫描按钮下方弹出类型选择菜单。"""
        pos = self._btn_scan.mapToGlobal(
            self._btn_scan.rect().bottomLeft()
        )
        self._scan_menu.exec(pos)

    def _scan_type(self, type_en: str):
        """扫描 SillyTavern 指定类型的目录, 发现新条目可加入配置。"""
        label = TYPE_SCAN_LABEL.get(type_en, type_en)
        self._log_scan(f"开始扫描 {label}...")

        target_dir = self._find_dir_by_type(type_en)
        self._log_debug(f"扫描类型={type_en}, 目标目录={target_dir}")

        if not target_dir:
            # 目录不存在 → 让用户手动选择
            self._log_debug(f"未找到自动匹配的 {label} 目录")
            reply = QMessageBox.question(
                self, "目录未找到",
                f"未找到 SillyTavern {label}目录。\n"
                f"要手动选择{label}存放路径吗？\n\n"
                f"通常位于 SillyTavern 安装目录下的:\n"
                f"  data/default-user/{self._type_config_subdir(type_en)}",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
                QMessageBox.StandardButton.Yes,
            )
            if reply == QMessageBox.StandardButton.Yes:
                self._pick_dir_by_type(type_en)
            return

        self._log_find(f"使用目录: {target_dir}")

        found = self._list_type_files(target_dir, type_en)
        self._log_scan(f"在目录中发现 {len(found)} 个{label}文件")

        if not found:
            reply = QMessageBox.question(
                self, "扫描为空",
                f"在 {target_dir} 下未发现{label}文件。\n"
                f"要选择其他目录吗？",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
                QMessageBox.StandardButton.Yes,
            )
            if reply == QMessageBox.StandardButton.Yes:
                self._pick_dir_by_type(type_en)
            return

        self._process_scan_results(found, target_dir, type_en)

    @staticmethod
    def _type_config_subdir(type_en: str) -> str:
        """返回类型的默认子目录名。"""
        sub_map = {
            "character": "characters",
            "preset":    "OpenAI Settings",
            "worldbook": "worlds",
        }
        return sub_map.get(type_en, type_en)

    def _find_dir_by_type(self, type_en: str) -> Path | None:
        """查找指定类型的 SillyTavern 存储目录 (持久化路径优先)。"""
        config_key = TYPE_DIR_CONFIG_KEY[type_en]
        default_dir = TYPE_DIR_DEFAULT[type_en]
        fallback_dirs = TYPE_FALLBACK_DIRS[type_en]
        label = TYPE_SCAN_LABEL.get(type_en, type_en)

        # 1. 持久化存储的用户自定义路径
        saved = _load_gui_config().get(config_key)
        if saved:
            p = Path(saved)
            if p.exists():
                self._log_find(f"[持久化路径] {label} → {p}")
                return p
            self._log_debug(f"[持久化路径] 已保存但不存在: {saved}")

        # 2. 默认路径
        if default_dir.exists():
            self._log_find(f"[默认路径] {label} → {default_dir}")
            _save_gui_config(config_key, str(default_dir.resolve()))
            return default_dir
        self._log_debug(f"[默认路径] 不存在: {default_dir}")

        # 3. 后备路径
        for d in fallback_dirs:
            if d.exists():
                self._log_find(f"[后备路径] {label} → {d}")
                _save_gui_config(config_key, str(d.resolve()))
                return d
            self._log_debug(f"[后备路径] 不存在: {d}")
        self._log_debug(f"[查找完毕] 未找到任何可用的 {label} 目录")
        return None

    def _pick_dir_by_type(self, type_en: str):
        """弹出目录选择对话框, 让用户选择类型存储路径并持久化。"""
        from PySide6.QtWidgets import QFileDialog
        config_key = TYPE_DIR_CONFIG_KEY[type_en]
        label = TYPE_SCAN_LABEL.get(type_en, type_en)
        subdir = self._type_config_subdir(type_en)

        saved = _load_gui_config().get(config_key, "")
        start_dir = saved if saved and Path(saved).exists() else str(Path.home())
        self._log_debug(f"目录选择对话框起始路径: {start_dir}")
        chosen = QFileDialog.getExistingDirectory(
            self, f"选择 SillyTavern {label}目录 (data/default-user/{subdir})",
            start_dir,
        )
        if chosen:
            p = Path(chosen)
            if p.exists():
                _save_gui_config(config_key, str(p.resolve()))
                self._log(f"{label}目录已手动设为: {p}", "OK")
                self._log_find(f"已持久化到 GUI 配置: {config_key}={p}")
                found = self._list_type_files(p, type_en)
                if found:
                    self._log_scan(f"在新目录中发现 {len(found)} 个{label}")
                    self._process_scan_results(found, p, type_en)
                else:
                    self._log_warn(f"目录下未发现{label}文件: {p}")
            else:
                self._show_error(f"路径不存在: {chosen}")
        else:
            self._log_debug("用户取消了目录选择")

    def _process_scan_results(self, found: list[str], scan_dir: Path, type_en: str):
        """处理扫描结果: 过滤已有配置, 弹出添加对话框。"""
        label = TYPE_SCAN_LABEL.get(type_en, type_en)
        existing = set(self._config_mgr.get_names())
        existing_tavern = set()
        for n in existing:
            d = self._config_mgr.get_detail(n)
            if d:
                existing_tavern.add(d["tavern_name"])

        # 详细比对: 哪些是已有的, 哪些是新发现的
        matched_existing = [c for c in found if c in existing_tavern or c in existing]
        new_entries = [c for c in found if c not in existing_tavern and c not in existing]

        self._log_scan(f"扫描结果比对: {len(found)} 个文件, "
                       f"{len(matched_existing)} 个已在配置中, "
                       f"{len(new_entries)} 个可新增")
        self._log_cmp(f"配置名集合 ({len(existing)} 个): {sorted(existing)}")
        self._log_cmp(f"tavern_name 集合 ({len(existing_tavern)} 个): {sorted(existing_tavern)}")
        self._log_cmp(f"文件系统发现的 ({len(found)} 个): {sorted(found)}")
        if matched_existing:
            self._log_cmp(f"匹配已有: {matched_existing}")
        if new_entries:
            self._log_cmp(f"可新增: {new_entries}")

        if not new_entries:
            QMessageBox.information(
                self, "扫描结果",
                f"在 {scan_dir} 中发现 {len(found)} 个{label}，\n"
                f"但均已存在于 tavern_sync.yaml 配置中。"
            )
            return

        dlg = ScanAddDialog(new_entries, existing, type_en, self)
        if dlg.exec():
            added = dlg.get_selected()
            if added:
                self._log_scan(f"用户选择了 {len(added)} 个条目加入配置: {added}")
                self._batch_add_to_config(added, type_en)
            else:
                self._log_debug("用户未选择任何条目")
        else:
            self._log_debug("用户取消了添加对话框")

    def _list_type_files(self, directory: Path, type_en: str) -> list[str]:
        """扫描目录下的类型文件, 返回去重后的显示名称列表。"""
        patterns = TYPE_FILE_PATTERNS.get(type_en, (".json",))
        names: list[str] = []
        try:
            for f in directory.iterdir():
                if f.suffix.lower() in patterns and f.stem:
                    if f.name.lower() in ("thumbs.db",):
                        continue
                    names.append(f.stem)
        except PermissionError:
            self._log_warn(f"无权限读取目录: {directory}")
            pass
        seen: set[str] = set()
        unique = []
        for n in names:
            if n not in seen:
                seen.add(n)
                unique.append(n)
        unique.sort(key=lambda s: s.lower())
        self._log_debug(f"_list_type_files({type_en}) → 原始{len(names)}个, 去重后{len(unique)}个")
        return unique

    def _batch_add_to_config(self, names: list[str], type_en: str = "character"):
        """将选中的条目批量加入 tavern_sync.yaml。"""
        type_zh = TYPE_SCAN_LABEL.get(type_en, "角色卡")
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            self._show_error(f"读取配置文件失败: {e}")
            return

        additions = []
        for name in names:
            safe_dir = re.sub(r'[<>:"/\\|?*]', '_', name)
            additions.append(
                f"\n  {name}:\n"
                f"    类型: {type_zh}\n"
                f"    酒馆中的名称: {name}\n"
                f"    本地文件路径: {safe_dir}/index\n"
            )
            self._log_debug(f"准备添加条目: {name} → {safe_dir}/index")

        content = content.rstrip() + "\n"
        content += "".join(additions)

        try:
            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                f.write(content)
            self._config_mgr.load()
            self._log(f"已将 {len(names)} 个{type_zh}加入配置列表, 点击刷新查看", "OK")
        except Exception as e:
            self._show_error(f"保存配置文件失败: {e}")

    # ── 配置编辑器 ────────────────────────────────────────

    def _open_config_editor(self):
        self._log_debug("打开配置编辑器")
        dlg = ConfigEditorDialog(self._config_mgr, self)
        if dlg.exec():
            self._config_mgr.configChanged.emit()
            self._refresh_configs()
            self._log("配置已保存并重新加载", "OK")
        else:
            self._log_debug("配置编辑被取消")

    # ── 关于对话框 ────────────────────────────────────────

    def _show_about(self):
        QMessageBox.about(
            self,
            "关于 tavern_sync",
            "<h3>tavern_sync GUI v1.0</h3>"
            "<p>SillyTavern 角色卡/世界书/预设同步工具</p>"
            "<p>基于 PySide6 + Node.js</p>"
            f"<p>Node 脚本: {NODE_SCRIPT.name}</p>"
            f"<p>配置文件: {CONFIG_PATH.name}</p>"
            "<hr>"
            "<p><a href='https://github.com/StageDog/tavern_sync'>"
            "github.com/StageDog/tavern_sync</a></p>",
        )

    # ── 错误提示 ──────────────────────────────────────────

    def _show_error(self, msg: str):
        self._append_output(f"错误: {msg}", "ERROR")
        self._status_text.setText("错误")
        self._status_icon.setStyleSheet("color: #e74c3c; font-size: 18px;")
        self._log_debug(f"错误详情: {msg}")

    # ── 窗口关闭 ──────────────────────────────────────────

    def closeEvent(self, event):
        if self._state in (AppState.PULLING, AppState.WATCHING):
            reply = QMessageBox.question(
                self, "确认退出",
                "有正在运行的同步操作，确定要退出吗？\n退出将终止当前操作。",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No,
                QMessageBox.StandardButton.No,
            )
            if reply == QMessageBox.StandardButton.No:
                event.ignore()
                return

        self._cleanup_thread()
        event.accept()


# ── 配置编辑对话框 ────────────────────────────────────────

class ConfigEditorDialog(QDialog):
    """YAML 配置编辑器。"""

    def __init__(self, config_mgr: ConfigManager, parent=None):
        super().__init__(parent)
        self._config_mgr = config_mgr
        self.setWindowTitle("编辑 tavern_sync.yaml")
        self.resize(700, 600)

        layout = QVBoxLayout(self)

        tip = QLabel(
            '修改配置后请点击"保存"并刷新配置列表。\n'
            "YAML 语法错误将阻止保存。"
        )
        tip.setStyleSheet("color: #7f8c8d; font-size: 11px;")
        layout.addWidget(tip)

        self._editor = QPlainTextEdit()
        self._editor.setFont(QFont("Consolas", 10))
        self._editor.setPlainText(self._config_mgr.get_raw_yaml())
        self._editor.textChanged.connect(self._validate)
        layout.addWidget(self._editor, stretch=1)

        self._error_label = QLabel("")
        self._error_label.setStyleSheet("color: #e74c3c;")
        self._error_label.hide()
        layout.addWidget(self._error_label)

        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Save | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self._save)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def _validate(self):
        text = self._editor.toPlainText()
        valid, error = self._config_mgr.validate_yaml(text)
        if valid:
            self._error_label.hide()
        else:
            self._error_label.setText(error)
            self._error_label.show()

    def _save(self):
        text = self._editor.toPlainText()
        valid, error = self._config_mgr.validate_yaml(text)
        if not valid:
            self._error_label.setText(error)
            self._error_label.show()
            return
        if self._config_mgr.save_yaml(text):
            self.accept()
        else:
            self._error_label.setText("保存失败，请检查文件权限")
            self._error_label.show()


# ── 扫描添加对话框 ────────────────────────────────────────

class ScanAddDialog(QDialog):
    """显示扫描到的新条目, 让用户勾选添加到配置。"""

    def __init__(self, new_entries: list[str], existing: set[str],
                 type_en: str = "character", parent=None):
        super().__init__(parent)
        label = TYPE_SCAN_LABEL.get(type_en, type_en)
        self.setWindowTitle(f"发现新{label}")
        self.resize(480, 400)
        layout = QVBoxLayout(self)
        layout.addWidget(QLabel(f"发现 {len(new_entries)} 个新{label}, 勾选要加入配置的:"))

        from PySide6.QtWidgets import QListWidget, QListWidgetItem
        self._list = QListWidget()
        for name in new_entries:
            item = QListWidgetItem(name)
            item.setCheckState(Qt.CheckState.Unchecked)
            self._list.addItem(item)
        layout.addWidget(self._list, stretch=1)

        sel_bar = QHBoxLayout()
        btn_all = QPushButton("全选")
        btn_none = QPushButton("取消全选")
        sel_bar.addWidget(btn_all)
        sel_bar.addWidget(btn_none)
        sel_bar.addStretch()
        btn_all.clicked.connect(self._check_all)
        btn_none.clicked.connect(self._check_none)
        layout.addLayout(sel_bar)

        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok |
                                   QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def _check_all(self):
        for i in range(self._list.count()):
            self._list.item(i).setCheckState(Qt.CheckState.Checked)

    def _check_none(self):
        for i in range(self._list.count()):
            self._list.item(i).setCheckState(Qt.CheckState.Unchecked)

    def get_selected(self) -> list[str]:
        result = []
        for i in range(self._list.count()):
            item = self._list.item(i)
            if item.checkState() == Qt.CheckState.Checked:
                result.append(item.text())
        return result


# ── 入口 ──────────────────────────────────────────────────

def main():
    # 检查 Node.js
    try:
        import subprocess
        subprocess.run(["node", "--version"],
                       capture_output=True, timeout=10, check=True)
    except Exception:
        QMessageBox.critical(
            None, "缺少依赖",
            "未检测到 Node.js，请先安装：https://nodejs.org/",
        )
        sys.exit(1)

    # 检查配置文件
    if not CONFIG_PATH.exists():
        QMessageBox.critical(
            None, "缺少配置文件",
            f"找不到 {CONFIG_PATH}\n请先创建 tavern_sync.yaml",
        )
        sys.exit(1)

    # 检查 Node 脚本
    if not NODE_SCRIPT.exists():
        QMessageBox.critical(
            None, "缺少脚本",
            f"找不到 {NODE_SCRIPT}\n请确认 tavern_sync.mjs 在同目录下",
        )
        sys.exit(1)

    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )
    app = QApplication(sys.argv)
    app.setApplicationName("tavern_sync")

    # 全局样式
    app.setStyleSheet("""
        QMainWindow { background-color: #f5f6fa; }
        QGroupBox {
            font-size: 13px; font-weight: bold;
            border: 1px solid #dcdde1; border-radius: 6px;
            margin-top: 12px; padding-top: 16px;
        }
        QGroupBox::title {
            subcontrol-origin: margin; left: 12px; padding: 0 6px;
        }
        QPushButton#btn_pull {
            background-color: #2980b9; color: white;
            padding: 8px 24px; border-radius: 4px;
            font-size: 14px; min-width: 100px;
        }
        QPushButton#btn_pull:hover { background-color: #3498db; }
        QPushButton#btn_pull:disabled { background-color: #bdc3c7; }
        QPushButton#btn_watch {
            background-color: #27ae60; color: white;
            padding: 8px 24px; border-radius: 4px;
            font-size: 14px; min-width: 100px;
        }
        QPushButton#btn_watch:hover { background-color: #2ecc71; }
        QPushButton#btn_watch:disabled { background-color: #bdc3c7; }
    """)

    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()

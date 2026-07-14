#!/usr/bin/env python3
"""
tavern_sync_config.py  ---  YAML 配置读写模块 (供 GUI 使用)
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

from PySide6.QtCore import QObject, Signal

try:
    import yaml
except ImportError:
    print("[ERROR] 需要 pyyaml: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

# 字段映射 (中文 → 英文, 与 tavern_sync_pull.py 保持一致)
ZH_TO_EN: dict[str, str] = {
    "user名称": "user_name",
    "配置": "configs",
    "类型": "type",
    "角色卡": "character",
    "世界书": "worldbook",
    "预设": "preset",
    "酒馆中的名称": "name",
    "本地文件路径": "file",
    "导出文件路径": "bundle_file",
}

TYPE_ZH = {"character": "角色卡", "worldbook": "世界书", "preset": "预设"}


class ConfigManager(QObject):
    """管理 tavern_sync.yaml 的读取、解析、验证、保存。"""

    configLoaded = Signal(list)      # config_names: list[str]
    configChanged = Signal()          # 配置有变化
    errorOccurred = Signal(str)       # error_message

    def __init__(self, config_path: str | Path, parent: QObject | None = None):
        super().__init__(parent)
        self._config_path = Path(config_path).resolve()
        self._raw: dict[str, Any] = {}
        self._yaml_text: str = ""

    # ── 读取 ────────────────────────────────────────────────

    def load(self) -> bool:
        """加载并解析 YAML。成功返回 True，失败返回 False 并发射 errorOccurred。"""
        if not self._config_path.exists():
            self.errorOccurred.emit(f"配置文件不存在: {self._config_path}")
            return False

        try:
            with open(self._config_path, "r", encoding="utf-8") as f:
                self._yaml_text = f.read()

            parsed = yaml.safe_load(self._yaml_text)
            if not isinstance(parsed, dict):
                self.errorOccurred.emit("配置文件格式错误：不是有效的 YAML 映射")
                return False

            # 中 → 英翻译
            if "配置" in parsed:
                self._raw = self._translate(parsed, ZH_TO_EN)
                configs = self._raw.get("configs", {})
                for name, cfg in configs.items():
                    if isinstance(cfg, dict):
                        self._raw["configs"][name] = self._translate(cfg, ZH_TO_EN)
            else:
                self._raw = dict(parsed)

            names = list(self._raw.get("configs", {}).keys())
            self.configLoaded.emit(names)
            return True

        except yaml.YAMLError as e:
            self.errorOccurred.emit(f"YAML 解析错误: {e}")
            return False
        except Exception as e:
            self.errorOccurred.emit(f"读取配置文件失败: {e}")
            return False

    # ── 查询 ────────────────────────────────────────────────

    def get_names(self) -> list[str]:
        return list(self._raw.get("configs", {}))

    def get_detail(self, name: str) -> dict[str, Any] | None:
        """返回配置详情 dict (英文 key)，或 None。"""
        cfg = self._raw.get("configs", {}).get(name)
        if cfg is None:
            return None
        return {
            "config_name": name,
            "type": cfg.get("type", ""),
            "type_zh": TYPE_ZH.get(cfg.get("type", ""), cfg.get("type", "")),
            "tavern_name": cfg.get("name", ""),
            "file": cfg.get("file", ""),
            "bundle_file": cfg.get("bundle_file", ""),
        }

    def get_user_name(self) -> str:
        return self._raw.get("user_name", "") or ""

    def get_raw_yaml(self) -> str:
        return self._yaml_text

    # ── 编辑保存 ────────────────────────────────────────────

    def validate_yaml(self, text: str) -> tuple[bool, str]:
        """验证 YAML 语法。返回 (is_valid, error_message)。"""
        try:
            parsed = yaml.safe_load(text)
            if parsed is None:
                return False, "YAML 内容为空"
            if not isinstance(parsed, dict):
                return False, "YAML 顶层必须是一个映射 (dict)"
            if "配置" not in parsed and "configs" not in parsed:
                return False, "缺少 '配置' (configs) 字段"
            return True, ""
        except yaml.YAMLError as e:
            return False, f"YAML 语法错误: {e}"
        except Exception as e:
            return False, f"验证异常: {e}"

    def save_yaml(self, text: str) -> bool:
        """保存 YAML 到文件。成功返回 True。"""
        try:
            with open(self._config_path, "w", encoding="utf-8") as f:
                f.write(text)
            return True
        except Exception as e:
            self.errorOccurred.emit(f"保存失败: {e}")
            return False

    # ── 辅助 ────────────────────────────────────────────────

    @staticmethod
    def _translate(d: dict, mapping: dict[str, str]) -> dict:
        result = {}
        for k, v in d.items():
            en_key = mapping.get(k, k)
            result[en_key] = v
        return result

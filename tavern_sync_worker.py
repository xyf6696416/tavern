#!/usr/bin/env python3
"""
tavern_sync_worker.py  ---  子进程管理 + 端口清理 (供 GUI 使用)
"""

from __future__ import annotations

import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Any

from PySide6.QtCore import QObject, Signal


class PortCleaner(QObject):
    """检测并清理占用 6620 端口的旧进程。"""

    cleanupResult = Signal(bool, str)  # (success, detail)

    def cleanup(self) -> bool:
        """杀掉占用端口 6620 的进程。返回 True 表示找到了并杀掉了。"""
        result = self._find_and_kill()
        if result:
            time.sleep(1)  # 等端口释放
        return result

    def is_port_in_use(self) -> bool:
        """检查端口是否被占用 (不杀)。"""
        return self._check_port()

    def _find_and_kill(self) -> bool:
        if sys.platform == "win32":
            return self._windows_kill()
        else:
            return self._posix_kill()

    def _check_port(self) -> bool:
        if sys.platform == "win32":
            try:
                out = subprocess.run(
                    ["netstat", "-ano"],
                    capture_output=True, text=True, timeout=5
                ).stdout
                return any("6620" in line and "LISTENING" in line
                           for line in out.splitlines())
            except Exception:
                return False
        else:
            try:
                out = subprocess.run(
                    ["lsof", "-i", ":6620"],
                    capture_output=True, text=True, timeout=5
                ).stdout
                return "LISTEN" in out
            except Exception:
                return False

    def _windows_kill(self) -> bool:
        try:
            out = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True, text=True, timeout=5
            ).stdout
            for line in out.splitlines():
                if "6620" in line and "LISTENING" in line:
                    parts = line.strip().split()
                    pid = parts[-1] if parts else ""
                    if pid.isdigit():
                        subprocess.run(
                            ["taskkill", "//PID", pid, "//F"],
                            capture_output=True, timeout=5,
                        )
                        self.cleanupResult.emit(True, f"已清理 PID={pid}")
                        return True
            self.cleanupResult.emit(False, "端口 6620 未被占用")
            return False
        except Exception as e:
            self.cleanupResult.emit(False, f"清理端口异常: {e}")
            return False

    def _posix_kill(self) -> bool:
        try:
            out = subprocess.run(
                ["lsof", "-t", "-i", ":6620"],
                capture_output=True, text=True, timeout=5
            ).stdout.strip()
            if out:
                for pid in out.splitlines():
                    subprocess.run(["kill", "-9", pid],
                                   capture_output=True, timeout=5)
                self.cleanupResult.emit(True, f"已清理 PID={out}")
                return True
            self.cleanupResult.emit(False, "端口 6620 未被占用")
            return False
        except Exception as e:
            self.cleanupResult.emit(False, f"清理端口异常: {e}")
            return False


class ProcessWorker(QObject):
    """
    在 QThread 中运行 Node.js 子进程，逐行解析 stdout 并发射信号。
    通过 stop() 安全停止。
    """

    outputLine = Signal(str, str)         # (text, level)  level: OK|INFO|WARN|ERROR|DEBUG
    statusUpdate = Signal(str)            # status_key
    processFinished = Signal(int, bool, str)  # (exit_code, success, summary)
    errorOccurred = Signal(str)           # error_message

    def __init__(self, cmd: list[str], cwd: str | Path, parent: QObject | None = None):
        super().__init__(parent)
        self._cmd = cmd
        self._cwd = str(cwd)
        self._proc: subprocess.Popen | None = None
        self._stop_flag = threading.Event()
        self._success = False

    def stop(self) -> None:
        """请求停止子进程。"""
        self._stop_flag.set()
        if self._proc is not None and self._proc.poll() is None:
            try:
                self._proc.kill()
            except Exception:
                pass

    def run(self) -> None:
        """(在 QThread 中执行) 启动子进程并读取输出。"""
        self._success = False
        self._stop_flag.clear()

        try:
            self._proc = subprocess.Popen(
                self._cmd,
                cwd=self._cwd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                encoding="utf-8",
                errors="replace",
            )
        except FileNotFoundError:
            self.errorOccurred.emit("找不到 Node.js，请确认已安装")
            self.processFinished.emit(-1, False, "Node.js 未安装")
            return
        except Exception as e:
            self.errorOccurred.emit(f"启动子进程失败: {e}")
            self.processFinished.emit(-1, False, str(e))
            return

        try:
            assert self._proc.stdout is not None
            for raw_line in self._proc.stdout:
                if self._stop_flag.is_set():
                    break

                line = raw_line.rstrip("\n\r")
                if not line:
                    continue

                level, status_key = self._parse_line(line)
                self.outputLine.emit(line, level)

                if status_key:
                    self.statusUpdate.emit(status_key)
                    if status_key in ("pull_done", "push_done", "push_success"):
                        self._success = True
                    elif status_key == "new_version":
                        self.outputLine.emit(
                            "提示: 运行 node tavern_sync.mjs update 更新脚本",
                            "INFO",
                        )

        except Exception as e:
            if not self._stop_flag.is_set():
                self.errorOccurred.emit(f"读取输出异常: {e}")

        finally:
            if self._proc and self._proc.poll() is None:
                try:
                    self._proc.kill()
                    self._proc.wait(timeout=5)
                except Exception:
                    pass

            exit_code = self._proc.poll() if self._proc else -1
            summary = ""
            if self._stop_flag.is_set():
                summary = "用户中断"
            elif self._success:
                summary = "操作成功"
            elif exit_code == 0:
                summary = "进程正常退出 (状态未知)"
            else:
                summary = f"进程异常退出 (code={exit_code})"

            self.processFinished.emit(exit_code or 0, self._success, summary)

    # ── 输出解析 ──────────────────────────────────────────

    @staticmethod
    def _parse_line(line: str) -> tuple[str, str | None]:
        """解析一行 stdout，返回 (log_level, status_key_or_None)。"""

        # 成功
        if "成功将" in line and "拉取到" in line:
            return ("OK", "pull_done")
        if "成功将" in line and "推送到" in line:
            return ("OK", "push_done")
        if "推送成功" in line:
            return ("OK", "push_success")
        if "初始化推送完毕" in line:
            return ("OK", "init_done")

        # 连接
        if "服务器成功连接到酒馆网页" in line:
            return ("OK", "connected")
        if "服务器与酒馆网页" in line and "断开连接" in line:
            return ("WARN", "disconnected")
        if "酒馆同步脚本服务器正运行在端口" in line:
            return ("INFO", "server_started")

        # 操作
        if "检测到文件" in line and "发生变化" in line:
            return ("INFO", "file_changed")
        if "拉取" in line and "失败" in line:
            return ("ERROR", "pull_failed")
        if "推送" in line and "失败" in line:
            return ("ERROR", "push_failed")
        if "监听" in line and "失败" in line:
            return ("ERROR", "watch_failed")

        # 错误详情 (以空格/制表符缩进的行, 跟随在错误之后)
        if line.startswith((" ", "\t", "  ")) and any(
            kw in line for kw in ["条目", "同名", "世界书", "不存在", "绑定",
                                  "本地文件", "酒馆中", "导入"]
        ):
            return ("ERROR", None)
        # 错误详情中的列表项
        if line.strip().startswith("- ") and line.startswith(" "):
            return ("ERROR", None)

        # 错误
        if "EADDRINUSE" in line:
            return ("ERROR", "port_busy")

        # 版本
        if "发现新版本" in line:
            return ("WARN", "new_version")
        if "检查更新失败" in line:
            return ("WARN", None)
        if "更新成功" in line:
            return ("OK", None)

        return ("DEBUG", None)

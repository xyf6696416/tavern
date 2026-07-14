#!/usr/bin/env python3
"""
tavern_sync_pull.py  ---  从 SillyTavern 拉取角色卡/世界书/预设

原理: Python 读取 tavern_sync.yaml 配置, 调用 Node.js tavern_sync.mjs 执行拉取,
      捕获并美化输出日志, 统一 debug 调试能力。

用法:
    python tavern_sync_pull.py <配置名称>          # 拉取
    python tavern_sync_pull.py <配置名称> --force   # 强制拉取
    python tavern_sync_pull.py --list              # 列出可用配置
    python tavern_sync_pull.py <配置名称> --debug   # 详细调试

依赖:
    Python 3.8+, Node.js (tavern_sync.mjs 同目录)
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("[ERROR] 需要 pyyaml: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# 日志
# ---------------------------------------------------------------------------
def log(level: str, msg: str, *args: Any) -> None:
    ts = time.strftime("%H:%M:%S")
    line = f"{ts} [{level}] {msg}"
    if args:
        line = line % args
    color_map = {"OK": "32", "INFO": "36", "WARN": "33", "ERROR": "31", "DEBUG": "90"}
    c = color_map.get(level, "0")
    try:
        out = line
        if sys.stdout.isatty():
            out = f"\033[{c}m{line}\033[0m"
        if sys.platform == "win32":
            enc = sys.stdout.encoding or "utf-8"
            try:
                out.encode(enc)
            except UnicodeEncodeError:
                out = out.encode(enc, errors="replace").decode(enc, errors="replace")
        print(out, flush=True)
    except Exception:
        sys.stdout.buffer.write((line + "\n").encode("utf-8", errors="replace"))
        sys.stdout.buffer.flush()


SCRIPT_DIR = Path(__file__).resolve().parent
NODE_SCRIPT = SCRIPT_DIR / "tavern_sync.mjs"
CONFIG_FILE = SCRIPT_DIR / "tavern_sync.yaml"

# settings 翻译映射 (仅用于读取配置)
ZH_TO_EN = {
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


# ---------------------------------------------------------------------------
# 配置读取
# ---------------------------------------------------------------------------

def load_config() -> dict[str, Any]:
    """读取 tavern_sync.yaml, 返回英文 key 的 dict。"""
    if not CONFIG_FILE.exists():
        log("ERROR", "配置文件不存在: %s", CONFIG_FILE)
        sys.exit(1)

    log("DEBUG", "读取配置: %s", CONFIG_FILE)
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)

    if not isinstance(raw, dict):
        log("ERROR", "配置文件格式错误")
        sys.exit(1)

    # 中 -> 英翻译
    if "配置" in raw:
        log("DEBUG", "检测到中文配置, 翻译 -> 英文")
        result: dict = {}
        for k, v in raw.items():
            ek = ZH_TO_EN.get(k, k)
            if ek == "configs" and isinstance(v, dict):
                result[ek] = {}
                for ck, cv in v.items():
                    if isinstance(cv, dict):
                        result[ek][ck] = {ZH_TO_EN.get(ckk, ckk): cvv for ckk, cvv in cv.items()}
                    else:
                        result[ek][ck] = cv
            else:
                result[ek] = v
    else:
        result = dict(raw)

    configs = result.get("configs", {})
    log("DEBUG", "user_name=%s configs=%s", result.get("user_name"), list(configs.keys()))
    return result


def show_available() -> None:
    """列出所有可用配置。"""
    cfg = load_config()
    configs = cfg.get("configs", {})
    if not configs:
        log("WARN", "配置文件中没有定义任何配置")
        return

    print()
    print(f"  可用配置 ({len(configs)}):")
    print(f"  {'='*50}")
    for name, conf in configs.items():
        t = TYPE_ZH.get(conf.get("type", ""), conf.get("type", "?"))
        tavern_name = conf.get("name", "?")
        file_path = conf.get("file", "?")
        print(f"  [{t}] {name}")
        print(f"        酒馆名称: {tavern_name}")
        print(f"        本地路径: {file_path}")
        print()


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------

def kill_old_server() -> None:
    """杀掉占用 6620 端口的旧进程。"""
    try:
        out = subprocess.run(
            ["netstat", "-ano"], capture_output=True, text=True, timeout=5
        ).stdout
        for line in out.splitlines():
            if "6620" in line and "LISTENING" in line:
                parts = line.strip().split()
                pid = parts[-1] if parts else ""
                if pid.isdigit():
                    log("WARN", "发现旧进程 PID=%s 占用端口 6620, 正在清理...", pid)
                    subprocess.run(["taskkill", "//PID", pid, "//F"],
                                   capture_output=True, timeout=5)
                    log("OK", "已清理旧进程")
                    time.sleep(1)
    except Exception:
        pass  # 非关键操作, 忽略错误


def run_pull(config_name: str, force: bool = False, debug: bool = False) -> None:
    """使用 Node.js tavern_sync.mjs 执行拉取。"""
    cfg = load_config()
    configs = cfg.get("configs", {})

    if config_name not in configs:
        log("ERROR", "配置 '%s' 不存在。可用: %s", config_name, list(configs.keys()))
        sys.exit(1)

    conf = configs[config_name]
    type_zh = TYPE_ZH.get(conf["type"], conf["type"])
    tavern_name = conf["name"]
    file_path = conf.get("file", "?")
    if not file_path.endswith(".yaml"):
        file_path += ".yaml"

    log("INFO", "=" * 56)
    log("INFO", "  tavern_sync_pull  (Python + Node 混合)")
    log("INFO", "  配置:   %s", config_name)
    log("INFO", "  类型:   %s", type_zh)
    log("INFO", "  酒馆:   %s", tavern_name)
    log("INFO", "  输出:   %s", file_path)
    log("INFO", "=" * 56)

    if not NODE_SCRIPT.exists():
        log("ERROR", "找不到 tavern_sync.mjs: %s", NODE_SCRIPT)
        sys.exit(1)

    # 自动清理旧进程 (如果有)
    kill_old_server()

    # 检查 Node.js
    try:
        ver = subprocess.run(["node", "--version"], capture_output=True, text=True, timeout=10)
        log("DEBUG", "Node.js %s", ver.stdout.strip() if ver.returncode == 0 else "?")
    except FileNotFoundError:
        log("ERROR", "未安装 Node.js, 请先安装: https://nodejs.org/")
        sys.exit(1)
    except Exception as e:
        log("WARN", "Node.js 检查异常: %s", e)

    # 构建命令
    cmd = ["node", str(NODE_SCRIPT), "pull", config_name]
    if force:
        cmd.append("-f")

    log("DEBUG", "执行: %s", " ".join(cmd))
    log("INFO", "启动 tavern_sync, 请确保酒馆网页已打开且用户脚本已启用...")
    log("INFO", "等待连接中...")

    # 用 subprocess 执行, 实时输出
    start = time.monotonic()
    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(SCRIPT_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            encoding="utf-8",
            errors="replace",
        )
    except Exception as e:
        log("ERROR", "启动失败: %s", e)
        sys.exit(1)

    # 读取并打印输出
    timed_out = False
    success = False
    assert proc.stdout is not None

    for line in proc.stdout:
        line = line.rstrip("\n\r")
        if not line:
            continue

        # 转发关键信息到 Python 日志
        if "拉取角色卡" in line or "拉取世界书" in line or "拉取预设" in line:
            if "失败" in line:
                log("ERROR", "%s", line)
                # 建议 -f
                if "绑定" in line or "不存在" in line or "未能找到" in line:
                    log("INFO", "提示: 可尝试 --force 强制拉取")
            else:
                log("INFO", "%s", line)
        elif "成功将" in line and "拉取到" in line:
            log("OK", "%s", line)
            success = True
        elif "酒馆同步脚本服务器正运行在端口" in line:
            log("INFO", "服务器已启动, 等待酒馆网页连接...")
        elif "服务器成功连接到酒馆网页" in line:
            log("OK", "酒馆网页已连接!")
        elif "服务器与酒馆网页" in line and "断开连接" in line:
            log("WARN", "酒馆网页断开连接")
        elif "发现新版本" in line:
            log("WARN", "发现新版本! 运行 node tavern_sync.mjs update 更新")
        elif "检查更新失败" in line:
            log("WARN", "版本检查失败 (网络问题, 不影响使用)")
        elif "EADDRINUSE" in line:
            log("ERROR", "端口 6620 被占用! 请先关闭旧进程")
        elif "error" in line.lower() or "Error" in line:
            log("ERROR", "%s", line)
        elif debug:
            log("DEBUG", "%s", line)

        # 超时检查 (300 秒)
        if time.monotonic() - start > 300:
            timed_out = True
            proc.kill()
            break

    proc.wait(timeout=5)

    elapsed = time.monotonic() - start

    if timed_out:
        log("ERROR", "执行超时 (300s)")
        log("INFO", "建议: 1) 刷新酒馆网页 2) 确认用户脚本已开启 3) 检查浏览器控制台错误")
        sys.exit(1)
    elif proc.returncode != 0 and not success:
        log("ERROR", "拉取失败 (exit code=%d, %.1fs)", proc.returncode, elapsed)
        sys.exit(1)
    elif success:
        log("OK", "=" * 56)
        log("OK", "  完成! (%.1fs)", elapsed)
        log("OK", "  文件: %s/%s", SCRIPT_DIR, file_path)
        log("OK", "=" * 56)
    else:
        log("WARN", "进程结束但状态不明 (exit=%d, %.1fs)", proc.returncode, elapsed)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def run_watch(config_name: str, force: bool = False, debug: bool = False) -> None:
    """监听模式: 本地文件改动自动推送到酒馆 (Ctrl+C 退出)。"""
    cfg = load_config()
    configs = cfg.get("configs", {})

    if config_name not in configs:
        log("ERROR", "配置 '%s' 不存在。可用: %s", config_name, list(configs.keys()))
        sys.exit(1)

    conf = configs[config_name]
    type_zh = TYPE_ZH.get(conf["type"], conf["type"])
    tavern_name = conf["name"]

    log("INFO", "=" * 56)
    log("INFO", "  tavern_sync WATCH  (监听模式)")
    log("INFO", "  配置:   %s", config_name)
    log("INFO", "  类型:   %s", type_zh)
    log("INFO", "  酒馆:   %s", tavern_name)
    log("INFO", "  Ctrl+C 退出监听")
    log("INFO", "=" * 56)

    if not NODE_SCRIPT.exists():
        log("ERROR", "找不到 tavern_sync.mjs: %s", NODE_SCRIPT)
        sys.exit(1)

    kill_old_server()

    cmd = ["node", str(NODE_SCRIPT), "watch", config_name]
    if force:
        cmd.append("-f")

    log("DEBUG", "执行: %s", " ".join(cmd))
    log("INFO", "初始化推送中 (首次同步到酒馆)...")

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(SCRIPT_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            encoding="utf-8",
            errors="replace",
        )
    except Exception as e:
        log("ERROR", "启动失败: %s", e)
        sys.exit(1)

    assert proc.stdout is not None
    try:
        for line in proc.stdout:
            line = line.rstrip("\n\r")
            if not line:
                continue

            # 美化输出
            if "初始化推送完毕, 开始监听" in line:
                log("OK", "初始化完成, 开始监听文件变化...")
                log("INFO", "修改本地文件后会自动推送到酒馆")
            elif "检测到文件" in line and "发生变化" in line:
                log("INFO", "检测到文件变化, 推送中...")
            elif "推送成功" in line:
                log("OK", "自动推送成功")
            elif "推送" in line and "失败" in line:
                log("ERROR", "%s", line)
            elif "服务器成功连接到酒馆网页" in line:
                log("OK", "酒馆网页已连接!")
            elif "酒馆同步脚本服务器正运行在端口" in line:
                log("INFO", "服务器已启动, 等待酒馆网页连接...")
            elif "EADDRINUSE" in line:
                log("ERROR", "端口 6620 被占用!")
            elif debug:
                log("DEBUG", "%s", line)

    except KeyboardInterrupt:
        log("INFO", "用户中断, 停止监听...")
        proc.kill()
    finally:
        proc.wait(timeout=5)
        log("INFO", "监听已停止")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="SillyTavern 角色卡/世界书/预设同步工具 (Python 包装, Node 核心)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "支持角色卡/世界书/预设三种类型。示例:\n"
            "  python tavern_sync_pull.py 数删妹妹            # 拉取到本地\n"
            "  python tavern_sync_pull.py 数删妹妹 --force    # 强制拉取\n"
            "  python tavern_sync_pull.py 数删妹妹 --watch    # 监听本地改动, 自动推送到酒馆\n"
            "  python tavern_sync_pull.py --list              # 列出可用配置\n"
        ),
    )
    parser.add_argument("config", nargs="?", help="配置名称 (tavern_sync.yaml 中定义)")
    parser.add_argument("-f", "--force", action="store_true", help="强制拉取/推送")
    parser.add_argument("--debug", action="store_true", help="详细调试输出")
    parser.add_argument("--list", action="store_true", help="列出所有可用配置")
    parser.add_argument("-w", "--watch", action="store_true",
                        help="监听模式: 修改本地文件后自动推送到酒馆")

    args = parser.parse_args()

    if args.list:
        show_available()
        return

    if not args.config:
        parser.print_help()
        print()
        show_available()
        sys.exit(1)

    if args.watch:
        run_watch(args.config, force=args.force, debug=args.debug)
    else:
        run_pull(args.config, force=args.force, debug=args.debug)


if __name__ == "__main__":
    main()

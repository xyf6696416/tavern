@echo off
chcp 65001 >nul
title tavern_sync — 实时同步 1.魔物娘堡垒2.0
cd /d "%~dp0"
echo [tavern_sync] 启动实时同步: 1.魔物娘堡垒2.0
echo [tavern_sync] 编辑本地文件后自动推送到酒馆...
echo [tavern_sync] 按 Ctrl+C 停止同步
echo.
node tavern_sync.mjs watch 1.魔物娘堡垒2.0 -f
echo.
pause
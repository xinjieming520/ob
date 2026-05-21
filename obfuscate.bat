@echo off
:: 设置字符集为 UTF-8 防止中文乱码
chcp 65001 >nul
echo ==================================================
echo   Cloudflare Worker 本地一键混淆脚本 (配置驱动版)
echo ==================================================
echo.

:: 检查 node_modules 是否存在，如果不存在则自动安装依赖
if not exist node_modules (
    echo [提示] 检测到本地未安装依赖，正在执行 npm install...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [错误] 依赖安装失败，请确保本地已安装 Node.js，并在联网状态下运行。
        goto end
    )
    echo.
    echo [成功] 依赖安装完成！
    echo.
)

echo [执行] 正在通过 obfuscator-config.json 启动混淆器...
echo.
call npm run obfuscate:all

if %errorlevel% equ 0 (
    echo.
    echo ==================================================
    echo [成功] 代码混淆成功！产物已输出到指定的输出目录。
    echo ==================================================
) else (
    echo.
    echo ==================================================
    echo [失败] 代码混淆失败，请检查上面输出的错误日志。
    echo ==================================================
)

:end
echo.
pause

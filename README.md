代码混淆工作流

1. **统一配置中心**：obfuscator-config.json 所有的输入路径、输出路径和混淆预设均集中于此。当前默认使用均衡预设（`balanced`），您也可以一键切换为 `high-security`（高安全）或 `low-impact`（高性能低开销）预设。
2. **统一运行引擎**：obfuscate.js 使用 Node.js 编写的跨平台混淆器，自动读取上述配置文件。它不仅能全量混淆，还能在 GitHub Actions 中处理增量文件编译，甚至可以在检测到源文件删除时，使用 `--delete` 参数同步删除输出目录中的老旧混淆代码。
3. **本地运行支持**：
   - package.json 中更新了 `"obfuscate:all"` 脚本。
   - obfuscate.bat 升级为配置驱动版，双击即可读取 JSON 配置运行。

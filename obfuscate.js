const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const CONFIG_FILE = 'obfuscator-config.json';

// 加载配置文件
function loadConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    console.error(`[错误] 找不到配置文件: ${CONFIG_FILE}`);
    process.exit(1);
  }
  try {
    const configContent = fs.readFileSync(CONFIG_FILE, 'utf8');
    const config = JSON.parse(configContent);
    
    if (!config.inputDir || !config.outputDir || !config.preset) {
      throw new Error("配置文件必须包含 inputDir, outputDir 和 preset 字段。");
    }
    
    const activePreset = config.presets[config.preset];
    if (!activePreset) {
      throw new Error(`找不到指定的混淆预设: ${config.preset}`);
    }
    
    return {
      inputDir: path.normalize(config.inputDir),
      outputDir: path.normalize(config.outputDir),
      presetName: config.preset,
      obfuscatorOptions: activePreset
    };
  } catch (error) {
    console.error(`[错误] 解析配置文件失败: ${error.message}`);
    process.exit(1);
  }
}

// 递归获取目录下所有文件
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

// 混淆单个文件
function obfuscateFile(inputFile, config) {
  try {
    if (!fs.existsSync(inputFile)) {
      console.warn(`[跳过] 文件不存在: ${inputFile}`);
      return;
    }
    
    // 计算输出路径：保持 inputDir 的子目录层级结构
    const relativePath = path.relative(config.inputDir, inputFile);
    const outputFile = path.join(config.outputDir, relativePath);
    
    console.log(`[混淆] ${inputFile} -> ${outputFile}`);
    
    // 读取源码
    const rawCode = fs.readFileSync(inputFile, 'utf8');
    
    // 运行混淆
    const obfuscationResult = JavaScriptObfuscator.obfuscate(rawCode, config.obfuscatorOptions);
    const obfuscatedCode = obfuscationResult.getObfuscatedCode();
    
    // 确保输出目录存在
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    
    // 写入混淆后代码
    fs.writeFileSync(outputFile, obfuscatedCode, 'utf8');
  } catch (error) {
    console.error(`[失败] 混淆文件 ${inputFile} 时出错: ${error.message}`);
    process.exit(1);
  }
}

// 删除对应的输出文件
function deleteOutputFile(inputFile, config) {
  try {
    const relativePath = path.relative(config.inputDir, inputFile);
    const outputFile = path.join(config.outputDir, relativePath);
    
    if (fs.existsSync(outputFile)) {
      console.log(`[清理] 正在物理删除输出文件: ${outputFile}`);
      fs.unlinkSync(outputFile);
      
      // 递归清理空父目录
      let parentDir = path.dirname(outputFile);
      while (parentDir !== path.normalize(config.outputDir)) {
        if (fs.readdirSync(parentDir).length === 0) {
          fs.rmdirSync(parentDir);
          parentDir = path.dirname(parentDir);
        } else {
          break;
        }
      }
    } else {
      console.log(`[清理] 输出文件已不存在(无需处理): ${outputFile}`);
    }
  } catch (error) {
    console.error(`[失败] 清理文件 ${inputFile} 时出错: ${error.message}`);
  }
}

function main() {
  const config = loadConfig();
  const args = process.argv.slice(2);
  
  console.log(`=== 混淆引擎启动 ===`);
  console.log(`- 配置文件: ${CONFIG_FILE}`);
  console.log(`- 输入目录: ${config.inputDir}`);
  console.log(`- 输出目录: ${config.outputDir}`);
  console.log(`- 混淆预设: ${config.presetName}\n`);
  
  if (args.length === 0) {
    // 模式 A：无参数，全量混淆整个 inputDir
    console.log(`[全量模式] 正在扫描并混淆所有文件...`);
    const allFiles = getAllFiles(config.inputDir);
    if (allFiles.length === 0) {
      console.log(`[完成] 未在 ${config.inputDir} 目录下找到任何文件。`);
      return;
    }
    allFiles.forEach(file => obfuscateFile(file, config));
    console.log(`\n[成功] 全量混淆完成！共处理了 ${allFiles.length} 个文件。`);
    
  } else if (args[0] === '--delete') {
    // 模式 B：删除模式，从参数中同步删除 outputDir 下对应的混淆文件
    const filesToDelete = args.slice(1);
    console.log(`[清理模式] 正在同步删除输出文件...`);
    filesToDelete.forEach(file => {
      if (!file) return;
      deleteOutputFile(path.normalize(file), config);
    });
    console.log(`\n[成功] 清理完成！`);
    
  } else {
    // 模式 C：增量模式，只混淆传入的文件列表
    console.log(`[增量模式] 正在混淆指定的文件...`);
    const filesToObfuscate = args.filter(file => file && !file.startsWith('--'));
    filesToObfuscate.forEach(file => {
      obfuscateFile(path.normalize(file), config);
    });
    console.log(`\n[成功] 增量混淆完成！共处理了 ${filesToObfuscate.length} 个文件。`);
  }
}

main();

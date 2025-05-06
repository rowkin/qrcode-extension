const fs = require('fs');
const path = require('path');
const chalk = require('chalk'); // 需要安装 chalk 包用于美化输出

class ExtensionVerifier {
  constructor(releaseDir, config) {
    this.releaseDir = releaseDir;
    this.config = config;
    this.errors = [];
    this.warnings = [];
  }

  // 检查必需文件
  checkRequiredFiles() {
    console.log(chalk.blue('\n📝 Checking required files...'));
    this.config.files.required.forEach(file => {
      const filePath = path.join(this.releaseDir, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Required file missing: ${file}`);
      } else {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          this.errors.push(`Required file is empty: ${file}`);
        } else {
          console.log(chalk.green(`✓ ${file} (${this.formatSize(stats.size)})`));
        }
      }
    });
  }

  // 检查清单文件
  checkManifest() {
    console.log(chalk.blue('\n📋 Checking manifest.json...'));
    const manifestPath = path.join(this.releaseDir, 'manifest.json');
    
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // 必需字段检查
      const requiredFields = ['name', 'version', 'manifest_version'];
      requiredFields.forEach(field => {
        if (!manifest[field]) {
          this.errors.push(`Manifest missing required field: ${field}`);
        }
      });

      // 图标检查
      if (manifest.icons) {
        Object.entries(manifest.icons).forEach(([size, iconPath]) => {
          const fullPath = path.join(this.releaseDir, iconPath);
          if (!fs.existsSync(fullPath)) {
            this.errors.push(`Icon not found: ${iconPath}`);
          }
        });
      } else {
        this.warnings.push('No icons defined in manifest');
      }

      // 权限检查
      if (manifest.permissions) {
        console.log(chalk.yellow('Permissions required:'));
        manifest.permissions.forEach(permission => {
          console.log(`  - ${permission}`);
        });
      }

      console.log(chalk.green('✓ manifest.json is valid'));
    } catch (error) {
      this.errors.push(`Invalid manifest.json: ${error.message}`);
    }
  }

  // 检查文件大小
  checkFileSizes() {
    console.log(chalk.blue('\n📦 Checking file sizes...'));
    const sizeLimit = 5 * 1024 * 1024; // 5MB limit for individual files

    const checkSize = (filePath) => {
      const stats = fs.statSync(filePath);
      if (stats.size > sizeLimit) {
        this.warnings.push(`File exceeds 5MB: ${path.relative(this.releaseDir, filePath)}`);
      }
      return stats.size;
    };

    let totalSize = 0;

    const processDirectory = (dir) => {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          processDirectory(fullPath);
        } else {
          totalSize += checkSize(fullPath);
        }
      });
    };

    processDirectory(this.releaseDir);
    console.log(chalk.green(`Total size: ${this.formatSize(totalSize)}`));
  }

  // 检查代码压缩
  checkMinification() {
    console.log(chalk.blue('\n🔍 Checking file minification...'));
    
    if (this.config.minify.js.enabled) {
      const jsFiles = fs.readdirSync(this.releaseDir)
        .filter(file => file.endsWith('.js'))
        .filter(file => !this.config.minify.js.excludes.includes(file));

      jsFiles.forEach(file => {
        const content = fs.readFileSync(path.join(this.releaseDir, file), 'utf8');
        if (content.includes('console.log') && this.config.minify.js.options.compress.drop_console) {
          this.warnings.push(`Found console.log in minified file: ${file}`);
        }
        if (content.includes('debugger') && this.config.minify.js.options.compress.drop_debugger) {
          this.warnings.push(`Found debugger statement in minified file: ${file}`);
        }
      });
    }
  }

  // 检查源码映射文件
  checkSourceMaps() {
    console.log(chalk.blue('\n🗺️  Checking source maps...'));
    if (this.config.output.sourceMap) {
      const mapFiles = fs.readdirSync(this.releaseDir)
        .filter(file => file.endsWith('.map'));
      
      if (mapFiles.length > 0) {
        this.warnings.push('Source map files found in production build:');
        mapFiles.forEach(file => {
          this.warnings.push(`  - ${file}`);
        });
      }
    }
  }

  // 格式化文件大小
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  // 运行所有检查
  verify() {
    console.log(chalk.bold('\n🔎 Starting extension verification...\n'));
    
    this.checkRequiredFiles();
    this.checkManifest();
    this.checkFileSizes();
    this.checkMinification();
    this.checkSourceMaps();

    // 输出结果
    console.log(chalk.bold('\n📊 Verification Results:'));
    
    if (this.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:'));
      this.errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
    }

    if (this.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:'));
      this.warnings.forEach(warning => console.log(chalk.yellow(`  - ${warning}`)));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(chalk.green('\n✅ All checks passed!'));
      return true;
    }

    return this.errors.length === 0;
  }
}

// 如果直接运行脚本
if (require.main === module) {
  const [,, releaseDir, configPath] = process.argv;
  
  if (!releaseDir || !configPath) {
    console.error('Usage: node verify.js <releaseDir> <configPath>');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const verifier = new ExtensionVerifier(releaseDir, config);
  const success = verifier.verify();

  process.exit(success ? 0 : 1);
}

module.exports = ExtensionVerifier;
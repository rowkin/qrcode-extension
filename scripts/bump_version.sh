#!/bin/bash

# 确保脚本在错误时退出
set -e

# 获取项目根目录的绝对路径
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# canonical source directory (can be overridden by environment)
SRC_DIR="${SRC_DIR:-src}"
SRC_PATH="$ROOT_DIR/$SRC_DIR"

# 解析命令行参数
PACK_ONLY=false
for arg in "$@"; do
    case $arg in
        --pack-only)
            PACK_ONLY=true
            shift # 移除参数
            ;;
    esac
done

# 添加调试输出
debug_config() {
    echo "Debug: Reading config file..."
    cat "$ROOT_DIR/.extensionrc"
}

# 函数：检查文件是否存在
check_file() {
    if [ ! -f "$1" ]; then
        echo "Error: $1 not found"
        echo "Current directory: $(pwd)"
        echo "Root directory: $ROOT_DIR"
        exit 1
    fi
}

# 函数：加载配置文件
load_config() {
    local config_file="$ROOT_DIR/.extensionrc"
    if [ -f "$config_file" ]; then
        echo "Loading configuration from .extensionrc..."
        node -e "
            try {
                const fs = require('fs');
                const config = JSON.parse(fs.readFileSync('$config_file', 'utf8'));
                console.log(JSON.stringify(config));
            } catch (error) {
                console.error('Error reading config:', error);
                process.exit(1);
            }
        "
    else
        # 返回默认配置
        echo '{
            "name": "qrcode-extension",
            "files": {
                "required": [
                    "manifest.json",
                    "popup.html",
                    "popup.js",
                    "qrcode.min.js"
                ],
                "optional": [
                    "background.js",
                    "content-script.js"
                ],
                "directories": [
                    "icons",
                    "_locales",
                    "lib",
                    "styles"
                ],
                "documentation": [
                    "README.md",
                    "README-zh.md",
                    "LICENSE"
                ]
            },
            "output": {
                "directory": "dist",
                "format": "zip",
                "sourceMap": false,
                "clean": true
            }
        }'
    fi
}

# 函数：更新manifest.json版本号
update_manifest_version() {
    local version="$1"
    local manifest_file="$SRC_PATH/manifest.json"
    
    if [ ! -f "$manifest_file" ]; then
        echo "Error: manifest.json not found at $manifest_file"
        exit 1
    fi

    # 使用临时文件避免直接修改原文件可能造成的问题
    local tmp_file="$(mktemp)"
    jq ".version = \"$version\"" "$manifest_file" > "$tmp_file" && mv "$tmp_file" "$manifest_file"
    
    echo "Updated manifest.json version to $version"
}

# 函数：创建发布包
# 函数：创建发布包
# 函数：创建发布包
create_release_package() {
    local version="$1"
    local config_file="$ROOT_DIR/.extensionrc"

    # 解析配置（如果存在）
    local config_json
    if [ -f "$config_file" ]; then
        config_json=$(node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync('$config_file','utf8'))))")
    else
        # 默认配置
        config_json=$(cat <<'JSON'
{
  "name":"qrcode-extension",
  "files":{
    "required":["manifest.json","popup.html","popup.js","qrcode.min.js"],
    "optional":["background.js","content-script.js"],
    "directories":["icons","_locales","lib","styles"],
    "documentation":["README.md","README-zh.md","LICENSE"]
  }
}
JSON
)
    fi

    local dist_dir="$ROOT_DIR/dist"
    local name="qrcode-extension"
    local release_dir="$dist_dir/$name-v$version"
    local zip_file="$dist_dir/$name-v$version.zip"

    echo "Creating release package..."
    rm -rf "$dist_dir"
    mkdir -p "$release_dir"

    # 解析文件列表
    local required_files=($(node -e "const c=$config_json; console.log((c.files.required||[]).join(' '))"))
    local optional_files=($(node -e "const c=$config_json; console.log((c.files.optional||[]).join(' '))"))
    local directories=($(node -e "const c=$config_json; console.log((c.files.directories||[]).join(' '))"))
    local docs=($(node -e "const c=$config_json; console.log((c.files.documentation||[]).join(' '))"))

    echo "Debug: Required files: ${required_files[*]}"
    echo "Debug: Optional files: ${optional_files[*]}"
    echo "Debug: Directories: ${directories[*]}"
    echo "Debug: Documentation: ${docs[*]}"

    # 复制必需文件和可选文件，从 SRC_PATH 而非 ROOT_DIR
    for file in "${required_files[@]}"; do
        if [ -f "$SRC_PATH/$file" ]; then
            echo "Copying required file: $file"
            cp "$SRC_PATH/$file" "$release_dir/"
        else
            echo "Error: Required file $file not found at $SRC_PATH/$file"
            exit 1
        fi
    done

    for file in "${optional_files[@]}"; do
        if [ -f "$SRC_PATH/$file" ]; then
            echo "Copying optional file: $file"
            cp "$SRC_PATH/$file" "$release_dir/"
        else
            echo "Note: Optional file $file not found in $SRC_PATH, skipping..."
        fi
    done

    # 复制目录
    for dir in "${directories[@]}"; do
        if [ -d "$SRC_PATH/$dir" ]; then
            echo "Copying directory: $dir"
            cp -r "$SRC_PATH/$dir" "$release_dir/"
        else
            echo "Note: Directory $dir not found in $SRC_PATH, skipping..."
        fi
    done

    # 复制文档（从 root）
    for doc in "${docs[@]}"; do
        if [ -f "$ROOT_DIR/$doc" ]; then
            echo "Copying documentation: $doc"
            cp "$ROOT_DIR/$doc" "$release_dir/"
        fi
    done

    echo "Contents of release directory before zipping:"
    ls -la "$release_dir"

    echo "Creating archive..."
    (
        cd "$dist_dir" || exit 1
        rm -f "$(basename "$zip_file")"
        zip -r "$(basename "$zip_file")" "$(basename "$release_dir")"
    )

    if [ -f "$zip_file" ]; then
        echo "Package contents:"
        unzip -l "$zip_file"
        local size=$(du -h "$zip_file" | cut -f1)
        echo "Package size: $size"
        if command -v md5sum >/dev/null 2>&1; then
            echo "MD5: $(md5sum "$zip_file" | cut -d' ' -f1)"
        elif command -v md5 >/dev/null 2>&1; then
            echo "MD5: $(md5 -q "$zip_file")"
        fi
    else
        echo "Error: Failed to create zip file!"
        exit 1
    fi
}

# 函数：检查命令是否存在
check_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Error: $1 is required but not installed. Please install $1 first."
        exit 1
    fi
}

# 主要执行逻辑
main() {
    echo "=== Starting build process ==="
    echo "Using project root: $ROOT_DIR"
    
    # 检查必需的命令
    check_command jq
    check_command node
    check_command zip
    
    # 检查必需文件（来自 SRC_PATH）
    check_file "$SRC_PATH/package.json"
    check_file "$SRC_PATH/manifest.json"
    
    # 检查并安装依赖
    if [ ! -d "$ROOT_DIR/node_modules" ]; then
        echo "Installing dependencies..."
        cd "$ROOT_DIR" || exit 1
        npm install
    fi
    
    local version
    
    if [ "$PACK_ONLY" = true ]; then
        # 只打包模式：使用当前版本号
        version="$(node -p "require('./package.json').version")"
        echo "Pack only mode: using current version $version"
    else
        # 完整构建模式：检查 git 状态
        if [ -n "$(git status --porcelain)" ]; then
            echo "Error: Git working directory is not clean"
            git status
            exit 1
        fi
        
        # 自增版本号
        cd "$ROOT_DIR" || exit 1
        echo "Incrementing version number..."
        npm version patch
        
        # 获取新版本号
        version="$(node -p "require('./package.json').version")"
        echo "New version: $version"
        
        # 更新manifest.json中的版本号
        update_manifest_version "$version"
    fi
    
    # 创建发布包
    create_release_package "$version"
    
    if [ "$PACK_ONLY" = false ]; then
        # Git 操作（仅在完整构建模式下执行）
        echo "Performing Git operations..."
        
        # 添加manifest.json的更改
        git add "$ROOT_DIR/manifest.json"
        
        # 提交更新
        git commit -m "chore: bump version to $version"
        
        # 检查标签是否已存在
        if git rev-parse "v$version" >/dev/null 2>&1; then
            echo "Warning: Tag v$version already exists, removing..."
            git tag -d "v$version"
            git push origin ":refs/tags/v$version" || true
        fi
        
        # 创建新标签
        echo "Creating new tag v$version..."
        git tag -a "v$version" -m "Release version $version"
        git push origin "v$version"
        
        # 同步主分支
        main_branch="$(git branch --show-current)"
        echo "Syncing main branch ($main_branch)..."
        git push origin "$main_branch"
        
        echo "=== Version bump and release package creation completed successfully ==="
        echo "Version updated to $version in both package.json and manifest.json"
    else
        echo "=== Release package creation completed successfully ==="
    fi
    
    echo "Release package created in dist/qrcode-extension-v$version.zip"
    
    if [ "$PACK_ONLY" = false ]; then
        echo "Tag v$version created and pushed to origin"
        echo "Main branch ($main_branch) synced with origin"
    fi
    
    # 结束脚本
    echo "=== Script completed ==="
}

# 执行主函数
main "$@"
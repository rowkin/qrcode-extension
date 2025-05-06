#!/bin/bash

# 确保脚本在错误时退出
set -e

# 获取项目根目录的绝对路径
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

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
        local config=$(node -e "
            const { loadConfig } = require('./scripts/config.js');
            console.log(JSON.stringify(loadConfig('$ROOT_DIR')));
        ")
        echo "$config"
    else
        echo "No .extensionrc found, using default configuration..."
        echo "{}"
    fi
}

# 函数：更新manifest.json版本号
update_manifest_version() {
    local version="$1"
    local manifest_file="$ROOT_DIR/manifest.json"
    
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
create_release_package() {
    local version="$1"
    local config=$(load_config)
    
    # 从配置中获取值
    local dist_dir="$ROOT_DIR/$(echo "$config" | jq -r '.output.directory // "dist"')"
    local name="$(echo "$config" | jq -r '.name // "qrcode-extension"')"
    local release_dir="$dist_dir/$name-v$version"
    local zip_file="$dist_dir/$name-v$version.zip"
    
    echo "Creating release package..."
    
    # 清理输出目录
    if [ "$(echo "$config" | jq -r '.output.clean // true')" = "true" ]; then
        rm -rf "$dist_dir"
    fi
    mkdir -p "$release_dir"
    
    # 复制文件
    echo "Copying files..."
    
    # 从配置中获取文件列表
    local required_files=($(echo "$config" | jq -r '.files.required[]'))
    local optional_files=($(echo "$config" | jq -r '.files.optional[]'))
    local directories=($(echo "$config" | jq -r '.files.directories[]'))
    local docs=($(echo "$config" | jq -r '.files.documentation[]'))
    
    # 复制必需文件
    for file in "${required_files[@]}"; do
        if [ -f "$ROOT_DIR/$file" ]; then
            echo "Copying required file: $file"
            cp "$ROOT_DIR/$file" "$release_dir/"
        else
            echo "Error: Required file $file not found!"
            exit 1
        fi
    done
    
    # 复制可选文件
    for file in "${optional_files[@]}"; do
        if [ -f "$ROOT_DIR/$file" ]; then
            echo "Copying optional file: $file"
            cp "$ROOT_DIR/$file" "$release_dir/"
        else
            echo "Note: Optional file $file not found, skipping..."
        fi
    done
    
    # 复制目录
    for dir in "${directories[@]}"; do
        if [ -d "$ROOT_DIR/$dir" ]; then
            echo "Copying directory: $dir"
            cp -r "$ROOT_DIR/$dir" "$release_dir/"
        else
            echo "Note: Directory $dir not found, skipping..."
        fi
    done
    
    # 复制文档
    for doc in "${docs[@]}"; do
        if [ -f "$ROOT_DIR/$doc" ]; then
            echo "Copying documentation: $doc"
            cp "$ROOT_DIR/$doc" "$release_dir/"
        fi
    done
    
    # 如果启用了压缩
    if [ "$(echo "$config" | jq -r '.minify.js.enabled // false')" = "true" ] || \
       [ "$(echo "$config" | jq -r '.minify.html.enabled // false')" = "true" ] || \
       [ "$(echo "$config" | jq -r '.minify.css.enabled // false')" = "true" ]; then
        echo "Minifying files..."
        node scripts/minify.js "$release_dir" "$config"
    fi
    
    # 创建压缩包
    echo "Creating archive..."
    cd "$dist_dir"
    zip -r "$zip_file" "$(basename "$release_dir")"
    
    # 显示结果
    echo "Package contents:"
    unzip -l "$zip_file"
    
    local size=$(du -h "$zip_file" | cut -f1)
    echo "Package size: $size"
    
    if command -v md5sum >/dev/null 2>&1; then
        echo "MD5: $(md5sum "$zip_file" | cut -d' ' -f1)"
    elif command -v md5 >/dev/null 2>&1; then
        echo "MD5: $(md5 -q "$zip_file")"
    fi
}

# 函数：检查命令是否存在
check_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Error: $1 is required but not installed. Please install $1 first."
        exit 1
    fi
}

# 检查必需的命令
check_command jq
check_command node
check_command zip

# 检查工作目录是否干净
if [ -n "$(git status --porcelain)" ]; then
    echo "Error: Git working directory is not clean"
    git status
    exit 1
fi

echo "=== Starting version bump process ==="
echo "Using project root: $ROOT_DIR"

# 检查必需文件
check_file "$ROOT_DIR/package.json"
check_file "$ROOT_DIR/manifest.json"

# 检查并安装依赖
if [ ! -d "$ROOT_DIR/node_modules" ]; then
    echo "Installing dependencies..."
    cd "$ROOT_DIR" || exit 1
    npm install
fi

# 自增版本号
cd "$ROOT_DIR" || exit 1
echo "Incrementing version number..."
npm version patch

# 获取新版本号
new_version="$(node -p "require('./package.json').version")"
echo "New version: $new_version"

# 更新manifest.json中的版本号
update_manifest_version "$new_version"

# 创建发布包
create_release_package "$new_version"

# Git 操作
echo "Performing Git operations..."

# 添加manifest.json的更改
git add "$ROOT_DIR/manifest.json"

# 提交更新
git commit -m "chore: bump version to $new_version"

# 检查标签是否已存在
if git rev-parse "v$new_version" >/dev/null 2>&1; then
    echo "Warning: Tag v$new_version already exists, removing..."
    git tag -d "v$new_version"
    git push origin ":refs/tags/v$new_version" || true
fi

# 创建新标签
echo "Creating new tag v$new_version..."
git tag -a "v$new_version" -m "Release version $new_version"
git push origin "v$new_version"

# 同步主分支
main_branch="$(git branch --show-current)"
echo "Syncing main branch ($main_branch)..."
git push origin "$main_branch"

echo "=== Version bump and release package creation completed successfully ==="
echo "Version updated to $new_version in both package.json and manifest.json"
echo "Release package created in dist/qrcode-extension-v$new_version.zip"
echo "Tag v$new_version created and pushed to origin"
echo "Main branch ($main_branch) synced with origin"

# 结束脚本
echo "=== Script completed ==="
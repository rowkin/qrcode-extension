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
    local dist_dir="$ROOT_DIR/dist"
    local release_dir="$dist_dir/qrcode-extension-v$version"
    local zip_file="$dist_dir/qrcode-extension-v$version.zip"
    
    echo "Creating release package..."
    
    # 创建发布目录
    rm -rf "$dist_dir"
    mkdir -p "$release_dir"
    
    # 复制必需文件
    echo "Copying files..."
    cp "$ROOT_DIR/manifest.json" "$release_dir/"
    cp "$ROOT_DIR/background.js" "$release_dir/"
    cp "$ROOT_DIR/content-script.js" "$release_dir/"
    cp "$ROOT_DIR/popup.js" "$release_dir/"
    
    # 复制库文件
    if [ -d "$ROOT_DIR/lib" ]; then
        cp -r "$ROOT_DIR/lib" "$release_dir/"
    fi
    
    # 复制多语言文件
    if [ -d "$ROOT_DIR/_locales" ]; then
        cp -r "$ROOT_DIR/_locales" "$release_dir/"
    fi
    
    # 复制图标
    if [ -d "$ROOT_DIR/icons" ]; then
        cp -r "$ROOT_DIR/icons" "$release_dir/"
    fi
    
    # 复制文档
    cp "$ROOT_DIR/README.md" "$release_dir/"
    cp "$ROOT_DIR/README-zh.md" "$release_dir/"
    
    # 创建 zip 文件
    echo "Creating zip archive..."
    cd "$dist_dir"
    zip -r "$zip_file" "qrcode-extension-v$version"
    
    echo "Release package created: $zip_file"
    
    # 显示包大小
    local size=$(du -h "$zip_file" | cut -f1)
    echo "Package size: $size"
    
    # 计算 MD5
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
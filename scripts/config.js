const fs = require('fs');
const path = require('path');

function loadConfig(rootDir) {
    const defaultConfig = {
        name: 'qrcode-extension',
        files: {
            required: [
                'manifest.json',
                'popup.html',
                'popup.js',
                'qrcode.min.js'
            ],
            optional: [
                'background.js',
                'content-script.js'
            ],
            directories: [
                'icons',
                '_locales',
                'lib',
                'styles'
            ],
            documentation: [
                'README.md',
                'README-zh.md',
                'LICENSE'
            ]
        },
        output: {
            directory: 'dist',
            format: 'zip',
            sourceMap: false,
            clean: true
        }
    };

    try {
        const configPath = path.join(rootDir, '.extensionrc');
        const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...userConfig };
    } catch (error) {
        console.warn('Warning: Could not load .extensionrc, using default configuration');
        return defaultConfig;
    }
}

module.exports = { loadConfig };
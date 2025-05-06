const fs = require('fs');
const path = require('path');

function loadConfig(rootDir) {
  const configPath = path.join(rootDir, '.extensionrc');
  const defaultConfig = {
    name: 'qrcode-extension',
    files: {
      required: [
        'manifest.json',
        'popup.html',
        'popup.js',
        'qrcode.min.js'
      ],
      optional: [],
      directories: ['icons'],
      documentation: ['README.md']
    },
    minify: {
      js: { enabled: false },
      html: { enabled: false },
      css: { enabled: false }
    },
    output: {
      directory: 'dist',
      format: 'zip',
      sourceMap: false,
      clean: true
    },
    version: {
      files: ['package.json', 'manifest.json'],
      tag: {
        enabled: true,
        prefix: 'v'
      }
    }
  };

  try {
    const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return deepMerge(defaultConfig, userConfig);
  } catch (error) {
    console.warn('No valid .extensionrc found, using default configuration');
    return defaultConfig;
  }
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

module.exports = { loadConfig };
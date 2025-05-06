const fs = require('fs');
const path = require('path');
const terser = require('terser');
const htmlMinifier = require('html-minifier');
const CleanCSS = require('clean-css');

async function minifyFiles(releaseDir, config) {
  const { minify } = config;

  // 压缩 JS
  if (minify.js.enabled) {
    const jsFiles = fs.readdirSync(releaseDir)
      .filter(file => file.endsWith('.js'))
      .filter(file => !minify.js.excludes.includes(file));

    for (const file of jsFiles) {
      const filePath = path.join(releaseDir, file);
      const code = fs.readFileSync(filePath, 'utf8');
      const result = await terser.minify(code, minify.js.options);
      fs.writeFileSync(filePath, result.code);
      console.log(`Minified JS: ${file}`);
    }
  }

  // 压缩 HTML
  if (minify.html.enabled) {
    const htmlFiles = fs.readdirSync(releaseDir)
      .filter(file => file.endsWith('.html'));

    for (const file of htmlFiles) {
      const filePath = path.join(releaseDir, file);
      const code = fs.readFileSync(filePath, 'utf8');
      const result = htmlMinifier.minify(code, minify.html.options);
      fs.writeFileSync(filePath, result);
      console.log(`Minified HTML: ${file}`);
    }
  }

  // 压缩 CSS
  if (minify.css.enabled) {
    const cssFiles = fs.readdirSync(releaseDir)
      .filter(file => file.endsWith('.css'));

    const cleanCSS = new CleanCSS(minify.css.options);
    for (const file of cssFiles) {
      const filePath = path.join(releaseDir, file);
      const code = fs.readFileSync(filePath, 'utf8');
      const result = cleanCSS.minify(code);
      fs.writeFileSync(filePath, result.styles);
      console.log(`Minified CSS: ${file}`);
    }
  }
}

// 如果直接运行脚本
if (require.main === module) {
  const [,, releaseDir, configString] = process.argv;
  const config = JSON.parse(configString);
  minifyFiles(releaseDir, config).catch(console.error);
}

module.exports = { minifyFiles };
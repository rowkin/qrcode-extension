const { execSync } = require('child_process');

function checkGitStatus() {
  try {
    // 检查是否有未提交的更改
    const status = execSync('git status --porcelain').toString();
    
    if (status) {
      console.error('❌ Git working directory is not clean. Please commit or stash changes:');
      console.log(status);
      process.exit(1);
    }
    
    console.log('✅ Git working directory is clean');
    
  } catch (error) {
    console.error('❌ Failed to check git status:', error.message);
    process.exit(1);
  }
}

checkGitStatus();
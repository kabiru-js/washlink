const { execSync } = require('child_process');
try {
    execSync('npx -y create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --use-npm', { stdio: 'inherit' });
    process.chdir('frontend');
    execSync('npm install @mui/material @emotion/react @emotion/styled @mui/icons-material axios socket.io-client zustand', { stdio: 'inherit' });
} catch (error) {
    console.error("Failed to execute commands.", error);
    process.exit(1);
}

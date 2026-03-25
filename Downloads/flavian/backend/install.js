const { execSync } = require('child_process');

try {
    console.log('Running npm install in backend...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('Pushing database schema...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('Done!');
} catch (error) {
    console.error("Installation/Prisma failed: ", error);
    process.exit(1);
}

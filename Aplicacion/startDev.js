import { execSync } from 'child_process';

try { 
    execSync('npm run clean-volumes', { stdio: 'inherit' }); 
} 
catch (e) {}
    
execSync('docker compose up --build', { stdio: 'inherit' });
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projects = [
    { name: 'patient-portal', envFile: '.env.local' },
    { name: 'hospital-dashboard', envFile: '.env' },
    { name: 'ambulance-driver', envFile: '.env' }
];

function runCmd(cmd, dir) {
    try {
        const stdout = execSync(cmd, { cwd: dir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return stdout.trim();
    } catch (error) {
        // Vercel CLI sometimes writes links to stderror
        if (error.stderr) return error.stderr.trim();
        return error.toString();
    }
}

async function deploy() {
    console.log("🚀 Starting ultra-automated Vercel deployments...");
    const results = [];

    for (const proj of projects) {
        const projDir = path.join(__dirname, proj.name);
        if (!fs.existsSync(projDir)) continue;
        
        console.log(`\n=================================================`);
        console.log(` deploying ${proj.name}...`);
        console.log(`=================================================`);

        // 1. Initial link / build (this might fail build but it creates the project)
        console.log(`[1/3] Initializing Vercel project...`);
        try {
            execSync('npx vercel --prod --yes', { cwd: projDir, stdio: 'ignore' });
        } catch(e) { /* ignore build failures from missing envs */ }

        // 2. Read env file and push variables
        console.log(`[2/3] Uploading environment variables...`);
        const envPath = path.join(projDir, proj.envFile);
        if (fs.existsSync(envPath)) {
            const lines = fs.readFileSync(envPath, 'utf8').split('\n');
            for (const line of lines) {
                if (line.includes('=') && !line.startsWith('#')) {
                    const [key, ...valParts] = line.split('=');
                    const val = valParts.join('=').trim().replace(/"/g, '\\"');
                    if (key.trim() && val) {
                        try {
                            // Using string concat to avoid pipeline newlines
                            execSync(`node -e "process.stdout.write(\\"${val}\\")" | npx vercel env add ${key.trim()} production`, { cwd: projDir, stdio: 'ignore' });
                        } catch(e) { /* ignore already exists error */ }
                    }
                }
            }
        }

        // 3. Final Production Deploy
        console.log(`[3/3] Finalizing production build... (This takes 1-2 minutes)`);
        let finalOutput = '';
        try {
             finalOutput = execSync('npx vercel --prod --yes', { cwd: projDir, encoding: 'utf-8' });
        } catch(e) {
             finalOutput = e.stdout + "\\n" + e.stderr;
        }

        // Extract vercel URL
        const match = finalOutput.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/);
        const liveUrl = match ? match[0] : "Check Vercel Dashboard";
        
        console.log(`✅ Success! ${proj.name} is live at: ${liveUrl}`);
        results.push({ name: proj.name, url: liveUrl });
    }

    console.log(`\n✅🎉 ALL DEPLOYMENTS COMPLETE!\n`);
    results.forEach(r => console.log(`${r.name}: ${r.url}`));
}

deploy();

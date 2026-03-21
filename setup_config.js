const fs = require('fs');
const path = require('path');

// Try both file names for backward compat
let masterFile = path.join(__dirname, 'PRIVATE_KEYS.env');
if (!fs.existsSync(masterFile)) {
    masterFile = path.join(__dirname, 'PRIVATE_CONFIG.env');
}
if (!fs.existsSync(masterFile)) {
    console.error('Error: Neither PRIVATE_KEYS.env nor PRIVATE_CONFIG.env found in the root directory.');
    process.exit(1);
}

const content = fs.readFileSync(masterFile, 'utf8');
const keys = {};
content.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
        const [key, ...val] = line.split('=');
        keys[key.trim()] = val.join('=').trim();
    }
});

const configs = [
    {
        dir: 'patient-portal',
        file: '.env.local',
        mapping: {
            NEXT_PUBLIC_SUPABASE_URL: keys.SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: keys.SUPABASE_ANON_KEY,
            GOOGLE_GEMINI_API_KEY: keys.GOOGLE_GEMINI_API_KEY,
            GOOGLE_GEMINI_API_KEY_SECONDARY: keys.GOOGLE_GEMINI_API_KEY_SECONDARY,
            NEXT_PUBLIC_MAPBOX_TOKEN: keys.MAPBOX_TOKEN
        }
    },
    {
        dir: 'emergency-trigger',
        file: '.env',
        mapping: {
            VITE_SUPABASE_URL: keys.SUPABASE_URL,
            VITE_SUPABASE_PUBLISHABLE_KEY: keys.SUPABASE_ANON_KEY,
            VITE_SUPABASE_PROJECT_ID: keys.SUPABASE_PROJECT_ID,
            VITE_GROQ_API_KEY: keys.GROQ_API_KEY,
            VITE_MAPBOX_TOKEN: keys.MAPBOX_TOKEN,
            VITE_TEXTBEE_DEVICE_ID: keys.TEXTBEE_DEVICE_ID,
            VITE_TEXTBEE_API_KEY: keys.TEXTBEE_API_KEY
        }
    },
    {
        dir: 'hospital-dashboard',
        file: '.env',
        mapping: {
            VITE_SUPABASE_URL: keys.SUPABASE_URL,
            VITE_SUPABASE_ANON_KEY: keys.SUPABASE_ANON_KEY,
            VITE_GEMINI_API_KEY: keys.GOOGLE_GEMINI_API_KEY,
            VITE_GEMINI_API_KEY_SECONDARY: keys.GOOGLE_GEMINI_API_KEY_SECONDARY,
            VITE_MAPBOX_TOKEN: keys.MAPBOX_TOKEN
        }
    },
    {
        dir: 'ambulance-driver',
        file: '.env',
        mapping: {
            VITE_SUPABASE_URL: keys.SUPABASE_URL,
            VITE_SUPABASE_ANON_KEY: keys.SUPABASE_ANON_KEY,
            VITE_MAPBOX_TOKEN: keys.MAPBOX_TOKEN
        }
    }
];

configs.forEach(conf => {
    const targetDir = path.join(__dirname, conf.dir);
    if (!fs.existsSync(targetDir)) return;
    
    let envContent = '';
    for (const [key, value] of Object.entries(conf.mapping)) {
        envContent += `${key}=${value}\n`;
    }
    
    fs.writeFileSync(path.join(targetDir, conf.file), envContent);
    console.log(`  ✔ Updated ${conf.dir}/${conf.file}`);
});

console.log('  All configuration files have been populated successfully.');

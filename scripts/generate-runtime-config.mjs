import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const envCandidates = ['.env.local', '.env'].map((fileName) => path.join(projectRoot, fileName));
const outputPath = path.join(projectRoot, 'src/js/runtime-config.js');

function stripWrappingQuotes(value) {
    if (
        (value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith('\'') && value.endsWith('\''))
    ) {
        return value.slice(1, -1);
    }

    return value;
}

function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const parsed = {};

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line || line.startsWith('#')) {
            continue;
        }

        const separatorIndex = line.indexOf('=');

        if (separatorIndex === -1) {
            continue;
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());
        parsed[key] = value;
    }

    return parsed;
}

const fileEnv = envCandidates.reduce((accumulator, filePath) => ({
    ...accumulator,
    ...parseEnvFile(filePath)
}), {});

const env = {
    ...fileEnv,
    SUPABASE_URL: process.env.SUPABASE_URL ?? fileEnv.SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? fileEnv.SUPABASE_ANON_KEY ?? '',
    SUPABASE_TABLE: process.env.SUPABASE_TABLE ?? fileEnv.SUPABASE_TABLE ?? 'shared_workspaces'
};

const runtimeConfig = {
    supabaseUrl: env.SUPABASE_URL ?? '',
    supabaseAnonKey: env.SUPABASE_ANON_KEY ?? '',
    tableName: env.SUPABASE_TABLE ?? 'shared_workspaces'
};

const fileContent = `window.WEB_CLOCK_CONFIG = ${JSON.stringify(runtimeConfig, null, 4)};\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, fileContent, 'utf8');

console.log(`Generated ${path.relative(projectRoot, outputPath)}`);

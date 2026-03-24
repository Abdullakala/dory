import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const scanRoots = ['.github', 'apps', 'packages', 'scripts', 'tests'];
const allowedExtensions = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.sh',
    '.bash',
    '.zsh',
    '.yml',
    '.yaml',
    '.ps1',
]);
const ignoredPathFragments = [
    '/node_modules/',
    '/.next/',
    '/dist/',
    '/dist-electron/',
    '/dist-scripts/',
    '/release/',
    '/playwright-report/',
    '/test-results/',
    '/public/monaco-editor/',
];
const explicitlySensitiveVars = new Set([
    'DATABASE_URL',
    'POSTGRES_URL',
    'TRUSTED_ORIGINS',
]);
const outputCallPattern = /\bconsole\.(?:log|info|warn|error|debug)\s*\(/;
const shellOutputPattern = /\b(?:echo|printf|Write-Host|Write-Output|Write-Error|Write-Warning)\b/;
const jsEnvPattern =
    /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[['"]([A-Z][A-Z0-9_]*)['"]\])/g;
const shellEnvPattern = /(?:\$env:([A-Z][A-Z0-9_]*)|\$\{([A-Z][A-Z0-9_]*)\}|\$([A-Z][A-Z0-9_]*))/g;
const maxConsoleBlockLines = 12;

function isSensitiveVarName(name) {
    return (
        explicitlySensitiveVars.has(name) ||
        /(SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY)/.test(name)
    );
}

function isScannablePath(filePath) {
    const normalized = `/${filePath.split(path.sep).join('/')}`;
    if (ignoredPathFragments.some(fragment => normalized.includes(fragment))) {
        return false;
    }

    return allowedExtensions.has(path.extname(filePath));
}

function getTrackedFiles() {
    const result = spawnSync('git', ['ls-files', ...scanRoots], {
        cwd: rootDir,
        encoding: 'utf8',
    });

    if (result.status !== 0) {
        throw new Error(result.stderr.trim() || 'Failed to enumerate tracked files');
    }

    return result.stdout
        .split('\n')
        .map(filePath => filePath.trim())
        .filter(Boolean)
        .filter(isScannablePath);
}

function collectSensitiveEnvVars(text) {
    const matches = new Set();

    for (const pattern of [jsEnvPattern, shellEnvPattern]) {
        pattern.lastIndex = 0;

        for (const match of text.matchAll(pattern)) {
            const variableName = match[1] ?? match[2] ?? match[3];
            if (variableName && isSensitiveVarName(variableName)) {
                matches.add(variableName);
            }
        }
    }

    return [...matches];
}

function findShellOutputFindings(lines) {
    const findings = [];

    lines.forEach((line, index) => {
        if (!shellOutputPattern.test(line)) {
            return;
        }

        if (/\bGITHUB_(?:OUTPUT|ENV)\b/.test(line)) {
            return;
        }

        const sensitiveVars = collectSensitiveEnvVars(line);
        if (!sensitiveVars.length) {
            return;
        }

        findings.push({
            line: index + 1,
            snippet: line.trim(),
            vars: sensitiveVars,
        });
    });

    return findings;
}

function findConsoleOutputFindings(lines) {
    const findings = [];

    for (let index = 0; index < lines.length; index += 1) {
        if (!outputCallPattern.test(lines[index])) {
            continue;
        }

        const block = [lines[index]];
        let endIndex = index;

        while (endIndex + 1 < lines.length && endIndex - index + 1 < maxConsoleBlockLines) {
            const joinedBlock = block.join('\n');
            if (/\)\s*;?\s*$/.test(joinedBlock)) {
                break;
            }

            endIndex += 1;
            block.push(lines[endIndex]);
        }

        const snippet = block.join('\n');
        const sensitiveVars = collectSensitiveEnvVars(snippet);
        if (!sensitiveVars.length) {
            index = endIndex;
            continue;
        }

        findings.push({
            line: index + 1,
            snippet: lines[index].trim(),
            vars: sensitiveVars,
        });
        index = endIndex;
    }

    return findings;
}

async function inspectFile(filePath) {
    const absolutePath = path.resolve(rootDir, filePath);
    const source = await readFile(absolutePath, 'utf8');
    const lines = source.split(/\r?\n/);

    return [
        ...findConsoleOutputFindings(lines),
        ...findShellOutputFindings(lines),
    ].map(finding => ({
        ...finding,
        filePath,
    }));
}

async function main() {
    const findings = [];
    const trackedFiles = getTrackedFiles();

    for (const filePath of trackedFiles) {
        findings.push(...(await inspectFile(filePath)));
    }

    if (!findings.length) {
        console.log('No risky sensitive environment variable logging patterns found.');
        return;
    }

    console.error('Sensitive environment variable logging risk detected:');
    for (const finding of findings) {
        console.error(
            `- ${finding.filePath}:${finding.line} references ${finding.vars.join(', ')} in output: ${finding.snippet}`
        );
    }
    process.exit(1);
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});

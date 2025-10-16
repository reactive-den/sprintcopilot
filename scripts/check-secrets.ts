#!/usr/bin/env tsx
/**
 * Security Check Script
 * Verifies that no actual secret values are exposed in CLIENT-SIDE build output
 *
 * This script ONLY scans client-side bundles (.next/static/) because:
 * - Server-side code (.next/server/) is safe to reference env var names
 * - Only client-side code poses a security risk if secrets are exposed
 * - We look for ACTUAL secret values, not just variable name strings
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Patterns that indicate ACTUAL secret values (not just variable names)
const FORBIDDEN_PATTERNS = [
  {
    pattern: /sk-[a-zA-Z0-9]{48,}/g,
    name: 'OpenAI API Key (actual value)',
    severity: 'CRITICAL',
  },
  {
    pattern: /postgresql:\/\/[^"'\s]+:[^"'\s]+@[^"'\s]+/g,
    name: 'PostgreSQL Database URL with credentials',
    severity: 'CRITICAL',
  },
  {
    pattern: /postgres:\/\/[^"'\s]+:[^"'\s]+@[^"'\s]+/g,
    name: 'Postgres Database URL with credentials',
    severity: 'CRITICAL',
  },
  {
    pattern: /https:\/\/[a-z0-9-]+\.upstash\.io/g,
    name: 'Upstash Redis URL',
    severity: 'HIGH',
  },
];

interface SecurityIssue {
  file: string;
  pattern: string;
  match: string;
  line: number;
  severity: string;
}

const issues: SecurityIssue[] = [];

/**
 * Recursively scan directory for files
 */
function scanDirectory(dir: string, fileList: string[] = []): string[] {
  if (!existsSync(dir)) {
    return fileList;
  }

  const files = readdirSync(dir);

  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      scanDirectory(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.json')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Check file for forbidden patterns
 */
function checkFile(filePath: string): void {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    FORBIDDEN_PATTERNS.forEach(({ pattern, name, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          // Find line number
          let lineNumber = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(match)) {
              lineNumber = i + 1;
              break;
            }
          }

          issues.push({
            file: filePath,
            pattern: name,
            match: match.substring(0, 50) + (match.length > 50 ? '...' : ''),
            line: lineNumber,
            severity,
          });
        });
      }
    });
  } catch {
    console.warn(`⚠️  Could not read file: ${filePath}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Scanning CLIENT-SIDE build output for exposed secrets...\n');

  const buildDir = join(process.cwd(), '.next');
  const staticDir = join(buildDir, 'static');

  // Only scan client-side bundles
  if (!existsSync(staticDir)) {
    console.log('ℹ️  No client-side build output found (.next/static/).');
    console.log('ℹ️  Run `npm run build` first, or this is expected if using SSR only.\n');
    process.exit(0);
  }

  try {
    const files = scanDirectory(staticDir);
    console.log(`📁 Scanning ${files.length} client-side files...\n`);

    if (files.length === 0) {
      console.log('ℹ️  No JavaScript files found in client-side bundles.');
      console.log('✅ Security check passed!\n');
      process.exit(0);
    }

    files.forEach(checkFile);

    if (issues.length === 0) {
      console.log('✅ No secrets found in client-side build output!');
      console.log('✅ Security check passed!\n');
      console.log("ℹ️  Note: Server-side code (.next/server/) is not scanned as it's safe");
      console.log('ℹ️  to reference environment variable names in server-side bundles.\n');
      process.exit(0);
    } else {
      console.error('❌ SECURITY ISSUES FOUND IN CLIENT-SIDE CODE!\n');
      console.error(`Found ${issues.length} actual secret exposure(s):\n`);

      issues.forEach((issue, index) => {
        console.error(`${index + 1}. [${issue.severity}] ${issue.pattern}`);
        console.error(`   File: ${issue.file}`);
        console.error(`   Line: ${issue.line}`);
        console.error(`   Match: ${issue.match}`);
        console.error('');
      });

      console.error('⚠️  CRITICAL: Actual secret values found in client-side bundles!');
      console.error('⚠️  These secrets are exposed to anyone who visits your website!');
      console.error('⚠️  Secrets should ONLY exist in environment variables on the server.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error running security check:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Error running security check:', error);
  process.exit(1);
});

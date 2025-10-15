#!/usr/bin/env tsx

/**
 * SprintCopilot API Test Script
 * 
 * This script tests the complete API flow:
 * 1. Creates a test project
 * 2. Starts a run (triggers LangGraph pipeline)
 * 3. Polls until completion
 * 4. Downloads CSV and Jira exports
 * 5. Validates all responses
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_WAIT_TIME = 300000; // 5 minutes

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: string) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`  ${step}`, 'cyan');
  log('='.repeat(80), 'cyan');
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green');
}

function logError(message: string) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message: string) {
  log(`ℹ ${message}`, 'blue');
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAPI() {
  const startTime = Date.now();
  
  try {
    log('\n🚀 SprintCopilot API Test', 'cyan');
    log('━'.repeat(80), 'gray');
    
    // Step 1: Create Project
    logStep('Step 1: Creating Test Project');
    const projectData = {
      title: 'E-commerce Shopping Cart',
      problem: 'Users need to add items to cart, update quantities, apply discount codes, and checkout securely with multiple payment options.',
      constraints: 'Must handle concurrent updates. Support guest checkout. Mobile-friendly UI required.',
    };
    
    logInfo(`Title: ${projectData.title}`);
    logInfo(`Problem: ${projectData.problem.substring(0, 80)}...`);
    
    const projectResponse = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData),
    });
    
    if (!projectResponse.ok) {
      const error = await projectResponse.json();
      throw new Error(`Failed to create project: ${JSON.stringify(error)}`);
    }
    
    const { project } = await projectResponse.json();
    logSuccess(`Project created: ${project.id}`);
    
    // Step 2: Create Run
    logStep('Step 2: Starting Run (LangGraph Pipeline)');
    const runResponse = await fetch(`${BASE_URL}/api/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id }),
    });
    
    if (!runResponse.ok) {
      const error = await runResponse.json();
      throw new Error(`Failed to create run: ${JSON.stringify(error)}`);
    }
    
    const { run } = await runResponse.json();
    logSuccess(`Run created: ${run.id}`);
    logInfo(`Initial status: ${run.status}`);
    
    // Step 3: Poll for Completion
    logStep('Step 3: Polling for Completion');
    logInfo('This may take 1-3 minutes depending on OpenAI response time...');
    
    let currentRun = run;
    let pollCount = 0;
    const pollStartTime = Date.now();
    
    while (currentRun.status !== 'COMPLETED' && currentRun.status !== 'FAILED') {
      if (Date.now() - pollStartTime > MAX_WAIT_TIME) {
        throw new Error('Timeout: Run did not complete within 5 minutes');
      }
      
      await sleep(POLL_INTERVAL);
      pollCount++;
      
      const statusResponse = await fetch(`${BASE_URL}/api/runs/${run.id}`);
      if (!statusResponse.ok) {
        throw new Error('Failed to fetch run status');
      }
      
      const { run: updatedRun } = await statusResponse.json();
      currentRun = updatedRun;
      
      log(`  [${pollCount}] Status: ${currentRun.status}`, 'yellow');
    }
    
    if (currentRun.status === 'FAILED') {
      throw new Error(`Run failed: ${currentRun.errorMessage}`);
    }
    
    const duration = ((Date.now() - pollStartTime) / 1000).toFixed(1);
    logSuccess(`Run completed in ${duration}s after ${pollCount} polls`);
    
    // Step 4: Validate Results
    logStep('Step 4: Validating Results');
    
    if (currentRun.clarifications) {
      logSuccess(`Clarifications generated: ${currentRun.clarifications.questions?.length || 0} questions`);
    }
    
    if (currentRun.hld) {
      logSuccess(`HLD generated: ${currentRun.hld.modules?.length || 0} modules`);
    }
    
    if (currentRun.tickets && currentRun.tickets.length > 0) {
      logSuccess(`Tickets generated: ${currentRun.tickets.length} tickets`);
      logInfo(`Token usage: ${currentRun.tokensUsed} tokens`);
      logInfo(`Duration: ${(currentRun.durationMs / 1000).toFixed(1)}s`);
      
      // Show ticket summary
      log('\n  Ticket Summary:', 'cyan');
      const sprints = new Set(currentRun.tickets.map((t: any) => t.sprint).filter(Boolean));
      sprints.forEach((sprint: number) => {
        const sprintTickets = currentRun.tickets.filter((t: any) => t.sprint === sprint);
        const totalHours = sprintTickets.reduce((sum: number, t: any) => sum + (t.estimateHours || 0), 0);
        log(`    Sprint ${sprint}: ${sprintTickets.length} tickets, ${totalHours}h estimated`, 'gray');
      });
    } else {
      logError('No tickets generated');
    }
    
    // Step 5: Test CSV Export
    logStep('Step 5: Testing CSV Export');
    const csvResponse = await fetch(`${BASE_URL}/api/runs/${run.id}/export/csv`);
    
    if (!csvResponse.ok) {
      throw new Error('Failed to export CSV');
    }
    
    const csvContent = await csvResponse.text();
    const csvLines = csvContent.split('\n').filter(line => line.trim());
    logSuccess(`CSV exported: ${csvLines.length} lines (including header)`);
    
    // Step 6: Test Jira Export
    logStep('Step 6: Testing Jira JSON Export');
    const jiraResponse = await fetch(`${BASE_URL}/api/runs/${run.id}/export/jira`);
    
    if (!jiraResponse.ok) {
      throw new Error('Failed to export Jira JSON');
    }
    
    const jiraContent = await jiraResponse.json();
    logSuccess(`Jira JSON exported: ${jiraContent.length} issues`);
    
    // Final Summary
    logStep('✅ All Tests Passed!');
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`\nTotal test duration: ${totalDuration}s`, 'green');
    log(`Project ID: ${project.id}`, 'gray');
    log(`Run ID: ${run.id}`, 'gray');
    log(`\nView results at: ${BASE_URL}/projects/${project.id}`, 'blue');
    
    process.exit(0);
    
  } catch (error) {
    logError(`\n❌ Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testAPI();

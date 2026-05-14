#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read .vercel/project.json
const projectJsonPath = path.join(__dirname, '..', '.vercel', 'project.json');

if (!fs.existsSync(projectJsonPath)) {
  console.error('❌ ERROR: .vercel/project.json not found');
  process.exit(1);
}

const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf8'));

// Check if it's the correct project
const correctProjectId = 'prj_tJriP88kWcWOSUQOo8E0UrwSJb7v'; // th-lottie-app

if (projectJson.projectId !== correctProjectId) {
  console.error('❌ ERROR: .vercel/project.json points to wrong project');
  console.error('Current projectId:', projectJson.projectId);
  console.error('Expected projectId:', correctProjectId);
  console.error('Current projectName:', projectJson.projectName);
  console.error('Expected projectName: th-lottie-app');
  console.error('');
  console.error('Please fix .vercel/project.json before deploying');
  process.exit(1);
}

console.log('✅ .vercel/project.json is correct');
console.log('Project:', projectJson.projectName);
console.log('Project ID:', projectJson.projectId);

#!/usr/bin/env node
/**
 * Sanity import wrapper script
 * Usage: npm run import <dataset>
 */

import { execSync } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')
const IMPORT_FILE = join(PROJECT_ROOT, 'migration', 'output', 'sanity-import.json')

const dataset = process.argv[2]

if (!dataset) {
  console.error('Error: Dataset name required')
  console.error('Usage: npm run import <dataset>')
  console.error('Example: npm run import staging')
  process.exit(1)
}

const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_IMPORT_TOKEN

if (!token) {
  console.error('Error: SANITY_API_WRITE_TOKEN or SANITY_IMPORT_TOKEN not set')
  console.error('Please set one of these in your .env file')
  process.exit(1)
}

const command = `sanity dataset import "${IMPORT_FILE}" --dataset ${dataset} --token ${token}`

try {
  execSync(command, { stdio: 'inherit' })
} catch (error) {
  console.error('Import failed:', error.message)
  process.exit(1)
}
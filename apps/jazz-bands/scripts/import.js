#!/usr/bin/env node
/**
 * Sanity import wrapper script
 * Usage: npm run import <dataset>
 */

import { execSync } from 'child_process'
import 'dotenv/config'

const dataset = process.argv[2]

if (!dataset) {
  console.error('Error: Dataset name required')
  console.error('Usage: npm run import <dataset>')
  console.error('Example: npm run import staging')
  process.exit(1)
}

const command = `sanity dataset import ./migration/output/sanity-import.json ${dataset}`

try {
  execSync(command, { stdio: 'inherit' })
} catch (error) {
  console.error('Import failed:', error.message)
  process.exit(1)
}
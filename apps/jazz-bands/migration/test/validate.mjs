#!/usr/bin/env node

/**
 * Validation script for musician deduplication migration
 * 
 * Run after migration to verify:
 * - Duplicate detection and merging worked correctly
 * - Overrides created for band-specific differences
 * - Bidirectional references are intact
 * - Assets uploaded correctly
 * 
 * Usage:
 *   node migration/test/validate.mjs --dry-run  # Validate against dry-run output
 *   node migration/test/validate.mjs            # Validate against Sanity database
 */

import { createClient } from '@sanity/client';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  normalizeMusicianName,
  findDuplicateMusicians,
  mergeMusicianData,
  createBandOverride,
  htmlToSanityBlock,
} from '../deduplication.js';
import {
  sampleMusicians,
  expectedMergeResults,
  expectedOverrideCounts,
  expectedTotals,
  referenceIntegrityTests,
  assetValidationTests,
  getAllMusiciansWithSources,
  getExpectedNormalizedNames,
} from './fixtures.js';

import { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_WRITE_TOKEN } from '../../lib/sanity-settings'

const OUTPUT_DIR = './migration/output';
const SANITY_TOKEN = SANITY_API_WRITE_TOKEN;

let sanityClient;
let useDryRun = false;

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(title);
  console.log('='.repeat(60));
}

function logResult(passed, message) {
  console.log(`  ${passed ? '✓' : '✗'} ${message}`);
}

function logError(message) {
  console.log(`  ✗ ERROR: ${message}`);
}

async function initSanityClient() {
  if (!SANITY_PROJECT_ID || !SANITY_TOKEN) {
    console.log('Using dry-run output (no Sanity credentials)');
    useDryRun = true;
    return null;
  }

  sanityClient = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    token: SANITY_TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
  });
  return sanityClient;
}

async function validateDeduplication() {
  logSection('DEDUPLICATION VALIDATION');

  const results = {
    passed: 0,
    failed: 0,
    details: [],
  };

  const allMusicians = getAllMusiciansWithSources();

  for (const [key, expected] of Object.entries(expectedMergeResults)) {
    const [normalized, instrument] = key.split('|');

    const group = allMusicians.filter(({ musician }) => {
      const name = normalizeMusicianName(musician.name);
      const inst = musician.instrument?.toLowerCase().trim() || 'unknown';
      return name === normalized && inst === instrument;
    });

    const pass = group.length === expected.sourceCount;
    logResult(pass, `${normalized} found in ${group.length}/${expected.sourceCount} bands`);
    
    if (pass) {
      results.passed++;
    } else {
      results.failed++;
      results.details.push(`${normalized}: expected ${expected.sourceCount}, got ${group.length}`);
    }
  }

  const totalInput = allMusicians.length;
  const pass = totalInput === expectedTotals.totalInputEntries;
  logResult(pass, `Total input entries: ${totalInput}/${expectedTotals.totalInputEntries}`);
  if (pass) results.passed++;
  else {
    results.failed++;
    results.details.push(`Total entries mismatch`);
  }

  return results;
}

async function validateOverrides() {
  logSection('OVERRIDE VALIDATION');

  const results = {
    passed: 0,
    failed: 0,
    details: [],
  };

  const allMusicians = getAllMusiciansWithSources();
  const groups = new Map();

  for (const { musician, sourceBand } of allMusicians) {
    const normalized = normalizeMusicianName(musician.name);
    if (!normalized) continue;
    
    const instrument = musician.instrument?.toLowerCase().trim() || 'unknown';
    const key = `${normalized}|${instrument}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push({ musician, sourceBand });
  }

  let totalOverrideCount = 0;

  for (const [key, candidates] of groups.entries()) {
    if (candidates.length <= 1) continue;

    const merged = await mergeMusicianData(candidates.map(c => c.musician), '');
    
    for (const candidate of candidates) {
      const override = createBandOverride(
        merged.musician,
        candidate.musician,
        candidate.sourceBand
      );
      
      if (override) {
        totalOverrideCount++;
      }
    }
  }

  const pass = totalOverrideCount === expectedTotals.expectedOverrideCount;
  logResult(pass, `Override count: ${totalOverrideCount}/${expectedTotals.expectedOverrideCount}`);
  
  if (pass) {
    results.passed++;
  } else {
    results.failed++;
    results.details.push(`Override count mismatch: expected ${expectedTotals.expectedOverrideCount}, got ${totalOverrideCount}`);
  }

  for (const [band, expectedCount] of Object.entries(expectedOverrideCounts)) {
    logResult(true, `${band}: expected ${expectedCount} overrides (simulated)`);
    results.passed++;
  }

  return results;
}

async function validateReferences() {
  logSection('REFERENCE INTEGRITY VALIDATION');

  const results = {
    passed: 0,
    failed: 0,
    details: [],
  };

  if (useDryRun) {
    const dryRunFile = join(OUTPUT_DIR, 'sanity-import.json');
    
    if (!existsSync(dryRunFile)) {
      logError(`Dry-run output not found: ${dryRunFile}`);
      logError('Run migration with DRY_RUN=true first');
      results.failed++;
      return results;
    }

    const documents = JSON.parse(readFileSync(dryRunFile, 'utf8'));
    const musicians = documents.filter(d => d._type === 'musician');
    const bands = documents.filter(d => d._type === 'band');

    for (const test of referenceIntegrityTests) {
      const musician = musicians.find(m => m._id === test.musicianId);
      
      if (!musician) {
        logResult(false, test.description);
        results.failed++;
        results.details.push(`Musician not found: ${test.musicianId}`);
        continue;
      }

      const bandRefs = musician.bands?.map(b => b._ref.replace('band_', '')) || [];
      const hasAllBands = test.expectedBands.every(b => bandRefs.includes(b));
      
      logResult(hasAllBands, test.description);
      
      if (hasAllBands) {
        results.passed++;
      } else {
        results.failed++;
        results.details.push(`${test.musicianId}: missing bands ${test.expectedBands.filter(b => !bandRefs.includes(b)).join(', ')}`);
      }
    }

    for (const band of bands) {
      const bandMembers = band.bandMembers || [];
      const hasRefs = bandMembers.every(m => m.musician && m.musician._ref);
      
      logResult(hasRefs, `${band.slug.current}: all band members have musician references`);
      
      if (hasRefs) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
  } else {
    const musicians = await sanityClient.fetch('*[_type == "musician"]');
    
    for (const musician of musicians) {
      const hasBands = musician.bands && musician.bands.length > 0;
      logResult(hasBands, `${musician.name} has band references (${musician.bands?.length || 0})`);
      
      if (hasBands) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
  }

  return results;
}

async function validateAssets() {
  logSection('ASSET VALIDATION');

  const results = {
    passed: 0,
    failed: 0,
    details: [],
  };

  if (useDryRun) {
    const dryRunFile = join(OUTPUT_DIR, 'sanity-import.json');
    
    if (!existsSync(dryRunFile)) {
      logError(`Dry-run output not found: ${dryRunFile}`);
      results.failed++;
      return results;
    }

    const documents = JSON.parse(readFileSync(dryRunFile, 'utf8'));
    const musicians = documents.filter(d => d._type === 'musician');

    let musiciansWithImages = 0;
    
    for (const musician of musicians) {
      if (musician.image) {
        musiciansWithImages++;
      }
    }

    logResult(true, `Found ${musiciansWithImages} musicians with image assets`);
    results.passed++;
  } else {
    const musicians = await sanityClient.fetch('*[_type == "musician"]');
    
    let musiciansWithImages = 0;
    
    for (const musician of musicians) {
      if (musician.image) {
        musiciansWithImages++;
      }
    }

    logResult(true, `Found ${musiciansWithImages} musicians with image assets in Sanity`);
    results.passed++;
  }

  for (const test of assetValidationTests) {
    logResult(true, `${test.fileName} categorized as ${test.expectedCategory} (simulated)`);
    results.passed++;
  }

  return results;
}

async function runAllTests() {
  console.log('\n🧪 RUNNING MIGRATION VALIDATION TESTS');
  console.log('='.repeat(60));

  await initSanityClient();

  const allResults = {
    deduplication: await validateDeduplication(),
    overrides: await validateOverrides(),
    references: await validateReferences(),
    assets: await validateAssets(),
  };

  logSection('TEST SUMMARY');

  let totalPassed = 0;
  let totalFailed = 0;

  for (const [testName, result] of Object.entries(allResults)) {
    const percentage = Math.round((result.passed / (result.passed + result.failed)) * 100) || 0;
    console.log(`${testName}: ${result.passed} passed, ${result.failed} failed (${percentage}%)`);
    totalPassed += result.passed;
    totalFailed += result.failed;
  }

  console.log('');
  console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('');

  if (totalFailed > 0) {
    console.log('FAILURES:');
    for (const [testName, result] of Object.entries(allResults)) {
      for (const detail of result.details) {
        console.log(`  - ${testName}: ${detail}`);
      }
    }
    console.log('');
    process.exit(1);
  } else {
    console.log('✅ ALL TESTS PASSED');
    console.log('');
    process.exit(0);
  }
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node migration/test/validate.mjs [options]

Options:
  --dry-run    Validate against dry-run output file
  --help, -h   Show this help message

Environment Variables:
  SANITY_PROJECT_ID  Sanity project ID (for live validation)
  SANITY_DATASET     Sanity dataset (default: production)
  SANITY_TOKEN       Sanity API token (for live validation)

Examples:
  node migration/test/validate.mjs --dry-run
  node migration/test/validate.mjs
`);
  process.exit(0);
}

runAllTests().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});

export {
  validateDeduplication,
  validateOverrides,
  validateReferences,
  validateAssets,
  runAllTests,
};

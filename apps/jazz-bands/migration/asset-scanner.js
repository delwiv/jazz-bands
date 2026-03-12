#!/usr/bin/env node

/**
 * Asset Discovery and Classification for MongoDB → Sanity Migration
 * 
 * Scans file systems and MongoDB references to discover all assets
 * and classify them for optimization.
 */

import { readdir, stat } from 'fs/promises';
import { join, basename } from 'path';
import { classifyImage, isImageFile, isAudioFile, formatBytes } from './optimize.js';

/**
 * Recursively scan a directory for all files
 * @param {string} dir - Directory path to scan
 * @param {string[]} results - Accumulator array
 * @returns {Promise<string[]>} - Array of file paths
 */
async function scanDirectory(dir, results = []) {
  try {
    const items = await readdir(dir);
    
    for (const item of items) {
      const itemPath = join(dir, item);
      const itemStat = await stat(itemPath);
      
      if (itemStat.isDirectory()) {
        await scanDirectory(itemPath, results);
      } else if (itemStat.isFile()) {
        results.push(itemPath);
      }
    }
  } catch (error) {
    // Skip directories we can't access
  }
  
  return results;
}

/**
 * Scan a directory and classify all assets
 * @param {string} baseDir - Base directory to scan
 * @returns {Promise<Object>} - Classified assets with stats
 */
export async function scanAssets(baseDir) {
  const results = {
    totalFiles: 0,
    images: {
      background: [],
      standard: [],
      thumbnail: [],
    },
    audio: [],
    other: [],
    totalSize: 0,
    byCategory: {
      background: { count: 0, size: 0 },
      standard: { count: 0, size: 0 },
      thumbnail: { count: 0, size: 0 },
      audio: { count: 0, size: 0 },
    },
  };
  
  const files = await scanDirectory(baseDir);
  
  for (const filePath of files) {
    const fileName = basename(filePath);
    const fileStat = await stat(filePath);
    const fileSize = fileStat.size;
    
    results.totalFiles++;
    results.totalSize += fileSize;
    
    if (isImageFile(filePath)) {
      const category = classifyImage(fileName, filePath);
      results.images[category].push({
        path: filePath,
        name: fileName,
        size: fileSize,
        category,
      });
      results.byCategory[category].count++;
      results.byCategory[category].size += fileSize;
    } else if (isAudioFile(filePath)) {
      results.audio.push({
        path: filePath,
        name: fileName,
        size: fileSize,
      });
      results.byCategory.audio.count++;
      results.byCategory.audio.size += fileSize;
    } else {
      results.other.push({
        path: filePath,
        name: fileName,
        size: fileSize,
      });
    }
  }
  
  return results;
}

/**
 * Get asset paths from MongoDB document references
 * @param {Object} documents - Array of MongoDB documents
 * @param {string} imageField - Field name containing image paths
 * @returns {string[]} - Array of unique image paths
 */
export function extractAssetPaths(documents, imageField = 'pictures') {
  const paths = new Set();
  
  for (const doc of documents) {
    if (doc[imageField] && Array.isArray(doc[imageField])) {
      for (const img of doc[imageField]) {
        if (typeof img === 'string') {
          paths.add(img);
        } else if (img && typeof img.path === 'string') {
          paths.add(img.path);
        }
      }
    }
  }
  
  return Array.from(paths);
}

/**
 * Scan MongoDB collections for asset references
 * @param {import('mongodb').Db} db - MongoDB database
 * @returns {Promise<Object>} - Asset references by collection
 */
export async function scanMongoAssets(db) {
  const results = {
    musicians: {
      count: 0,
      imageRefs: [],
    },
    audio: {
      count: 0,
      files: [],
    },
    images: {
      count: 0,
      files: [],
    },
  };
  
  // Scan musicians collection
  try {
    const musicians = await db.collection('musician').find().toArray();
    results.musicians.count = musicians.length;
    
    for (const musician of musicians) {
      if (musician.pictures && Array.isArray(musician.pictures)) {
        musician.pictures.forEach(p => {
          if (typeof p === 'string') {
            results.musicians.imageRefs.push({
              musician: musician.name,
              path: p,
            });
          }
        });
      }
    }
  } catch (error) {
    // Collection may not exist
  }
  
  // Scan audio collection
  try {
    const audioFiles = await db.collection('audio').find().toArray();
    results.audio.count = audioFiles.length;
    
    for (const audio of audioFiles) {
      if (audio.filepath || audio.file) {
        results.audio.files.push({
          title: audio.title,
          path: audio.filepath || audio.file,
        });
      }
    }
  } catch (error) {
    // Collection may not exist
  }
  
  // Scan images collection (if exists)
  try {
    const images = await db.collection('image').find().toArray();
    results.images.count = images.length;
    
    for (const img of images) {
      if (img.filepath || img.file) {
        results.images.files.push({
          title: img.title || img.name,
          path: img.filepath || img.file,
          caption: img.caption,
        });
      }
    }
  } catch (error) {
    // Collection may not exist
  }
  
  return results;
}

/**
 * Generate a detailed report of scanned assets
 * @param {Object} scanResults - Results from scanAssets
 * @returns {string} - Formatted report string
 */
export function generateAssetReport(scanResults) {
  const lines = [];
  
  lines.push('  📁 ASSETS DISCOVERED:');
  lines.push(`    Backgrounds:   ${scanResults.byCategory.background.count} files (${formatBytes(scanResults.byCategory.background.size)})`);
  lines.push(`    Standard:      ${scanResults.byCategory.standard.count} files (${formatBytes(scanResults.byCategory.standard.size)})`);
  lines.push(`    Thumbnails:    ${scanResults.byCategory.thumbnail.count} files (${formatBytes(scanResults.byCategory.thumbnail.size)})`);
  lines.push(`    Audio:         ${scanResults.byCategory.audio.count} files (${formatBytes(scanResults.byCategory.audio.size)})`);
  
  const totalImages = scanResults.byCategory.background.count + 
                      scanResults.byCategory.standard.count + 
                      scanResults.byCategory.thumbnail.count;
  
  lines.push(`    `);
  lines.push(`    💾 Total: ${totalImages} images + ${scanResults.byCategory.audio.count} audio files (${formatBytes(scanResults.totalSize)})`);
  
  return lines.join('\n');
}

/**
 * Estimate optimization savings for scanned assets
 * @param {Object} scanResults - Results from scanAssets
 * @returns {Object} - Estimated savings
 */
export function estimateOptimizationSavings(scanResults) {
  const compressionRatios = {
    background: 0.22,
    standard: 0.18,
    thumbnail: 0.15,
  };
  
  const estimatedOutput = {
    background: Math.round(scanResults.byCategory.background.size * compressionRatios.background),
    standard: Math.round(scanResults.byCategory.standard.size * compressionRatios.standard),
    thumbnail: Math.round(scanResults.byCategory.thumbnail.size * compressionRatios.thumbnail),
  };
  
  const totalOriginal = scanResults.byCategory.background.size +
                        scanResults.byCategory.standard.size +
                        scanResults.byCategory.thumbnail.size;
  
  const totalEstimated = estimatedOutput.background +
                         estimatedOutput.standard +
                         estimatedOutput.thumbnail;
  
  const savings = totalOriginal - totalEstimated;
  const reductionPercent = totalOriginal > 0 ? ((savings / totalOriginal) * 100).toFixed(0) : 0;
  
  return {
    original: totalOriginal,
    estimated: totalEstimated,
    savings,
    reductionPercent,
    byCategory: estimatedOutput,
  };
}

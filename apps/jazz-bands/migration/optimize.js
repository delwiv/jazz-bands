#!/usr/bin/env node

/**
 * Image Optimization Utilities for MongoDB → Sanity Migration
 * 
 * Provides 3-tier image optimization with Sharp:
 * - thumbnail: For musician portraits (200, 400, 800px)
 * - standard: For general images (400, 800, 1200, 1920px)
 * - background: For hero/background images (800, 1200, 1920, 2560, 3840px)
 */

import sharp from 'sharp';
import { join, basename, extname, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * 3-tier optimization presets for different use cases
 */
export const OPTIMIZATION_PRESETS = {
  thumbnail: {
    format: 'webp',
    quality: 75,
    sizes: [200, 400, 800],
    maxWidth: 800,
    description: 'Musician portraits and small gallery thumbnails',
  },
  standard: {
    format: 'webp',
    quality: 85,
    sizes: [400, 800, 1200, 1920],
    maxWidth: 1920,
    description: 'General images and gallery images',
  },
  background: {
    format: 'webp',
    quality: 95,
    sizes: [800, 1200, 1920, 2560, 3840],
    maxWidth: 3840,
    description: 'Hero and background images',
  },
};

/**
 * Classify an image file based on filename and path
 * @param {string} fileName - The name of the file
 * @param {string} filePath - Full path to the file
 * @returns {string} - 'thumbnail', 'standard', or 'background'
 */
export function classifyImage(fileName, filePath) {
  const lowerName = fileName.toLowerCase();
  
  // Background indicators (by filename patterns)
  if (lowerName.startsWith('bg') || 
      lowerName.includes('background') || 
      lowerName.includes('main') ||
      lowerName.includes('hero')) {
    return 'background';
  }
  
  // Musician portraits (by directory)
  if (filePath.includes('/Musicians/') || filePath.includes('/musicians/')) {
    return 'thumbnail';
  }
  
  // Default to standard
  return 'standard';
}

/**
 * Get estimated output size based on preset
 * @param {number} originalSize - Original file size in bytes
 * @param {string} presetName - Preset name (thumbnail/standard/background)
 * @returns {number} - Estimated output size in bytes
 */
export function estimateOutputSize(originalSize, presetName) {
  const compressionRatios = {
    thumbnail: 0.15,   // 85% reduction
    standard: 0.18,    // 82% reduction
    background: 0.22,  // 78% reduction (higher quality)
  };
  
  const ratio = compressionRatios[presetName] || 0.2;
  return Math.round(originalSize * ratio);
}

/**
 * Optimize a single image file and generate multiple size variants
 * @param {string} inputPath - Path to source image
 * @param {string} outputDir - Directory to save optimized images
 * @param {string} presetName - Optimization preset to use
 * @param {boolean} dryRun - If true, only return stats without processing
 * @returns {Promise<Object>} - Optimization results
 */
export async function optimizeImage(inputPath, outputDir, presetName, dryRun = false) {
  const preset = OPTIMIZATION_PRESETS[presetName];
  const fileName = basename(inputPath, extname(inputPath));
  const originalSize = await getFileSize(inputPath);
  
  if (dryRun) {
    const estimatedSize = estimateOutputSize(originalSize, presetName);
    return {
      success: true,
      inputPath,
      preset: presetName,
      originalSize,
      estimatedSize,
      sizes: preset.sizes,
      files: [],
    };
  }
  
  try {
    // Create output directory
    await mkdirSync(outputDir, { recursive: true });
    
    const optimizedFiles = [];
    const metadata = await sharp(inputPath).metadata();
    
    // Generate each size variant
    for (const size of preset.sizes) {
      const outputFileName = `${fileName}_${size}w.${preset.format}`;
      const outputPath = join(outputDir, outputFileName);
      
      // Calculate dimensions maintaining aspect ratio
      const scaleFactor = size / metadata.width;
      const outputHeight = Math.round(metadata.height * scaleFactor);
      
      await sharp(inputPath)
        .resize(size, outputHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ 
          quality: preset.quality,
          lossless: false,
        })
        .toFile(outputPath);
      
      const actualSize = await getFileSize(outputPath);
      optimizedFiles.push({
        name: outputFileName,
        size: size,
        actualSize,
        path: outputPath,
      });
    }
    
    return {
      success: true,
      inputPath,
      outputDir,
      preset: presetName,
      originalSize,
      optimizedFiles,
      totalOutputSize: optimizedFiles.reduce((sum, f) => sum + f.actualSize, 0),
    };
    
  } catch (error) {
    console.error(`  ✗ Error optimizing ${inputPath}:`, error.message);
    return {
      success: false,
      inputPath,
      error: error.message,
    };
  }
}

/**
 * Batch optimize multiple images
 * @param {string[]} inputPaths - Array of input file paths
 * @param {string} outputDir - Base output directory
 * @param {boolean} dryRun - If true, only return stats
 * @param {function} progressCallback - Callback for progress updates
 * @returns {Promise<Object>} - Batch optimization results
 */
export async function batchOptimize(inputPaths, outputDir, dryRun = false, progressCallback = null) {
  const results = {
    total: inputPaths.length,
    successful: 0,
    failed: 0,
    originalSize: 0,
    outputSize: 0,
    byPreset: {
      thumbnail: { count: 0, original: 0, output: 0 },
      standard: { count: 0, original: 0, output: 0 },
      background: { count: 0, original: 0, output: 0 },
    },
    files: [],
  };
  
  for (let i = 0; i < inputPaths.length; i++) {
    const inputPath = inputPaths[i];
    
    if (!existsSync(inputPath)) {
      results.failed++;
      results.files.push({
        inputPath,
        success: false,
        error: 'File not found',
      });
      continue;
    }
    
    // Classify and optimize
    const presetName = classifyImage(basename(inputPath), inputPath);
    const result = await optimizeImage(inputPath, outputDir, presetName, dryRun);
    
    results.files.push({
      inputPath,
      preset: presetName,
      ...result,
    });
    
    if (result.success) {
      results.successful++;
      results.originalSize += result.originalSize;
      
      if (dryRun) {
        results.outputSize += result.estimatedSize;
        results.byPreset[presetName].output += result.estimatedSize;
      } else {
        results.outputSize += result.totalOutputSize;
        results.byPreset[presetName].output += result.totalOutputSize;
      }
      
      results.byPreset[presetName].count++;
      results.byPreset[presetName].original += result.originalSize;
    } else {
      results.failed++;
    }
    
    // Progress callback
    if (progressCallback) {
      progressCallback(i + 1, inputPaths.length, inputPath, presetName);
    }
  }
  
  return results;
}

/**
 * Get file size in bytes
 * @param {string} filePath - Path to file
 * @returns {Promise<number>} - File size in bytes
 */
async function getFileSize(filePath) {
  const { stat } = await import('fs/promises');
  const fileStat = await stat(filePath);
  return fileStat.size;
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if a file is an image
 * @param {string} filePath - Path to file
 * @returns {boolean} - True if file is an image
 */
export function isImageFile(filePath) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
  return imageExtensions.includes(extname(filePath).toLowerCase());
}

/**
 * Check if a file is audio
 * @param {string} filePath - Path to file
 * @returns {boolean} - True if file is audio
 */
export function isAudioFile(filePath) {
  const audioExtensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac'];
  return audioExtensions.includes(extname(filePath).toLowerCase());
}

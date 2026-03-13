#!/usr/bin/env node

/**
 * Image Optimization Utilities for MongoDB → Sanity Migration
 * 
 * Strategy: Upload ONE high-quality source image per file to Sanity.
 * Sanity's image CDN generates all size variants on-the-fly via URL params.
 * 
 * Example usage in Sanity:
 * - Original: /images/photo-optimized.jpeg
 * - Thumbnail: /images/photo-optimized.jpeg?w=200&q=75
 * - Medium: /images/photo-optimized.jpeg?w=800&q=85
 * - Large: /images/photo-optimized.jpeg?w=1920&q=90
 * - WebP: /images/photo-optimized.jpeg?w=800&fm=webp
 * 
 * This approach:
 * - Saves storage (no duplicate size variants)
 * - Faster uploads (one file instead of 4-5)
 * - Maximum flexibility (Sanity can generate any size up to source)
 * - Better quality (Sanity's CDN uses modern formats like AVIF)
 */

import sharp from 'sharp';
import { join, basename, extname, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

/**
 * Optimization presets for Sanity migration
 * 
 * Sanity's image CDN generates sizes on-the-fly via URL params.
 * We upload ONE high-quality source image per file, and let Sanity handle:
 * - Thumbnail generation (?w=200&q=75)
 * - Format conversion (WebP, AVIF, etc.)
 * - Multiple size variants on-demand
 * 
 * Strategy: Upload optimized but high-quality source images with reasonable size limits.
 */
export const OPTIMIZATION_PRESETS = {
  /**
   * Source image for Sanity upload
   * - Single high-quality image
   * - JPEG format (best compatibility)
   * - Max 2048px on longest side (balances quality vs file size)
   * - Quality 90-92 (excellent visual quality with good compression)
   * - Sanity will generate all thumbnails/variants on-demand
   */
  'sanity-source': {
    format: 'jpeg',
    quality: 92,
    maxWidth: 2048,
    maxHeight: 2048,
    maxSizeBytes: 2 * 1024 * 1024, // 2MB max after optimization
    description: 'High-quality source image for Sanity CDN',
  },
  // Legacy presets kept for reference (not used in Sanity migration)
  thumbnail: {
    format: 'webp',
    quality: 75,
    sizes: [200, 400, 800],
    maxWidth: 800,
    description: '[Legacy] Musician portraits - not used for Sanity',
  },
  standard: {
    format: 'webp',
    quality: 85,
    sizes: [400, 800, 1200, 1920],
    maxWidth: 1920,
    description: '[Legacy] General images - not used for Sanity',
  },
  background: {
    format: 'webp',
    quality: 95,
    sizes: [800, 1200, 1920, 2560, 3840],
    maxWidth: 3840,
    description: '[Legacy] Hero images - not used for Sanity',
  },
};

/**
 * Classify an image file based on filename and path
 * [LEGACY: Kept for compatibility, but Sanity migration uses 'sanity-source' for all images]
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
 * @param {string} presetName - Preset name
 * @returns {number} - Estimated output size in bytes
 */
export function estimateOutputSize(originalSize, presetName) {
  const compressionRatios = {
    'sanity-source': 0.35,  // ~65% reduction with quality 92 JPEG
    thumbnail: 0.15,   // 85% reduction
    standard: 0.18,    // 82% reduction
    background: 0.22,  // 78% reduction (higher quality)
  };
  
  const ratio = compressionRatios[presetName] || 0.35;
  return Math.round(originalSize * ratio);
}

/**
 * Optimize a single image file for Sanity upload
 * 
 * For Sanity, we create ONE high-quality source image.
 * Sanity's CDN will generate all size variants on-the-fly.
 * 
 * @param {string} inputPath - Path to source image
 * @param {string} outputDir - Directory to save optimized image
 * @param {string} presetName - Optimization preset to use (should be 'sanity-source')
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
      files: [],
    };
  }
  
  try {
    // Create output directory
    mkdirSync(outputDir, { recursive: true });
    
    const metadata = await sharp(inputPath).metadata();
    
    // Check if we need to resize
    const needsResize = metadata.width > preset.maxWidth || metadata.height > preset.maxHeight;
    
    let outputPath;
    let outputFileName;
    
    if (presetName === 'sanity-source') {
      // For Sanity: single optimized source image
      outputFileName = `${fileName}-optimized.${preset.format}`;
      outputPath = join(outputDir, outputFileName);
      
      let processor = sharp(inputPath);
      
      // Resize if needed (maintain aspect ratio)
      if (needsResize) {
        processor = processor.resize(preset.maxWidth, preset.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
      
      // Apply format-specific optimization
      if (preset.format === 'jpeg') {
        processor = processor.jpeg({
          quality: preset.quality,
          progressive: true,
        });
      } else if (preset.format === 'webp') {
        processor = processor.webp({
          quality: preset.quality,
          lossless: false,
        });
      }
      
      await processor.toFile(outputPath);
      
      const actualSize = await getFileSize(outputPath);
      
      // Check if file is still too large after optimization
      if (preset.maxSizeBytes && actualSize > preset.maxSizeBytes) {
        console.warn(`  ⚠️  ${fileName}: ${formatBytes(actualSize)} exceeds ${formatBytes(preset.maxSizeBytes)} limit`);
        // Could apply additional compression here if needed
      }
      
      return {
        success: true,
        inputPath,
        outputDir,
        preset: presetName,
        originalSize,
        optimizedFiles: [{
          name: outputFileName,
          actualSize,
          path: outputPath,
          width: needsResize ? preset.maxWidth : metadata.width,
          height: needsResize ? Math.round(metadata.height * preset.maxWidth / metadata.width) : metadata.height,
        }],
      };
      
    } else {
      // Legacy: generate multiple size variants
      const optimizedFiles = [];
      
      for (const size of preset.sizes) {
        outputFileName = `${fileName}_${size}w.${preset.format}`;
        outputPath = join(outputDir, outputFileName);
        
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
          size,
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
    }
    
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
      'sanity-source': { count: 0, original: 0, output: 0 },
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
    
    // For Sanity migration, use sanity-source preset for all images
    // Sanity's CDN will generate size variants on-the-fly
    const presetName = 'sanity-source';
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

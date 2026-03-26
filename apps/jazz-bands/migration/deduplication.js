/**
 * Deduplication utility module for musician migration
 * 
 * Provides functions to normalize musician names, find duplicates,
 * merge data from multiple sources, and create band-specific overrides.
 * 
 * @module deduplication
 */

import { stat } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Normalizes a musician name for consistent comparison.
 * 
 * Removes accents, converts to lowercase, trims whitespace,
 * and replaces non-alphanumeric characters with hyphens.
 * 
 * @param {string} name - The musician name to normalize
 * @returns {string} Normalized name suitable for use as a comparison key
 * 
 * @example
 * normalizeMusicianName("Guillaume Souriau") // "guillaume-souriau"
 * normalizeMusicianName("  GUILLAUME  SOURIAU  ") // "guillaume-souriau"
 * normalizeMusicianName("Guillaume-Souriau!") // "guillaume-souriau"
 * normalizeMusicianName("") // ""
 */
export function normalizeMusicianName(name) {
  if (!name || typeof name !== 'string') {
    return '';
  }

  // Remove accents using NFD normalization and filtering combining characters
  const withoutAccents = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Convert to lowercase and trim whitespace
  const lowercased = withoutAccents.toLowerCase().trim();

  // Replace non-alphanumeric characters with hyphens
  const withHyphens = lowercased.replace(/[^a-z0-9]+/g, '-');

  // Remove leading/trailing hyphens
  const trimmed = withHyphens.replace(/^-+|-+$/g, '');

  return trimmed;
}

/**
 * Finds duplicate musicians by grouping them by normalized name + instrument.
 * 
 * Accepts an array of musician objects from MongoDB and groups them
 * by their normalized name. Musicians with the same normalized name
 * but different instruments are kept separate.
 * 
 * @param {Array} musicians - Array of musician objects from MongoDB
 * @param {string} sourceBand - The band name/source for these musicians
 * @returns {Map} Map where key is normalized name + instrument, value is array of duplicate candidates
 * 
 * @example
 * const duplicates = findDuplicateMusicians(musicians, 'boheme');
 * duplicates.get('guillaume-souriau-guitar') // [musician1, musician2]
 */
export function findDuplicateMusicians(musicians, sourceBand) {
  const groups = new Map();

  for (const musician of musicians) {
    const normalized = normalizeMusicianName(musician.name);
    
    // Skip entries with empty normalized names
    if (!normalized) {
      continue;
    }

    // Create key combining normalized name and instrument for better accuracy
    const instrument = musician.instrument?.toLowerCase().trim() || 'unknown';
    const key = `${normalized}|${instrument}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    const trackedMusician = {
      ...musician,
      sourceBand,
      sourceId: musician._id?.toString() || `unknown_${Date.now()}`,
    };

    groups.get(key).push(trackedMusician);
  }

  // Filter to only return groups with actual duplicates (2+ entries)
  const duplicates = new Map();
  for (const [key, group] of groups.entries()) {
    if (group.length > 1) {
      duplicates.set(key, group);
    }
  }

  return duplicates;
}

/**
 * Calculates the "completeness" score of a bio for selection
 */
function calculateBioCompleteness(bio) {
  if (!bio) return 0;
  
  let score = bio.length;
  
  // Bonus for having multiple sentences
  const sentenceCount = (bio.match(/\./g) || []).length;
  score += sentenceCount * 50;
  
  // Bonus for having paragraphs (HTML structure)
  const paragraphCount = (bio.match(/<p>/gi) || []).length;
  score += paragraphCount * 100;
  
  // Bonus for having meaningful content (not just whitespace)
  const trimmed = bio.trim();
  if (trimmed.length > 100) score += 100;
  if (trimmed.length > 500) score += 200;
  
  return score;
}

/**
 * Extracts filename from various picture data formats
 */
function extractPictureFileName(picture) {
  if (!picture) return null;
  
  if (typeof picture === 'string') {
    // API path like "/api/Containers/Musicians/download/IMG_0783.JPG"
    const parts = picture.split('/');
    return parts.pop() || null;
  }
  
  if (typeof picture === 'object') {
    // Try different field names
    if (picture.dlPath && typeof picture.dlPath === 'string') {
      const parts = picture.dlPath.split('/');
      return parts.pop() || null;
    }
    if (picture.path && typeof picture.path === 'string') {
      const parts = picture.path.split('/');
      return parts.pop() || null;
    }
    if (picture.name && typeof picture.name === 'string') {
      return picture.name;
    }
  }
  
  return null;
}

/**
 * Estimates image resolution by checking file stats if path is available
 */
async function estimateImageResolution(picture, storageBase) {
  const fileName = extractPictureFileName(picture);
  if (!fileName) return 0;
  
  // Try common storage locations
  const storageDirs = ['Musicians', 'img', 'photos', ''];
  
  for (const subDir of storageDirs) {
    const candidatePath = `${storageBase}/${subDir}/${fileName}`.replace(/\/+/g, '/');
    if (existsSync(candidatePath)) {
      try {
        const fileStat = await stat(candidatePath);
        // Use file size as proxy for resolution (larger files tend to be higher res)
        return fileStat.size;
      } catch {
        // File not accessible, continue to next location
      }
    }
  }
  
  return 0;
}

/**
 * Merges data from multiple musician entries into a single comprehensive record.
 * 
 * Selection strategy:
 * - Bio: Selects the longest, most complete HTML/text content
 * - Photo: Selects the highest resolution image (checks file stats if path available)
 * - Gallery: Merges all images, deduplicating by filename
 * - Instrument: Uses majority vote from sources
 * 
 * @param {Array} candidates - Array of musician objects to merge
 * @param {string} storageBase - Base path to musician storage directories for file size checks
 * @returns {Object} Merged musician object with source tracking
 * 
 * @example
 * const merged = await mergeMusicianData([bohemeMusician, cantoMusician]);
 * // merged.bio contains the longest bio
 * // merged.photo is the highest resolution image
 * // merged.gallery contains all unique images from both sources
 */
export async function mergeMusicianData(candidates, storageBase = '') {
  if (!candidates || candidates.length === 0) {
    throw new Error('No candidates provided for merge');
  }

  // Track which source contributed each field
  const selectedFrom = {
    bio: null,
    images: null,
    instrument: null,
  };

  // Select best bio (longest, most complete)
  let bestBio;
  let bestBioScore = -1;
  
  for (const candidate of candidates) {
    const score = calculateBioCompleteness(candidate.description);
    if (score > bestBioScore) {
      bestBioScore = score;
      bestBio = candidate.description;
      selectedFrom.bio = candidate;
    }
  }

  // Merge all images from all candidates (dedupe by filename)
  // Select the best first image (main image) based on resolution
  const allImagesMap = new Map(); // fileName -> { picture, source, resolution }
  
  for (const candidate of candidates) {
    if (!candidate.pictures || candidate.pictures.length === 0) continue;
    
    for (const picture of candidate.pictures) {
      const fileName = extractPictureFileName(picture);
      if (!fileName) continue;
      
      const resolution = await estimateImageResolution(picture, storageBase);
      
      // If this filename already exists, keep the higher resolution one
      if (allImagesMap.has(fileName)) {
        const existing = allImagesMap.get(fileName);
        if (resolution > existing.resolution) {
          allImagesMap.set(fileName, {
            picture,
            source: candidate,
            resolution,
          });
        }
      } else {
        allImagesMap.set(fileName, {
          picture,
          source: candidate,
          resolution,
        });
      }
    }
  }

  // Sort images by resolution (highest first) to make the best image the main one
  const allImages = Array.from(allImagesMap.values());
  allImages.sort((a, b) => b.resolution - a.resolution);
  
  const images = allImages.map(({ picture }) => picture);
  
  if (images.length > 0) {
    selectedFrom.images = allImages[0].source;
  }

  // Determine instrument (majority vote)
  const instrumentCounts = new Map();
  for (const candidate of candidates) {
    const instrument = candidate.instrument?.toLowerCase().trim() || 'unknown';
    instrumentCounts.set(instrument, (instrumentCounts.get(instrument) || 0) + 1);
  }

  let bestInstrument = '';
  let bestInstrumentCount = 0;
  for (const [instrument, count] of instrumentCounts.entries()) {
    if (count > bestInstrumentCount) {
      bestInstrumentCount = count;
      bestInstrument = instrument;
      // Find a source with this instrument
      for (const candidate of candidates) {
        if ((candidate.instrument?.toLowerCase().trim() || 'unknown') === instrument) {
          selectedFrom.instrument = candidate;
          break;
        }
      }
    }
  }

  // Select name (prefer original casing from first source with best bio)
  const preferredSource = selectedFrom.bio || candidates[0];
  const name = preferredSource.name;

  // Generate ID from first candidate
  const id = candidates[0]._id;

  return {
    musician: {
      _id: id,
      name,
      instrument: bestInstrument === 'unknown' ? undefined : bestInstrument,
      description: bestBio,
      pictures: images.length > 0 ? images : undefined,
    },
    sources: candidates,
    selectedFrom,
  };
}

/**
 * Compares two bio contents for equality
 */
function biosAreEqual(bio1, bio2) {
  if (!bio1 && !bio2) return true;
  if (!bio1 || !bio2) return false;
  if (bio1.length !== bio2.length) return false;
  
  for (let i = 0; i < bio1.length; i++) {
    const b1 = bio1[i];
    const b2 = bio2[i];
    
    if (b1._type !== b2._type) return false;
    if (b1.style !== b2.style) return false;
    
    if (!b1.children || !b2.children) {
      return b1.children === b2.children;
    }
    if (b1.children.length !== b2.children.length) return false;
    
    for (let j = 0; j < b1.children.length; j++) {
      if (b1.children[j].text !== b2.children[j].text) return false;
    }
  }
  
  return true;
}

/**
 * Converts HTML description to Sanity Portable Text block format
 * Preserves paragraph structure and basic formatting
 */
export function htmlToSanityBlock(html) {
  if (!html || typeof html !== 'string') return [];
  
  try {
    // Split by paragraph tags to preserve structure
    const paragraphs = html
      .split(/<p[^>]*>/i)
      .filter(p => p.trim() && !p.startsWith('</p>'))
      .map(p => {
        // Strip remaining HTML tags but preserve text
        let text = p
          .replace(/<\/[^>]+>/g, ' ')  // Close tags → space
          .replace(/<[^>]+>/g, ' ')    // Open tags → space
          .replace(/\s+/g, ' ')        // Multiple spaces → single
          .trim();
        
        if (!text) return null;
        
        return {
          _type: 'block',
          children: [
            {
              _type: 'span',
              text,
            },
          ],
          style: 'normal',
        };
      })
      .filter(block => block !== null);
    
    // If no paragraphs found, try single block
    if (paragraphs.length === 0) {
      const text = html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (text) {
        return [
          {
            _type: 'block',
            children: [{ _type: 'span', text }],
            style: 'normal',
          },
        ];
      }
    }
    
    return paragraphs;
  } catch (error) {
    console.warn(`HTML conversion failed:`, error.message);
    // Fallback: return empty array
    return [];
  }
}

/**
 * Converts Sanity block format to HTML
 */
export function sanityBlockToHtml(blocks) {
  if (!blocks || blocks.length === 0) return '';
  
  const paragraphs = blocks.map(block => {
    const text = block.children
      ?.map(child => child.text || '')
      .join('');
    return text;
  }).filter(Boolean).join('\n\n');
  
  return paragraphs;
}

/**
 * Creates a band-specific override object only when data differs from the global musician record.
 * 
 * Compares source data with merged global data and creates an override
 * object containing only the fields that differ. This keeps the data
 * model clean by avoiding unnecessary overrides.
 * 
 * @param {Object} globalMusician - The merged global musician record
 * @param {Object} sourceData - The original data from a specific band
 * @param {string} bandSlug - The slug of the band this override is for
 * @returns {Object|null} Override object in bandMemberOverride format, or null if no differences
 * 
 * @example
 * const override = createBandOverride(globalMusician, sourceData, 'boheme');
 * // Returns { _type: 'bandMemberOverride', musician: { _ref: '...' }, bio: [...] }
 * // or null if all data matches
 */
export function createBandOverride(globalMusician, sourceData, bandSlug) {
  const normalizedName = normalizeMusicianName(globalMusician.name)
  const override = {
    _type: 'bandMemberOverride',
    musician: {
      _ref: normalizedName ? `musician_${normalizedName}` : `musician_unknown_${Date.now()}`,
    },
  };

  let hasDifferences = false;

  // Compare bio
  const globalBio = htmlToSanityBlock(globalMusician.description || '');
  const sourceBio = htmlToSanityBlock(sourceData.description || '');
  
  if (!biosAreEqual(globalBio, sourceBio)) {
    override.bio = sourceBio;
    hasDifferences = true;
  }

  // Compare images array (all pictures)
  const globalImages = globalMusician.pictures || [];
  const sourceImages = sourceData.pictures || [];
  
  // Check if images differ by comparing filenames and order
  const globalImageNames = globalImages.map(p => extractPictureFileName(p)).filter(Boolean);
  const sourceImageNames = sourceImages.map(p => extractPictureFileName(p)).filter(Boolean);
  
  const imagesDiffer = 
    globalImageNames.length !== sourceImageNames.length ||
    globalImageNames.some((name, i) => name !== sourceImageNames[i]);
  
  if (imagesDiffer && sourceImages.length > 0) {
    override.images = sourceImages;
    hasDifferences = true;
  }

  // Compare instrument
  const globalInstrument = globalMusician.instrument?.toLowerCase().trim();
  const sourceInstrument = sourceData.instrument?.toLowerCase().trim();
  
  if (globalInstrument !== sourceInstrument && sourceInstrument) {
    override.instrument = sourceData.instrument;
    hasDifferences = true;
  }

  return hasDifferences ? override : null;
}

/**
 * Generates a consistent slug from a musician name
 */
export function generateMusicianSlug(name) {
  const normalized = normalizeMusicianName(name);
  return normalized.slice(0, 96); // Sanity slug max length
}

/**
 * Processes multiple musician collections and returns merge summaries
 * 
 * @param {Map} allMusicians - Map of band names to their musician arrays
 * @param {string} storageBase - Base path for image storage
 * @returns {Object} Summary of the merge operation
 */
export async function processMusiciansForMerge(allMusicians, storageBase = '') {
  const summary = {
    mergedCount: 0,
    skippedCount: 0,
    conflicts: [],
  };

  // Collect all musicians with source tracking
  const allTracked = [];
  
  for (const [bandSlug, musicians] of allMusicians.entries()) {
    for (const musician of musicians) {
      allTracked.push({
        ...musician,
        sourceBand: bandSlug,
        sourceId: musician._id?.toString() || `unknown_${Date.now()}`,
      });
    }
  }

  // Group by normalized name + instrument
  const groups = new Map();
  
  for (const musician of allTracked) {
    const normalized = normalizeMusicianName(musician.name);
    if (!normalized) continue;
    
    const instrument = musician.instrument?.toLowerCase().trim() || 'unknown';
    const key = `${normalized}|${instrument}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(musician);
  }

  // Process each group
  for (const [key, candidates] of groups.entries()) {
    if (candidates.length === 1) {
      summary.skippedCount++;
      continue;
    }

    try {
      await mergeMusicianData(candidates, storageBase);
      summary.mergedCount++;
    } catch (error) {
      summary.conflicts.push({
        type: 'merge_error',
        details: error instanceof Error ? error.message : 'Unknown error',
        sources: candidates.map(c => c.sourceBand),
      });
    }
  }

  return summary;
}

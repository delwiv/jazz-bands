/**
 * Test fixtures for musician deduplication migration
 * 
 * Contains sample musician data from boheme, canto, jazzola databases
 * with known duplicates and expected merge results.
 */

/**
 * Sample musician data simulating MongoDB documents from multiple bands
 */
export const sampleMusicians = {
  boheme: [
    {
      _id: 'boheme_guillaume_001',
      name: 'Guillaume Souriau',
      instrument: 'Guitar',
      description: '<p>Guillaume est un guitariste jazz expérimenté.</p>',
      pictures: [
        { dlPath: '/api/Containers/Musicians/download/IMG_0783.JPG' }
      ],
    },
    {
      _id: 'boheme_jacques_001',
      name: 'Jacques Julienne',
      instrument: 'Drums',
      description: '<p>Jacques est un batteur professionnel.</p><p>Il joue depuis 20 ans.</p>',
      pictures: [
        { dlPath: '/api/Containers/Musicians/download/IMG_0784.JPG' }
      ],
    },
    {
      _id: 'boheme_alice_001',
      name: 'Alice Dupont',
      instrument: 'Piano',
      description: '<p>Alice joue du piano.</p>',
      pictures: [],
    },
  ],
  canto: [
    {
      _id: 'canto_guillaume_001',
      name: 'GUILLAUME SOURIAU',
      instrument: 'guitar',
      description: '<p>Guillaume Souriau est guitariste dans plusieurs formations jazz.</p><p>Il a joué avec de nombreux artistes.</p><p>Son style est influencé par le jazz manouche.</p>',
      pictures: [
        { dlPath: '/api/Containers/Musicians/download/IMG_0790.JPG' }
      ],
    },
    {
      _id: 'canto_antoine_001',
      name: 'Antoine Hervier',
      instrument: 'Bass',
      description: '<p>Antoine est bassiste.</p>',
      pictures: [
        { dlPath: '/api/Containers/Musicians/download/IMG_0791.JPG' }
      ],
    },
    {
      _id: 'canto_frederic_001',
      name: 'Frédéric Robert',
      instrument: 'Saxophone',
      description: '<p>Frédéric joue du saxophone.</p>',
      pictures: [],
    },
  ],
  jazzola: [
    {
      _id: 'jazzola_guillaume_001',
      name: 'Guillaume Souriau',
      instrument: 'Guitar',
      description: '<p>Guillaume joue de la guitare jazz.</p>',
      pictures: [
        { dlPath: '/api/Containers/Musicians/download/IMG_0795.JPG' }
      ],
    },
    {
      _id: 'jazzola_antoine_001',
      name: 'Antoine Hervier',
      instrument: 'Bass',
      description: '<p>Antoine Hervier est un bassiste expérimenté qui joue dans plusieurs formations.</p><p>Il collabore régulièrement avec des artistes de jazz.</p>',
      pictures: [
        { dlPath: '/api/Containers/Musicians/download/IMG_0796.JPG' }
      ],
    },
    {
      _id: 'jazzola_jacques_001',
      name: 'Jacques Julienne',
      instrument: 'Drums',
      description: '<p>Jacques est batteur.</p>',
      pictures: [],
    },
    {
      _id: 'jazzola_frederic_001',
      name: 'Frédéric Robert',
      instrument: 'Saxophone',
      description: '<p>Frédéric Robert est saxophoniste jazz.</p><p>Il a enregistré plusieurs albums.</p>',
      pictures: [
        { dlPath: '/api/Containers/Musicians/download/IMG_0800.JPG' }
      ],
    },
  ],
  'trio-rsh': [
    {
      _id: 'trio_guillaume_001',
      name: 'Guillaume Souriau',
      instrument: 'Guitar',
      description: '<p>Guillaume dans le trio.</p>',
      pictures: [],
    },
    {
      _id: 'trio_antoine_001',
      name: 'Antoine Hervier',
      instrument: 'Bass',
      description: '<p>Antoine dans le trio RSH.</p>',
      pictures: [],
    },
    {
      _id: 'trio_hervie_001',
      name: 'Hervé Martin',
      instrument: 'Drums',
      description: '<p>Hervé est batteur.</p>',
      pictures: [],
    },
  ],
};

/**
 * Expected merge results after deduplication
 */
export const expectedMergeResults = {
  'guillaume-souriau|guitar': {
    sourceBands: ['boheme', 'canto', 'jazzola', 'trio-rsh'],
    sourceCount: 4,
    expectedBioSource: 'canto', // Longest bio
    expectedPhotoSource: 'boheme', // Highest res (simulated)
  },
  'jacques-julienne|drums': {
    sourceBands: ['boheme', 'jazzola'],
    sourceCount: 2,
    expectedBioSource: 'boheme', // Longer bio
    expectedPhotoSource: 'boheme', // Only source with photo
  },
  'antoine-hervier|bass': {
    sourceBands: ['canto', 'jazzola', 'trio-rsh'],
    sourceCount: 3,
    expectedBioSource: 'jazzola', // Longest bio
    expectedPhotoSource: 'canto', // First source with photo
  },
  'frederic-robert|saxophone': {
    sourceBands: ['canto', 'jazzola'],
    sourceCount: 2,
    expectedBioSource: 'jazzola', // Longer bio
    expectedPhotoSource: 'jazzola', // Only source with photo
  },
};

/**
 * Expected override counts per band
 * Overrides are created when band-specific data differs from merged global data
 */
export const expectedOverrideCounts = {
  boheme: 2, // Guillaume (bio differs), Jacques (bio differs from jazzola)
  canto: 3, // Guillaume (bio differs), Antoine (bio differs), Frédéric (bio differs)
  jazzola: 2, // Antoine (bio differs), Jacques (no photo override)
  'trio-rsh': 2, // Guillaume (bio differs), Antoine (bio differs)
  'swing-family': 0, // No musicians in test data
  'west-side-trio': 0, // No musicians in test data
};

/**
 * Expected total counts after deduplication
 */
export const expectedTotals = {
  totalInputEntries: 14, // Sum of all musicians across all bands
  duplicateGroups: 4, // Guillaume, Jacques, Antoine, Frédéric
  uniqueMusicians: 6, // Alice, Hervé + 4 duplicates = 6 unique
  globalMusicianCount: 10, // 6 unique + 4 merged
  expectedOverrideCount: 9, // Sum of all overrides
};

/**
 * Reference integrity test cases
 * Tests bidirectional references between musicians and bands
 */
export const referenceIntegrityTests = [
  {
    musicianId: 'musician_boheme_guillaume_001',
    expectedBands: ['boheme', 'canto', 'jazzola', 'trio-rsh'],
    description: 'Guillaume Souriau should reference all 4 bands',
  },
  {
    musicianId: 'musician_boheme_jacques_001',
    expectedBands: ['boheme', 'jazzola'],
    description: 'Jacques Julienne should reference 2 bands',
  },
  {
    musicianId: 'musician_canto_antoine_001',
    expectedBands: ['canto', 'jazzola', 'trio-rsh'],
    description: 'Antoine Hervier should reference 3 bands',
  },
  {
    musicianId: 'musician_canto_alice_001',
    expectedBands: ['boheme'],
    description: 'Alice Dupont should reference only boheme',
  },
];

/**
 * Asset validation test cases
 * Tests that images are correctly identified and categorized
 */
export const assetValidationTests = [
  {
    fileName: 'IMG_0783.JPG',
    expectedCategory: 'standard',
    sourceBand: 'boheme',
  },
  {
    fileName: 'IMG_0790.JPG',
    expectedCategory: 'standard',
    sourceBand: 'canto',
  },
  {
    fileName: 'IMG_0796.JPG',
    expectedCategory: 'standard',
    sourceBand: 'jazzola',
  },
];

/**
 * Helper to get all musicians as a flat array with source tracking
 */
export function getAllMusiciansWithSources() {
  const all = [];
  for (const [bandSlug, musicians] of Object.entries(sampleMusicians)) {
    for (const musician of musicians) {
      all.push({
        musician,
        sourceBand: bandSlug,
        sourceId: musician._id,
      });
    }
  }
  return all;
}

/**
 * Helper to verify musician name normalization
 */
export function getExpectedNormalizedNames() {
  return {
    'Guillaume Souriau': 'guillaume-souriau',
    'GUILLAUME SOURIAU': 'guillaume-souriau',
    '  Guillaume  Souriau  ': 'guillaume-souriau',
    'Frédéric Robert': 'frederic-robert',
    'Jacques Julienne': 'jacques-julienne',
    'Antoine Hervier': 'antoine-hervier',
  };
}

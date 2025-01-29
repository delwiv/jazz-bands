db = db.getSiblingDB('boheme');

db.createUser({
  user: 'boheme',
  pwd: process.env.MONGODB_BOHEME_PASSWORD,
  roles: [{ role: 'readWrite', db: 'boheme' }]
});

db = db.getSiblingDB('mpquartet');
db.createUser({
  user: 'mpquartet',
  pwd: process.env.MONGODB_MPQUARTET_PASSWORD,
  roles: [{ role: 'readWrite', db: 'mpquartet' }]
});

db = db.getSiblingDB('jazzola');
db.createUser({
  user: 'jazzola',
  pwd: process.env.MONGODB_JAZZOLA_PASSWORD,
  roles: [{ role: 'readWrite', db: 'jazzola' }]
});

db = db.getSiblingDB('swing-family');
db.createUser({
  user: 'swing-family',
  pwd: process.env.MONGODB_SWINGFAMILY_PASSWORD,
  roles: [{ role: 'readWrite', db: 'swing-family' }]
});

db = db.getSiblingDB('trio-rsh');
db.createUser({
  user: 'trio-rsh',
  pwd: process.env.MONGODB_TRIORSH_PASSWORD,
  roles: [{ role: 'readWrite', db: 'trio-rsh' }]
});

db = db.getSiblingDB('west-side-trio');
db.createUser({
  user: 'west-side-trio',
  pwd: process.env.MONGODB_WESTSIDETRIO_PASSWORD,
  roles: [{ role: 'readWrite', db: 'west-side-trio' }]
});

db = db.getSiblingDB('managr');
db.createUser({
  user: 'managr',
  pwd: process.env.MONGODB_MANAGR_PASSWORD,
  roles: [{ role: 'readWrite', db: 'managr' }]
});

db = db.getSiblingDB('managr');
db.createUser({
  user: 'managr',
  pwd: process.env.MONGODB_MANAGR_PASSWORD,
  roles: [{ role: 'readWrite', db: 'managr' }]
});

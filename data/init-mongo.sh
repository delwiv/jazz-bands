#!/bin/bash

mongo -u root -p ${MONGODB_ROOT_PASSWORD} <<EOF
use boheme;
db.createUser({ user: 'boheme', pwd: '$MONGODB_BOHEME_PASSWORD', roles: [{ role: 'readWrite', db: 'boheme' }] });

use mpquartet;
db.createUser({ user: 'mpquartet', pwd: '$MONGODB_MPQUARTET_PASSWORD', roles: [{ role: 'readWrite', db: 'mpquartet' }] });

use jazzola;
db.createUser({ user: 'jazzola', pwd: '$MONGODB_JAZZOLA_PASSWORD', roles: [{ role: 'readWrite', db: 'jazzola' }] });

use swing-family;
db.createUser({ user: 'swing-family', pwd: '$MONGODB_SWINGFAMILY_PASSWORD', roles: [{ role: 'readWrite', db: 'swing-family' }] });

use trio-rsh;
db.createUser({ user: 'trio-rsh', pwd: '$MONGODB_TRIORSH_PASSWORD', roles: [{ role: 'readWrite', db: 'trio-rsh' }] });

use west-side-trio;
db.createUser({ user: 'west-side-trio', pwd: '$MONGODB_WESTSIDETRIO_PASSWORD', roles: [{ role: 'readWrite', db: 'west-side-trio' }] });

use managr;
db.createUser({ user: 'managr', pwd: '$MONGODB_MANAGR_PASSWORD', roles: [{ role: 'readWrite', db: 'managr' }] });

# use boheme;
# db.updateUser('boheme', { pwd: '$MONGODB_BOHEME_PASSWORD' });
#
# use mpquartet;
# db.updateUser('mpquartet', { pwd: '$MONGODB_MPQUARTET_PASSWORD' });
#
# use jazzola;
# db.updateUser('jazzola', { pwd: '$MONGODB_JAZZOLA_PASSWORD' });
#
# use swing-family;
# db.updateUser('swing-family', { pwd: '$MONGODB_SWINGFAMILY_PASSWORD' });
#
# use trio-rsh;
# db.updateUser('trio-rsh', { pwd: '$MONGODB_TRIORSH_PASSWORD' });
#
# use west-side-trio;
# db.updateUser('west-side-trio', { pwd: '$MONGODB_WESTSIDETRIO_PASSWORD' });
#
# use managr;
# db.updateUser('managr', { pwd: '$MONGODB_MANAGR_PASSWORD' });

EOF



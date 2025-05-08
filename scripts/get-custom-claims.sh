#!/usr/bin/env bash
#
# get-custom-claims.sh
#
# Usage:
#   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account.json"
#   chmod +x get-custom-claims.sh
#   ./get-custom-claims.sh USER_UID
#

if [ $# -ne 1 ]; then
  echo "Usage: $0 <USER_UID>"
  exit 1
fi

USER_UID="$1"

# install firebase-admin locally (silently)
npm install firebase-admin >/dev/null 2>&1

# fetch and pretty-print the customClaims JSON
node -e "
const admin = require('firebase-admin');
admin.initializeApp();  // reads GOOGLE_APPLICATION_CREDENTIALS
admin
  .auth()
  .getUser('$USER_UID')
  .then(user => {
    console.log(JSON.stringify(user.customClaims || {}, null, 2));
  })
  .catch(err => {
    console.error('Error fetching user:', err.message || err);
    process.exit(1);
  });
"
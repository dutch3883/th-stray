#!/usr/bin/env bash
#
# set-role-claim.sh
#
# Usage:
#   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account.json"
#   chmod +x set-role-claim.sh
#   ./set-role-claim.sh USER_UID ROLE_NAME
#

if [ $# -ne 2 ]; then
  echo "Usage: $0 <USER_UID> <ROLE_NAME>"
  exit 1
fi

USER_UID="$1"
ROLE="$2"

# install firebase-admin locally (silently)
npm install firebase-admin >/dev/null 2>&1

# set the custom claim and report status
node -e "
const admin = require('firebase-admin');
admin.initializeApp();  // reads GOOGLE_APPLICATION_CREDENTIALS

admin
  .auth()
  .setCustomUserClaims('$USER_UID', { role: '$ROLE' })
  .then(() => {
    console.log('✅ Custom claim \"role\": \"$ROLE\" set for user $USER_UID');
  })
  .catch(err => {
    console.error('❌ Error setting custom claim:', err.message || err);
    process.exit(1);
  });
"
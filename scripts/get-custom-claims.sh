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

# Check if service account credentials are available
if [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  echo "Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set"
  echo "Please set it to the path of your service account JSON file:"
  echo "export GOOGLE_APPLICATION_CREDENTIALS=\"/path/to/your-service-account.json\""
  exit 1
fi

# Get access token using service account
ACCESS_TOKEN=$(gcloud auth print-access-token --account-file="$GOOGLE_APPLICATION_CREDENTIALS" 2>/dev/null)

if [ $? -ne 0 ]; then
  echo "Error: Failed to get access token. Please check your service account credentials."
  exit 1
fi

# Get custom claims using Firebase Auth REST API
curl --silent --location "https://identitytoolkit.googleapis.com/v1/projects/th-stray/accounts:lookup?key=fakeapikey" \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $ACCESS_TOKEN" \
--data "{
    \"localId\": [\"$USER_UID\"]
  }" | jq -r '.users[0].customAttributes // "{}"'
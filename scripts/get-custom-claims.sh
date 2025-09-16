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

# Store the currently active account (if any) for restoration
ORIGINAL_ACCOUNT=$(gcloud config get-value account 2>/dev/null)

# Function to cleanup and restore original account
cleanup() {
  echo "Cleaning up..."
  
  # Get the service account email from the credentials file
  SERVICE_ACCOUNT_EMAIL=$(jq -r '.client_email' "$GOOGLE_APPLICATION_CREDENTIALS" 2>/dev/null)
  
  if [ -n "$SERVICE_ACCOUNT_EMAIL" ]; then
    # Revoke the service account
    gcloud auth revoke "$SERVICE_ACCOUNT_EMAIL" --quiet 2>/dev/null
  fi
  
  # Restore original account if there was one
  if [ -n "$ORIGINAL_ACCOUNT" ] && [ "$ORIGINAL_ACCOUNT" != "(unset)" ]; then
    gcloud config set account "$ORIGINAL_ACCOUNT" --quiet 2>/dev/null
  fi
}

# Set up trap to ensure cleanup happens on script exit
trap cleanup EXIT

# Activate service account and get access token
gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS" --quiet

if [ $? -ne 0 ]; then
  echo "Error: Failed to activate service account. Please check your service account credentials."
  exit 1
fi

ACCESS_TOKEN=$(gcloud auth print-access-token --project=th-stray 2>/dev/null)

if [ $? -ne 0 ]; then
  echo "Error: Failed to get access token. Please check your service account credentials."
  exit 1
fi

# Get custom claims using Firebase Auth REST API
echo "Fetching custom claims for user: $USER_UID"

RESPONSE=$(curl --silent --show-error --fail --location "https://identitytoolkit.googleapis.com/v1/projects/th-stray/accounts:lookup" \
--header 'Content-Type: application/json' \
--header "Authorization: Bearer $ACCESS_TOKEN" \
--data "{
    \"localId\": [\"$USER_UID\"]
  }" 2>&1)

CURL_EXIT_CODE=$?

if [ $CURL_EXIT_CODE -ne 0 ]; then
  echo "Error: API request failed with exit code $CURL_EXIT_CODE"
  echo "Response: $RESPONSE"
  exit 1
fi

# Check if response contains an error
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "Error: API returned an error:"
  echo "$RESPONSE" | jq -r '.error.message // .error'
  exit 1
fi

# Check if user was found
if echo "$RESPONSE" | jq -e '.users | length == 0' > /dev/null 2>&1; then
  echo "Error: User with UID '$USER_UID' not found"
  exit 1
fi

# Extract and display custom claims
CUSTOM_CLAIMS=$(echo "$RESPONSE" | jq -r '.users[0].customAttributes // "{}"')
echo "Custom claims: $CUSTOM_CLAIMS"
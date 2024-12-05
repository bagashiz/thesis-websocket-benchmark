#!/bin/bash

# Exit on any error
set -e

# Input validation
if [ $# -ne 1 ]; then
  echo "Usage: $0 <name>"
  echo "Example: $0 test_run"
  exit 1
fi

name=$1
result="scripts/results/${name}/summary.json"
json="json/${name}.json"
json_dir=$(dirname "$json")

# Ensure directories exist
mkdir -p "$json_dir"

# Validate input files
if [ ! -f "$result" ]; then
  echo "Error: Result file '$result' does not exist."
  exit 1
fi

if [ ! -r "$result" ]; then
  echo "Error: Cannot read result file '$result'. Check permissions."
  exit 1
fi

# Validate JSON format of result file
if ! jq empty "$result" 2>/dev/null; then
  echo "Error: Invalid JSON in result file '$result'"
  exit 1
fi

# Create or update summary file
if [ -f "$json" ]; then
  if [ ! -w "$json" ]; then
    echo "Error: Cannot write to summary file '$json'. Check permissions."
    exit 1
  fi

  if [ -s "$json" ]; then
    # Validate existing summary JSON
    if ! jq empty "$json" 2>/dev/null; then
      echo "Error: Invalid JSON in existing summary file '$json'"
      exit 1
    fi

    # Append the new JSON object to the existing array
    if ! jq --slurpfile new "$result" '. + $new' "$json" >"${json}.tmp"; then
      echo "Error: Failed to merge JSON files"
      rm -f "${json}.tmp"
      exit 1
    fi
    mv "${json}.tmp" "$json"
  else
    # Initialize summary file with the first JSON object as an array
    if ! jq --slurp . "$result" >"$json"; then
      echo "Error: Failed to create initial summary"
      exit 1
    fi
  fi
else
  # Create new summary file with the first JSON object as an array
  if ! jq --slurp . "$result" >"$json"; then
    echo "Error: Failed to create summary file"
    exit 1
  fi
fi

echo "Successfully appended ${name} summary to ${json}"

# Remove the summary json
rm -f "$result"

# Display summary file contents
echo "Current summary contents:"
jq '.[-10:]' "$json"

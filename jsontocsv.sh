#!/bin/bash

dir="json"
output_dir="csv"

if [ ! -d "$dir" ] || [ -z "$(ls -A "$dir"/*.json 2>/dev/null)" ]; then
  if [ ! -d "$dir" ]; then
    echo "Directory $dir does not exist. Run the tests first."
  else
    echo "Directory $dir does not contain any .json files. Run the tests first."
  fi
  echo
  echo "Hint: task k6 -- {test_name}"
  exit 1
fi

mkdir -p "$output_dir"

process_file() {
  local file=$1
  local metric_type=$2
  local output="$output_dir/${metric_type}.csv"
  local length
  local count
  local latency
  local throughput
  local concurrent_users
  local data_size

  # csv header
  echo "no,concurrent_users,data_size,latency_avg(ms),throughput(/s)" >"$output"

  length=$(jq 'length' "$file")

  for ((i = 0; i < length; i++)); do
    count=$((i + 1))
    concurrent_users=$(jq -r ".[${i}].concurrent_users // \"\"" "$file")
    data_size=$(jq -r ".[${i}].data_size // \"\"" "$file")
    latency=$(jq -r ".[${i}].latency_avg // \"\"" "$file")
    throughput=$(jq -r ".[${i}].throughput // \"\"" "$file")
    echo "$count,$concurrent_users,$data_size,$latency,$throughput" >>"$output"
  done
}

for metric in concurrent dataflow nonpersistent persistent; do
  if [ -f "$dir/${metric}.json" ]; then
    process_file "$dir/${metric}.json" "$metric"
  fi
done

echo "Created separate files in directory: $output_dir/"
echo "Contents of separate files:"

shopt -s nullglob
csv_files=("$output_dir"/*.csv)

if [ ${#csv_files[@]} -eq 0 ]; then
  echo "No CSV files found in directory: $output_dir/"
else
  for f in "${csv_files[@]}"; do
    echo "=== $(basename "$f") ==="
    cat "$f"
    echo
  done
fi

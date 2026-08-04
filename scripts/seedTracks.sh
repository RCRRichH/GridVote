#!/bin/bash

TABLE="Tracks"

declare -a tracks=(
  "Spa"
  "Suzuka"
  "Interlagos"
  "Nurburgring GP"
  "Brands Hatch"
  "Laguna Seca"
)

for track in "${tracks[@]}"; do
  aws dynamodb put-item \
    --table-name $TABLE \
    --item "{\"trackName\":{\"S\":\"$track\"}, \"disabledUntil\":{\"N\":\"0\"}}"
done

echo "Tracks seeded."

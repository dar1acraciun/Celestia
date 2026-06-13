#!/bin/bash
# Uploads all constellation images (lines + nolines) to the backend.
# Usage: ./upload_constellation_images.sh [BASE_URL]
# Default BASE_URL: http://localhost:8080

BASE_URL="${1:-http://localhost:8080}"
IMAGES_DIR="C:/Users/Asus-pc/OneDrive/Pictures/poze site"

success=0
failed=0

for lines_file in "$IMAGES_DIR"/Const_*_lines001.png; do
    filename=$(basename "$lines_file")

    # Extract name part: Const_Andromeda_lines001.png → Andromeda
    name_part="${filename#Const_}"
    name_part="${name_part%_lines001.png}"
    # Replace underscores with spaces
    name="${name_part//_/ }"
    # URL-encode spaces for the path
    name_encoded="${name// /%20}"

    nolines_file="${lines_file/_lines001/_nolines001}"

    if [ ! -f "$nolines_file" ]; then
        echo "WARNING: missing nolines image for '$name', skipping"
        ((failed++))
        continue
    fi

    echo -n "Uploading '$name'... "
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$BASE_URL/constellations/$name_encoded/images" \
        -F "linesImage=@$lines_file" \
        -F "nolinesImage=@$nolines_file")

    if [ "$response" = "200" ]; then
        echo "OK"
        ((success++))
    else
        echo "FAILED (HTTP $response)"
        ((failed++))
    fi
done

echo ""
echo "Done: $success uploaded, $failed failed"

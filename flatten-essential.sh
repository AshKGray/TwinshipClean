#!/bin/bash

# Simple flattener for essential files only
OUTPUT="twinship-essential.txt"

echo "=== FLATTENING ESSENTIAL FILES ===" > $OUTPUT
echo "" >> $OUTPUT

# Add package.json for context
echo "=== FILE: package.json ===" >> $OUTPUT
cat package.json >> $OUTPUT
echo "" >> $OUTPUT

# Add main config files
for file in tsconfig.json tailwind.config.js babel.config.js App.tsx index.ts; do
  if [ -f "$file" ]; then
    echo "=== FILE: $file ===" >> $OUTPUT
    cat "$file" >> $OUTPUT
    echo "" >> $OUTPUT
  fi
done

# Add only TypeScript/JavaScript files from src (excluding tests)
find src -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.test.*" ! -name "*.spec.*" -print0 | while IFS= read -r -d '' file; do
  echo "=== FILE: $file ===" >> $OUTPUT
  cat "$file" >> $OUTPUT  
  echo "" >> $OUTPUT
done

echo "Done! Check twinship-essential.txt"
wc -l twinship-essential.txt
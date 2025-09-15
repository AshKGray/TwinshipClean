#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Common galaxy background blurhash (generated from galaxybackground.png)
const GALAXY_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

const filesToUpdate = [
  'src/screens/SettingsScreen.tsx',
  'src/screens/TwintuitionScreen.tsx',
  'src/screens/assessment/AssessmentLoadingScreen.tsx',
  'src/screens/assessment/AssessmentRecommendationsScreen.tsx',
  'src/screens/assessment/PairComparisonScreen.tsx',
  'src/screens/onboarding/ColorSelectionScreen.tsx',
  'src/screens/onboarding/TwinTypeScreen.tsx',
  'src/screens/onboarding/PhotoSetupScreen.tsx'
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;

    // Replace Image import from react-native
    if (content.includes('import { ') && content.includes('Image') && content.includes('} from "react-native"')) {
      content = content.replace(
        /(import\s*{\s*[^}]*),\s*Image\s*([^}]*}\s*from\s*"react-native")/,
        '$1$2'
      );

      // Add expo-image import
      const importLines = content.split('\n');
      const reactNativeImportIndex = importLines.findIndex(line => line.includes('from "react-native"'));
      if (reactNativeImportIndex !== -1) {
        importLines.splice(reactNativeImportIndex + 1, 0, 'import { Image } from "expo-image";');
        content = importLines.join('\n');
        updated = true;
      }
    }

    // Replace ImageBackground import from react-native
    if (content.includes('import { ') && content.includes('ImageBackground') && content.includes('} from "react-native"')) {
      content = content.replace(
        /(import\s*{\s*[^}]*),\s*ImageBackground\s*([^}]*}\s*from\s*"react-native")/,
        '$1$2'
      );

      // Add expo-image import for ImageBackground
      const importLines = content.split('\n');
      const reactNativeImportIndex = importLines.findIndex(line => line.includes('from "react-native"'));
      if (reactNativeImportIndex !== -1) {
        importLines.splice(reactNativeImportIndex + 1, 0, 'import { ImageBackground } from "expo-image";');
        content = importLines.join('\n');
        updated = true;
      }
    }

    // Replace Image/ImageBackground resizeMode with contentFit and add progressive loading
    content = content.replace(
      /(<Image[^>]*source={require\("[^"]*galaxybackground\.png"\)}[^>]*resizeMode=)"cover"/g,
      '$1"cover"\n        contentFit="cover"\n        placeholder={{ blurhash: \'' + GALAXY_BLURHASH + '\' }}\n        transition={200}'
    );

    content = content.replace(
      /(<ImageBackground[^>]*source={require\("[^"]*galaxybackground\.png"\)}[^>]*style={{[^}]*}})/g,
      '$1\n      contentFit="cover"\n      placeholder={{ blurhash: \'' + GALAXY_BLURHASH + '\' }}\n      transition={200}'
    );

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`⚠️  No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// Update all files
filesToUpdate.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    updateFile(fullPath);
  } else {
    console.log(`⚠️  File not found: ${fullPath}`);
  }
});

console.log('\n✨ Image optimization script completed!');
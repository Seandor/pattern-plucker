// Import required modules
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

// Activate the extension
function activate(context) {
  // Register the command
  const disposable = vscode.commands.registerCommand('patternplucker.exeute', (folder) => {
    // Get the folder path
    const folderPath = folder.fsPath;

    // Search for JS files and find import dependencies
    searchJsFilesAndFindStrings(folderPath);
  });

  context.subscriptions.push(disposable);
}

// Search for JS files and find import dependencies
function searchJsFilesAndFindStrings(folderPath) {
  // Helper function to recursively search for JS files
  function searchJsFilesRecursively(currentPath) {
    const files = fs.readdirSync(currentPath);
    const stringCollection = [];

    files.forEach((file) => {
      const filePath = path.join(currentPath, file);
      const fileStat = fs.statSync(filePath);

      // Check if the file is a directory, then search recursively
      if (fileStat.isDirectory()) {
        stringCollection.push(...searchJsFilesRecursively(filePath));
      } else if (path.extname(filePath) === '.js') {
        // Process the JS file
        stringCollection.push(...processJsFile(filePath));
      }
    });

    return stringCollection;
  }

  // Function to process a JS file and find strings that match the pattern
  function processJsFile(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');

    // Find strings that match the pattern
    const patternRegex = /_TL_\(['"](.*)['"]\)/g;
    let match;
    const stringCollection = [];

    while ((match = patternRegex.exec(data)) !== null) {
      // Ignore relative imports
      if (!match[1].startsWith('.')) {
        // Add the dependency to the array
        const dependency = match[1].split('/')[0];
        if (dependency.startsWith('@')) {
          stringCollection.push(dependency + '/' + match[1].split('/')[1]);
        } else {
          stringCollection.push(dependency);
        }
      }
    }

    return stringCollection;
  }

  // Start searching for JS files recursively and remove duplicate dependencies
  const allStrings = [...new Set(searchJsFilesRecursively(folderPath))];

  // Write allStrings to output.txt in the current folder
  const outputPath = path.join(folderPath, 'output.txt');
  fs.writeFileSync(outputPath, allStrings.join('\n'));

  // Show a success message when writing the file successfully
  vscode.window.showInformationMessage('output.txt updated successfully with all strings.');
}

// Export the activate function
exports.activate = activate;

// Deactivate the extension
function deactivate() {}

// Export the deactivate function
exports.deactivate = deactivate;
#!/bin/bash

# Ensure we're in the project root
cd "$(dirname "$0")"

# Show current directory for debugging
echo "Building from directory: $(pwd)"

# List contents to verify structure
echo "Project structure:"
ls -la

# Verify client directory exists
if [ ! -d "client" ]; then
    echo "ERROR: client directory not found!"
    exit 1
fi

# Verify index.html exists
if [ ! -f "client/index.html" ]; then
    echo "ERROR: client/index.html not found!"
    exit 1
fi

# Run the build commands
echo "Starting build process..."
npm run build

echo "Build completed successfully!"
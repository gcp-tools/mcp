#!/bin/bash

# Load nvm and use the correct Node version
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Use the Node version specified in .nvmrc
nvm use

# Change to the correct working directory
cd /Users/si/code/gcp-tools-mcp

# Start the MCP server with proper stdio handling
exec node dist/index.mjs

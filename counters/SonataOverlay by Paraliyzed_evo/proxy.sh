#!/bin/bash
cd "$(dirname "$0")"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    ./lib/proxy-linux
elif [[ "$OSTYPE" == "darwin"* ]]; then
    ./lib/proxy-macos
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi
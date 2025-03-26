#!/bin/bash

echo "🚀 Starting virtual X11 display (Xvfb)..."
Xvfb :99 -screen 0 1920x1080x24 &

export DISPLAY=:99
echo "✅ DISPLAY set to $DISPLAY"

echo "🚀 Starting Node app..."
exec node --max-old-space-size=8192 dist/main

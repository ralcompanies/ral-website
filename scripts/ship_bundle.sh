#!/bin/bash
# Publishes /tmp/claude-0/inc.bundle to a password-protected Cloudflare "transfer" deployment
# so the linked Mac can fetch it and push to GitHub.
set -e; source ~/.ral/env
rm -rf /tmp/claude-0/xdeploy && mkdir -p /tmp/claude-0/xdeploy/out && cp -r /home/claude/ral-site/functions /tmp/claude-0/xdeploy/
cp /tmp/claude-0/inc.bundle /tmp/claude-0/xdeploy/out/inc.bundle
cd /tmp/claude-0/xdeploy && npx --prefix /home/claude/ral-site wrangler pages deploy out --project-name ral-website --branch transfer --commit-dirty=true 2>&1 | grep -E "Success|rror" || true
sha256sum /tmp/claude-0/inc.bundle | cut -c1-16

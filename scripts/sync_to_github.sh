#!/bin/bash
# Builds an incremental git bundle of commits not yet on GitHub (tracked via tag gh-synced).
set -e; cd /home/claude/ral-site
BASE=$(git rev-parse -q --verify gh-synced || echo "")
if [ -n "$BASE" ]; then git bundle create /tmp/claude-0/inc.bundle gh-synced..main; else git bundle create /tmp/claude-0/inc.bundle --all; fi
ls -la /tmp/claude-0/inc.bundle

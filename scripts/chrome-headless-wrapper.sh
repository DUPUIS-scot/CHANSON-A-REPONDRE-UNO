#!/usr/bin/env bash
set -euo pipefail

# GitHub-hosted Ubuntu runners can start Chrome headlessly more reliably when
# sandboxing and shared-memory assumptions are made explicit.
exec /usr/bin/google-chrome \
  --no-sandbox \
  --disable-dev-shm-usage \
  "$@"

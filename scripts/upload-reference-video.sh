#!/usr/bin/env bash
# Upload the original video provided by the project owner without transcoding.
# Usage (from any directory, within your local Pokemon- clone):
#   bash scripts/upload-reference-video.sh "/path/to/original.mp4"
set -euo pipefail

EXPECTED_SIZE=74415401
EXPECTED_SHA256="a261c86ff3c7b57fd8c5b1bd8baab201ccb95a17cab82d315dbd089cd57ccafd"
DESTINATION="assets/reference-video/Pokemon_Arena_2D_Big_Kid_Nation_Original.mp4"

if [[ $# -ne 1 || ! -f "$1" ]]; then
  printf 'Usage: bash scripts/upload-reference-video.sh "/path/to/Pokemon Arena 2D by Big Kid Nation (Fan Game, 95%% real gameplay)(2).mp4"\n' >&2
  exit 2
fi
command -v git >/dev/null || { echo "git is required." >&2; exit 2; }
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || { echo "Run from a cloned Git repository." >&2; exit 2; }
SOURCE="$1"
case "$SOURCE" in /*) ;; *) SOURCE="$(cd "$(dirname "$SOURCE")" && pwd)/$(basename "$SOURCE")";; esac
if [[ -f "$ROOT/$DESTINATION" && "$SOURCE" -ef "$ROOT/$DESTINATION" ]]; then
  echo "The source file is already at the destination."
fi
if command -v sha256sum >/dev/null 2>&1; then
  ACTUAL_SHA256="$(sha256sum "$SOURCE" | awk '{print $1}')"
elif command -v shasum >/dev/null 2>&1; then
  ACTUAL_SHA256="$(shasum -a 256 "$SOURCE" | awk '{print $1}')"
else
  echo "sha256sum or shasum is required." >&2
  exit 2
fi
if [[ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]]; then
  echo "File checksum mismatch. Refusing to upload a different video." >&2
  echo "Expected: $EXPECTED_SHA256" >&2
  echo "Actual:   $ACTUAL_SHA256" >&2
  exit 1
fi
if command -v stat >/dev/null 2>&1; then
  SIZE="$(wc -c < "$SOURCE" | tr -d '[:space:]')"
  if [[ "$SIZE" != "$EXPECTED_SIZE" ]]; then
    echo "File size mismatch: $SIZE vs $EXPECTED_SIZE" >&2
    exit 1
  fi
fi
cd "$ROOT"
if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "Please switch to main before uploading: git switch main" >&2
  exit 2
fi
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Working tree has uncommitted tracked changes. Commit or stash them first." >&2
  exit 2
fi
mkdir -p "$(dirname "$DESTINATION")"
if [[ "$SOURCE" != "$ROOT/$DESTINATION" ]]; then cp "$SOURCE" "$DESTINATION"; fi
git add -- "$DESTINATION"
if git diff --cached --quiet -- "$DESTINATION"; then
  echo "The original MP4 already exists in the Git repository with identical bytes."
  exit 0
fi
git commit -m "Add original Big Kid Nation Pokémon Arena gameplay reference video"
git push origin main
echo "Upload complete: https://github.com/hbkim1101/Pokemon-/blob/main/$DESTINATION"

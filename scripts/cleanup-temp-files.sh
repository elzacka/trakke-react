#!/bin/bash
# Cleanup temporary and personal development files
# This script helps identify and optionally remove temporary files from your development environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔍 Scanning for temporary and personal development files..."
echo ""

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Arrays to store findings
declare -a PERSONAL_FILES
declare -a SCREENSHOT_FILES
declare -a DEBUG_FILES
declare -a SECRET_FILES

# Change to project root
cd "$PROJECT_ROOT"

# Find personal/temp files
echo "📝 Personal notes and documentation:"
while IFS= read -r file; do
    PERSONAL_FILES+=("$file")
done < <(find . -maxdepth 2 -type f \( \
    -name "CLAUDE.md" -o \
    -name "TODO.md" -o \
    -name "NOTES.md" -o \
    -name "*.local.md" -o \
    -name "*Console*log*.md" -o \
    -name "*Github*errors*.md" \
\) 2>/dev/null || true)

if [ ${#PERSONAL_FILES[@]} -eq 0 ]; then
    echo "  ${GREEN}✓${NC} No personal documentation files found"
else
    for file in "${PERSONAL_FILES[@]}"; do
        size=$(du -h "$file" | cut -f1)
        echo "  ${YELLOW}•${NC} $file ($size)"
    done
fi

echo ""
echo "📸 Screenshots and media files:"
while IFS= read -r file; do
    SCREENSHOT_FILES+=("$file")
done < <(find . -maxdepth 2 -type f \( \
    -name "*.png" -o \
    -name "*.jpg" -o \
    -name "*.jpeg" -o \
    -name "*.gif" -o \
    -name "*.mp4" \
\) ! -path "./public/*" ! -path "./src/assets/*" ! -path "./node_modules/*" 2>/dev/null || true)

if [ ${#SCREENSHOT_FILES[@]} -eq 0 ]; then
    echo "  ${GREEN}✓${NC} No loose screenshot/media files found"
else
    for file in "${SCREENSHOT_FILES[@]}"; do
        size=$(du -h "$file" | cut -f1)
        echo "  ${YELLOW}•${NC} $file ($size)"
    done
fi

echo ""
echo "🐛 Debug and log files:"
while IFS= read -r file; do
    DEBUG_FILES+=("$file")
done < <(find . -maxdepth 3 -type f \( \
    -name "*.log" -o \
    -name "*.dump" -o \
    -name "*.trace" -o \
    -name "*.har" \
\) ! -path "./node_modules/*" 2>/dev/null || true)

if [ ${#DEBUG_FILES[@]} -eq 0 ]; then
    echo "  ${GREEN}✓${NC} No debug files found"
else
    for file in "${DEBUG_FILES[@]}"; do
        size=$(du -h "$file" | cut -f1)
        echo "  ${YELLOW}•${NC} $file ($size)"
    done
fi

echo ""
echo "🔒 Checking for potential secret files:"
while IFS= read -r file; do
    SECRET_FILES+=("$file")
done < <(find . -maxdepth 3 -type f \( \
    -name "*.env" -o \
    -name "*secret*" -o \
    -name "*credential*" -o \
    -name "*.pem" -o \
    -name "*.key" \
\) ! -name ".env.example" ! -path "./node_modules/*" ! -path "./.git/*" 2>/dev/null || true)

if [ ${#SECRET_FILES[@]} -eq 0 ]; then
    echo "  ${GREEN}✓${NC} No secret files found (good!)"
else
    echo "  ${RED}⚠${NC} Found potential secret files:"
    for file in "${SECRET_FILES[@]}"; do
        echo "  ${RED}!${NC} $file"
    done
fi

# Check directories
echo ""
echo "📁 Temporary directories:"
temp_dirs=$(find . -maxdepth 2 -type d \( \
    -name "notes" -o \
    -name "debug" -o \
    -name "scratch" -o \
    -name "personal" -o \
    -name ".scratch" \
\) ! -path "./node_modules/*" 2>/dev/null || true)

if [ -z "$temp_dirs" ]; then
    echo "  ${GREEN}✓${NC} No temporary directories found"
else
    echo "$temp_dirs" | while read -r dir; do
        size=$(du -sh "$dir" 2>/dev/null | cut -f1)
        count=$(find "$dir" -type f 2>/dev/null | wc -l)
        echo "  ${YELLOW}•${NC} $dir/ ($size, $count files)"
    done
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════"
TOTAL_FILES=$((${#PERSONAL_FILES[@]} + ${#SCREENSHOT_FILES[@]} + ${#DEBUG_FILES[@]}))
echo "Found $TOTAL_FILES temporary/personal files"

if [ ${#SECRET_FILES[@]} -gt 0 ]; then
    echo "${RED}⚠ WARNING: ${#SECRET_FILES[@]} potential secret file(s) found!${NC}"
    echo "  These files should be added to .gitignore or removed"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""

# Ask user what to do
if [ $TOTAL_FILES -eq 0 ] && [ ${#SECRET_FILES[@]} -eq 0 ]; then
    echo "${GREEN}✓ All clean! No temporary files to clean up.${NC}"
    exit 0
fi

echo "What would you like to do?"
echo "  1) Delete all temporary files (personal notes, screenshots, debug files)"
echo "  2) Create archive (tar.gz) of temporary files, then delete originals"
echo "  3) List files only (no action)"
echo "  4) Exit without changes"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "🗑️  Deleting temporary files..."

        for file in "${PERSONAL_FILES[@]}" "${SCREENSHOT_FILES[@]}" "${DEBUG_FILES[@]}"; do
            if [ -f "$file" ]; then
                rm "$file"
                echo "  Deleted: $file"
            fi
        done

        for dir in notes debug scratch personal .scratch; do
            if [ -d "$dir" ]; then
                rm -rf "$dir"
                echo "  Deleted: $dir/"
            fi
        done

        echo "${GREEN}✓ Cleanup complete!${NC}"
        ;;

    2)
        ARCHIVE_NAME="temp-files-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        echo ""
        echo "📦 Creating archive: $ARCHIVE_NAME"

        # Create list of files to archive
        files_to_archive=()
        for file in "${PERSONAL_FILES[@]}" "${SCREENSHOT_FILES[@]}" "${DEBUG_FILES[@]}"; do
            if [ -f "$file" ]; then
                files_to_archive+=("$file")
            fi
        done

        # Add directories
        for dir in notes debug scratch personal .scratch; do
            if [ -d "$dir" ]; then
                files_to_archive+=("$dir")
            fi
        done

        if [ ${#files_to_archive[@]} -gt 0 ]; then
            tar -czf "$ARCHIVE_NAME" "${files_to_archive[@]}" 2>/dev/null
            echo "${GREEN}✓ Archive created: $ARCHIVE_NAME${NC}"

            # Now delete originals
            echo ""
            echo "🗑️  Deleting original files..."
            for item in "${files_to_archive[@]}"; do
                rm -rf "$item"
                echo "  Deleted: $item"
            done

            echo ""
            echo "${GREEN}✓ Files archived and cleaned up!${NC}"
            echo "Archive saved to: $PROJECT_ROOT/$ARCHIVE_NAME"
            echo ""
            echo "To extract later: tar -xzf $ARCHIVE_NAME"
        else
            echo "No files to archive"
        fi
        ;;

    3)
        echo ""
        echo "📋 Files listed above. No action taken."
        ;;

    4)
        echo ""
        echo "👋 No changes made. Exiting..."
        ;;

    *)
        echo ""
        echo "Invalid choice. Exiting without changes."
        ;;
esac

# Warn about secret files
if [ ${#SECRET_FILES[@]} -gt 0 ]; then
    echo ""
    echo "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${RED}⚠  SECRET FILES DETECTED - ACTION REQUIRED${NC}"
    echo "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "The following files may contain secrets and were NOT deleted:"
    for file in "${SECRET_FILES[@]}"; do
        echo "  ${RED}!${NC} $file"
    done
    echo ""
    echo "Please review these files and:"
    echo "  1. Add them to .gitignore if they contain secrets"
    echo "  2. Delete them manually if no longer needed"
    echo "  3. Ensure they are never committed to git"
    echo ""
fi

echo ""
echo "Done!"

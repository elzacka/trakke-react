---
description: Deploy current branch for preview testing
---

Deploy the current branch to GitHub Pages for preview:

1. Check current branch name with `git branch --show-current`
2. Ensure all changes are committed
3. Run the build: `npm run build`
4. Push the current branch to GitHub
5. Provide the preview URL that will be available at:
   `https://elzacka.github.io/trakke-react/branch-previews/[branch-name]/`

Note: The preview deployment will be handled by GitHub Actions workflow.

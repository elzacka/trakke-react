Run npm run lint
  npm run lint
  shell: /usr/bin/bash -e {0}

> trakke-react@0.0.0 lint
> eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0


/home/runner/work/trakke-react/trakke-react/src/MapLibreTrakkeApp.tsx
Error:   36:9  error  'searchService' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/trakke-react/trakke-react/src/components/MapLibreMap.tsx
Error:   380:15  error  'mapRect' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/trakke-react/trakke-react/src/components/SearchBox/SearchBox.tsx
Error:   189:9  error  'getResultIcon' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/trakke-react/trakke-react/src/services/searchService.ts
Error:   544:9  error  'shouldShowType' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

✖ 4 problems (4 errors, 0 warnings)

Error: Process completed with exit code 1.
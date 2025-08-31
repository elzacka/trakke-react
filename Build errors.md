Run npm run lint

> trakke-react@0.0.0 lint
> eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0


/home/runner/work/trakke-react/trakke-react/src/data/pois.ts
Warning:   707:51  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
Warning:   715:38  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
Warning:   786:41  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
Warning:   802:48  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/home/runner/work/trakke-react/trakke-react/src/hooks/usePOIData.ts
Error:   84:13  error  'warMemorialElements' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/trakke-react/trakke-react/src/vite-env.d.ts
Warning:   5:18  warning  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

✖ 6 problems (1 error, 5 warnings)

Error: Process completed with exit code 1.

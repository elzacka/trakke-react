Run npm run lint

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:5)

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:6)> trakke-react@0.0.0 lint

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:7)> eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:8)

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:9)

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:10)/home/runner/work/trakke-react/trakke-react/src/WorkingTrakkeApp.tsx

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:11)Warning: 266:6 warning React Hook useEffect has a missing dependency: 'loadPOIsForCurrentViewport'. Either include it or remove the dependency array react-hooks/exhaustive-deps

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:12)ESLint found too many warnings (maximum: 0).

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:13)Warning: 434:6 warning React Hook useEffect has a missing dependency: 'updateMarkersVisibility'. Either include it or remove the dependency array react-hooks/exhaustive-deps

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:14)

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:15)/home/runner/work/trakke-react/trakke-react/src/components/MapLibreMap.tsx

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:16)Warning: 197:6 warning React Hook useEffect has a missing dependency: 'onViewportChange'. Either include it or remove the dependency array. If 'onViewportChange' changes too often, find the parent component that defines it and wrap that definition in useCallback react-hooks/exhaustive-deps

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:17)

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:18)/home/runner/work/trakke-react/trakke-react/src/hooks/useViewportPOIData.ts

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:19)Warning: 88:25 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:20)

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:21)/home/runner/work/trakke-react/trakke-react/src/services/kartverketPOIService.ts

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:22)Warning: 189:50 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:23)Warning: 194:43 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:24)Warning: 215:40 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:25)Warning: 229:40 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:26)Warning: 239:39 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:27)

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:28)/home/runner/work/trakke-react/trakke-react/src/services/osmService.ts

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:29)Warning: 4:25 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:30)

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:31)/home/runner/work/trakke-react/trakke-react/src/services/overpassService.ts

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:32)Warning: 117:60 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:33)Warning: 124:45 warning Unexpected any. Specify a different type @typescript-eslint/no-explicit-any

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:34)

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:35)✖ 12 problems (0 errors, 12 warnings)

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:36)

[](https://github.com/elzacka/trakke-react/actions/runs/17504161313/job/49723948025#step:5:37)Error: Process completed with exit code 1.
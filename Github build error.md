**At Build step:**

3s
Run npm run build

> trakke-react@0.0.0 build
> tsc -b && vite build

Error: src/data/pois.ts(708,20): error TS2322: Type '"cycling"' is not assignable to type 'POIType'.
Error: src/data/pois.ts(716,20): error TS2322: Type '"other_trails"' is not assignable to type 'POIType'.
Error: src/services/kartverketTrailService.ts(72,26): error TS2304: Cannot find name 'KARTVERKET_TRAIL_WMS_URL'.
Error: src/services/overpassService.ts(1051,25): error TS2339: Property 'executeQuery' does not exist on type 'typeof OverpassService'.
Error: src/services/overpassService.ts(1085,25): error TS2339: Property 'executeQuery' does not exist on type 'typeof OverpassService'.
Error: src/services/overpassService.ts(1135,25): error TS2339: Property 'executeQuery' does not exist on type 'typeof OverpassService'.
Error: Process completed with exit code 2.
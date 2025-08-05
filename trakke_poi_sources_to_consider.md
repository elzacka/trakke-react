
# 🌲 Friluftsapp – Datakilder og POI-struktur for Norge

## 🎯 Kategorier og anbefalte datakilder

| Hovedkategori        | Underkategori               | Anbefalt datakilde                                | Kommentar / OSM-tag / Kilde                      |
|----------------------|------------------------------|----------------------------------------------------|--------------------------------------------------|
| **Turløyper**        | Dagsturer                    | Kartverket (Geonorge) + OSM                       | `route=hiking` eller `highway=path` i OSM        |
|                      | Toppturer                    | Kartverket + OSM + Nasjonalparker                 | `sac_scale=mountain_hiking`                      |
|                      | Skiløyper                    | Kartverket (Turrutebasen)                         | `piste:type=nordic` i OSM                        |
| **Bade**             | Badeplasser                  | OSM + kommunedata                                 | `leisure=beach_resort`, `natural=water`          |
|                      | Badeplasser med strand       | OSM                                               | `natural=beach`                                  |
| **Sove**             | Betjente hytter              | OSM + private aktører (NOH, DNT)                  | `tourism=alpine_hut`, `staffed=yes`              |
|                      | Selvbetjente hytter          | OSM + Kartverket + DNT-frivillige                 | `tourism=alpine_hut`, `staffed=no`               |
|                      | Gapahuk / Vindskjul          | OSM + kommunedata                                 | `amenity=shelter`, `shelter_type=lean_to`        |
|                      | Campingplasser               | OSM                                               | `tourism=camp_site`                              |
|                      | Teltplasser                  | OSM (begrenset), kommunedata                      | `tourism=camp_pitch`                             |
|                      | Hengekøyeplasser             | Egendefinert / crowdsourcet                       | Ikke standardisert tag                           |
| **Naturperler**      | Fosser                       | OSM                                               | `natural=waterfall`                              |
|                      | Utsiktspunkter               | OSM                                               | `tourism=viewpoint`                              |
| **Historiske steder**| Kirker og religiøse steder   | OSM                                               | `amenity=place_of_worship`, `historic=church`    |
|                      | Krigsminner                  | OSM + Kulturminnesøk                              | `historic=bunker`, `memorial=war_memorial`       |
|                      | Kulturminner                 | Riksantikvaren (Kulturminnesøk) + OSM             | `historic=*`, `heritage=*`                       |

---

## 🛠 Anbefalte datakilder

### 1. Kartverket / Geonorge
- Turruter, friluftsdata, skiløyper, naturdata
- API: WFS/WMS/GeoJSON/SOSI
- Nettside: https://www.geonorge.no

### 2. OpenStreetMap (OSM)
- Overpass API for `route=hiking`, `tourism=viewpoint`, `natural=waterfall`, `historic=*`
- Ekstra verktøy: https://hiking.waymarkedtrails.org

### 3. Kulturminnesøk (Riksantikvaren)
- API med metadata og posisjon for kulturminner
- https://kulturminnesok.no

### 4. Kommunedata og data.norge.no
- Friluftsliv-data fra kommunenivå
- Søk etter relevante datasett på https://data.norge.no

---

## 🧠 Prompt til Claude Code (CC)

```
I want to display various types of POIs (points of interest) in my React + Leaflet app, using mostly open data sources. The categories include hiking routes, campsites, waterfalls, viewpoints, historic sites, and swimming areas. Use OpenStreetMap (via Overpass API) and Kartverket (Geonorge) as primary sources.

1. For each POI category, create a data loader function that fetches and parses the data into a common GeoJSON format.
2. Display the layers in the map using a filterable category system (checkbox tree like the one I already have).
3. Use matching Material Icons per category.
4. For inaccessible POIs (like "hammock spots"), use a local JSON placeholder dataset for now.

The structure and icons are already defined in my left-side menu, which you can use as reference.
```

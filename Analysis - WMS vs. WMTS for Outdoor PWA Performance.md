The simplest form of data sharing is through APIs that deliver finished map images, such as Web Map Service (WMS) and Cache services (Web Map Tiles Service, WMTS). While these APIs only provide insight into pre-symbolized maps, they are crucial for map visualization.

|   |   |   |
|---|---|---|
|Feature|Web Map Service (WMS)|Cache Services (WMTS)|
|**Data Delivery**|The server sends raster files (PNG or JPEG) upon request.|Based on a cache of pre-generated 256x256 pixel tiles.|
|**Performance**|**Slower.** Images are generated on demand.|**Faster.** Images (tiles) are retrieved immediately from the cache. JPEG images have a smaller file size than PNG, speeding up client transfer.|
|**Flexibility**|**High.** Allows users to freely choose the scale, select the coordinate system, choose the image format, toggle specific map layers (e.g., only roads and water), and set the background color to transparent (using PNG).|**Low.** Can only deliver map images in the **predefined scales (zoom levels)** set within the service. Cannot deliver maps at an arbitrarily chosen scale.|
|**Use Case**|Best for flexible needs like dynamically generating customized map layouts or fetching supplementary information like a map legend.|**Highly Recommended** for general map viewing, especially when speed is critical, similar to how Google Maps or Bing Maps are built.|

Recommendation for an Outdoor PWA

For a typical outdoor or hiking PWA, the priority is usually fast, smooth navigation across standard zoom levels. Therefore, **WMTS (Cache Services) should be used by default**.

WMTS is significantly faster than WMS. This performance benefit is particularly important because the national IT infrastructure for map data is described as being "too old and unstable" to meet societal needs, suffering from increased errors and downtime. Using the most performant, pre-cached solution helps mitigate these infrastructure stability issues.

A developer may use a combination of services: WMTS for the main map display and WMS to fetch complementary data like a map legend.

--------------------------------------------------------------------------------

Configuration Details for WMTS Implementation

Switching from Kartverket's WMS to a WMTS service requires configuring the web mapping client (such as OpenLayers, which is mentioned as the most common Open Source web client for these services) to request pre-generated tiles based on a specific tile matrix set.

The sources provide the exact geometrical and technical parameters necessary for this configuration:

1. Defining Coordinate System and Extent (Zoom Level 0)

To use a cache service, the starting point (Zoom Level 0) for the tile matrix in the chosen coordinate system must be known. If your PWA is built on standard web mapping technology, you likely use **Google Web Mercator**.

The required extent for Zoom Level 0:

|   |   |   |   |   |   |
|---|---|---|---|---|---|
|Coordinate System|EPSG Codes|Xmin|Ymin|Xmax|Ymax|
|**Google Web Mercator**|**3857/900913**|**-20037508.34**|**-20037508.34**|**20037508.34**|**20037508.34**|

Other coordinate systems and their Zoom Level 0 definitions are also provided, including UTM zones (32632-32636 / 25832-25836), Geographical (4326), ETRS-LCC (3034), and ETRS-LAEA (3035).

2. Defining Resolutions (Scales and Tile Size)

The WMTS service only supports predefined scales (Zoom Levels 0–20). The client application must be configured with the corresponding resolutions (tile size in meters) for these levels.

|   |   |   |   |
|---|---|---|---|
|Zoom Level|Scale|Tile Size X (meters)|Tile Size Y (meters)|
|0|1:81920000|5545984|5545984|
|1|1:40960000|2772992|2772992|
|2|1:20480000|1386496|1386496|
|3|1:10240000|693248|693248|
|...|...|...|...|
|10|1:80000|5416|5416|
|20|1:78.125|5.2890625|5.2890625|

_(The full list of resolutions from Zoom Level 0 to 20 is available in the source material__.)_

3. Image Format Selection

The service supports both PNG and JPEG image formats. This choice impacts transfer speed and layering:

|   |   |   |   |
|---|---|---|---|
|Image Format|MIME Type|Background Color|Use Case|
|**JPEG**|`image/jpeg`|White|Faster data transfer due to smaller file size.|
|**PNG**|`image/png`|Transparent|Necessary if the WMTS layer needs a transparent background to be combined/overlaid with other services.|

4. Implementation Resources

While the specific URL for the WMTS capability file is not provided in the sources, they explicitly state where developers can find the necessary code examples for implementation:

• **OpenLayers:** You are advised to "See example code in OpenLayers here".

• **Kartverket's GIT-hub:** You can "Read more about using various web clients with Kartverket's services on **Kartverket's GIT-hub**".

The developer must use the geometric parameters defined above (Extent, Zoom Levels, Resolutions) within these client implementations to successfully configure the WMTS layer.
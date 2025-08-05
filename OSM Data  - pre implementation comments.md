_Last updated: August 05, 2025_



==Topics: data structure, information adjustments, backend and frontend (UX) adjustmens==

## 1. General comments
*Priority: High*

Use: 
- Best UX/UI practice in general and
- best UX/UI practice/best practice or standards for maps/online maps/web-maps. So for my app *Tråkke* I don´t do the mistake of creating and using my own propriatary naming standard or bad way to structure this and that. Inn addition to neccessary translations to equivalent and common used terms in Norway for this context (maps, map knowledge/GIS etc.)

## 2. Adjustments to the Norwegian naming of the suggested POI Category structure
*Priority: High*

To ensure:
1. Correct Norwegian terms for the specific context
2. That common Norwegian terms/combination of terms are used
3. UI copy consistency. Use plural form. Example: *Turstier*, *Krigsminner*, *Fredsmonumenter*

### Friluftsliv (Outdoor Recreation)
**Overnatting (Accommodation)**
- Serverte DNT-hytter -> Betjente DNT-hytter
- Selvbetjente DNT-hytter -> Ubetjente DNT-hytter (DNT huts, but self served. They exist, but maybe they're not able to identify among the huts belonging to the Self-service huts category)
- Selvbetjente hytter -> Ubetjente hytter


## Websites/web-apps for inspiration, additions

### POI and other stuff: A "friluftskart" (scope: Bergen municipality in Norway)
*Priority: Medium*

https://kart.bergen.kommune.no/portal/apps/webappviewer/index.html?id=90167eec6e874f248a8d24157bcb8483&query=Tilrettelegging_friluftsliv_1560_4%2CNavn%2CB%C3%A5lplass%20Myrdalsvatnet

It seems like this website use OSM and other services. 

I found several relevant item types to add to this map, and they are available to activate via the right slider menu. I seems like all of them are its own map layer (*Kartlag*). Please add these if they can be linked to existing and appropriate "things" in OSM.

- Fiskevann på/ved kommunal grunn
- Fiske tillatt område
- Jaktterreng
- Kanopadling
- Parkering
- Rasteplasser
- Bane
- Gondolbaner
- Holdeplasser kollektivtransport
- Togstasjoner
- Informasjonstavler
- Toaletter
- Område for drikkevann
- Bål- og grillplass
- Grindverksbygg med bålplass
- Grindverksbygg uten grill eller bålplass
- Hengekøyeplass


I´m not sure if there is an existing and commonly used best practice for  what kinds of "map item types that exists" and how different "map things" are sorted (taxonomies confusion...) Maybe there are four main map item types? Maybe you can check? Map backgrounds, map layers, POI categories and some additional with "the rest": "Map artifacts" maybe? This part is kind of important I think. Because of the UX/UI in general, inside or outside hamburger/side/other menus, on the main part/map view: What belongs *together* and what belongs *where*.

(Maybe also several artifacts can be found on specific *background maps* or *map themes*, common and uncommon variants:


### UI items: Another "friluftskart" (scope: Norway)
*Priority: Medium and Low (se details below)*
Link: https://norgeskart.avinet.no/

In the screenshot below you find several UI items that I really would like to implement in the app in a version in the near future:
**-Bottom left:** You can click on the button *Temakart* and choose a "map theme". *Placement in my app: In the hamburger menu if the main window is about to be messy.*
*Priority: Medium*
**-The button below _Temakart_:** *Bakgrunnskart*, which is maybe translated to "Map layer".
*Priority: Medium*
**-Somewhere on the map:** A function with the opportunity to click anywhere on the map view to see a selection of info with some small clickable icons below. The sun icon seems to fetch weather data. Probably from MET (though weather data is a function I don´t dare to re-implement at this point.)
*Priority: Medium (click to see coordinates) *Low (all the other info/functions in that component)*
**-Bottom right:** Four square buttons with different navigation options.
*Priority: Low+*
**-Top right:** A hamburger menu-icon. Where I would like to have a menu appear when clicked. In the menu: move/add some functions and settings, and typical things like link to a user manual and other stuff that is better to access from here. To keep the design clean/clear/tidy, especially as more functionality/data/info are implemented/added. *Placement in my app: A suitable place in the left side menu maybe.*
**-Top far right:** A logon button/logon text. As mentioned in an other note I want to  enable admin login (and user registration/login in the future). My main purpose for this (by now) is to be able to have a registration form for adding POI-items manually. And link them to one of the existing categories/subcategories. Or if possible/easy/effective: Add it through OSM if it gets available in my app afterwards and I can link these to the categories/sub-categories in my app. An example: Add coordinates for Hammock spots (*Hengekøyeplasser, as mentioned above under point number 2) which I want to add as a sub-category under *Sove*. And keep empty if OSM doesn´t have any data "tagged" with *hammock* or an equivalent term. I find when I´m out and about in the woods nearby. *Placement in my app: A suitable place in the left side menu, maybe on the bottom. Or in the hamburger menu.* 
*Priority: Low all the other*

*Screenshot:*
![[Norgeskart_Avinet_no.png]]





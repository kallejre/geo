# Basic JS/PHP editor for OSM
This "editor" is so basic and WIP that it doesn't even have backend.
Frontend is built on leaflet with few cues from iD, while backend might be one day built onto Level0 editor.

General structure is going to be built on client-proxy-server architecture, where user alters item in front-end (client),
then submits changes to back-end (proxy) running on PHP, which will then submit changes to OSM (server). In even further 
future backend can be integrated into JS front-end, allowing whole editor to run from github-pages.

## [Open editor](leafdraw.html)

### Features (so far)
* Integration with Editor-Layer-Index to support worldwide imagery.
* Tagging autocomplete integrated with live taginfo API. (Live as oppsed to local cache in [osm lane tool](/osm lane tool)

PS. There's [prototype demo](tag_autocomplete_demo.html) for trying out tagging autocomplete.

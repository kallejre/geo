# Basic JavaScript editor for OSM
This "editor" is so basic and WIP that it doesn't even have backend.
In fact, this map editor runs fully on JS and doesn't need PHP at all.

General structure is almost as single-page-site architecture, where main editing activity is done in editing view, 
while few configuration settings (such as OSM server URL) is defined on other. 
This editor is integrated into JS front-end, allowing whole editor to run from github-pages. (This readme needs lot of rewording)

## [Open editor](leafdraw.html) [Open settings](setup.html) 

### Features (so far)
* Integration with Editor-Layer-Index to support worldwide imagery.
* Tagging autocomplete integrated with live taginfo API. (Live as oppsed to local cache in [osm lane tool](/osm lane tool)
* Editor can be configured to use either OSM main website or dev-server.
* You can use this as OSM editor, as long as you are using it to edit single isolated way not part in any relation.

While using the tool, you might notice button "Skip item". That is part of yet to add feature, which would give puropose to entire editor.
Initially this editor was supposed to be basic editor, that acts as middle ground between iD (easy-to-use web-based editor), StreetComplete
(minimalistic editor where user maps by answering simple questions) and JOSM (most powerful editing tool), for scenario, where lot of OSM
elements need to be reviewed, but each item requires minimal changes. Skip button is reserved for cases, when user can't answer the question.

PS. There's [prototype demo](tag_autocomplete_demo.html) for trying out tagging autocomplete.


This website uses cookies to keep track on some things, such as currently open changeset ID and OSM server address.

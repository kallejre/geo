# Basic JavaScript editor for OSM
This "editor" is a basic OSM editor running entirely on javascript/html.

This tool was created to fill gap between four popular OpenStreetMap editors and combine their unique characteristics to 
create ultimate tool for specific task: tagging validation process. Editor enables you to load list of ways via Overpass 
query (as in Level0 and Josm) and perform easy operations on them one-by-one (StreetComplete) while doing from comfort of 
your web browser (iD, Level0). Unlike Level0, this editor is bit more user friendly (by having interactive maps and layers) 
and from technical perspective this editor relies entirely on Javascript (like iD) without any server-side scripting (as done in Level0). 

General structure is nearly single-page-site architecture, where main editing activity is done in editing view, 
while few configuration settings (such as OSM server URL) is defined on other. 
This editor is integrated into JS front-end, allowing whole editor to run from github-pages.

## Start here: [Open settings](setup.html) | [Open editor](leafdraw.html)

### Features (so far)
* Integration with Editor-Layer-Index to support worldwide imagery.
* Tagging autocomplete integrated with live taginfo API. (Live as oppsed to local cache in [osm lane tool](/osm lane tool)
* Editor can be configured to use either OSM main website or dev-server.
* Selecting elements to be edited is inspired by Overpass Turbo's UI.
* You can use this as OSM editor, as long as you are using it to edit single isolated way area not part in any relation. Relations and unclosed ways are not supported.
* Configurable settings page.
* (Almost) working on mobile view.
* Few more things regular users would consider commonplace nowadays.

While using the tool, you might notice button "Skip item". That is part of yet to add feature, which would give puropose to entire editor.
Initially this editor was supposed to be basic editor, that acts as middle ground between iD (easy-to-use web-based editor), StreetComplete
(minimalistic editor where user maps by answering simple questions) and JOSM (most powerful editing tool), for scenario, where lot of OSM
elements need to be reviewed, but each item requires minimal changes. Skip button is reserved for cases, when user can't answer the question.


PS. There's [prototype demo](tag_autocomplete_demo.html) for trying out tagging autocomplete.


The editor uses cookies to keep track on some things, such as currently open changeset ID and OSM server address. Source code [link](https://github.com/kallejre/geo/tree/main/basic-editor).

Bugs/things to change:
* Remove WMS layer zoom limit
* Quick switch to OSM layer
* Show current way datapanel.
* Skipping doesn't zoom to item (zooms back to previous item=)
* Saving sometimes neither.
* Tagging suggestions cover save button.
* Sidepanel in main editor window could theoretically feature more streamlined design suitable for specific project.
* Make this thing useful.

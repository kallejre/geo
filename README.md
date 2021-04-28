# geo
Catch-all github repository for various small projects related to GIS. 


## Index
This section should contain links and/or descriptions for different experiments, each stored in separate folder...
### OSM lane tool
The reason, why you are probably here. Simple html-js tool originally meant to make management of multi-lane road tagging easier for OSM contributors, who primarly use iD and don't wish to switch to Josm. Created in Jan 2021.
### Custom render
Non-OSM TMS-layer rendered from Estonian Land Board's (Maa-amet) public ETAK dataset to try out concept for mapping QA tool. Buildings and roads are rendered there as of Aug 2020. Colour scale of map shows rough estimate, when was last time **geometry** of road or building was last edited. To save bandwidth, layers are only shown until zoom level 14, therefore it's not suitable as map editor source layer.
### Building geometry importer
That's what the custom render's concept turned out to be. Basic script to update OSM buildings' geometry while preserving element IDs and tags. Created in Feb-May 2021.
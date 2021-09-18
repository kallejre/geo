# GTFS to TMS
**GTFS to TMS to OSM** - A tool that parses [General Transit Feed Specification](https://gtfs.org/) data files and generates [TMS tiles](https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames) in EPSG:3857 projection.

To use tool, you need to have downloaded GTFS archive for relavant area and unpacked the archive to separate folder. If that folder is subdirectory of current script directory and it has `gtfs` in it's name, script can find it automatically, but loads only when there's no other alternative. Otherwise folder selection dialogue will pop up.

**Start script by running GUI.py.** To make tile loading faster, UI spawns multiple (default 4) parallel processes to serve tiles. Load balancing is done by your map viewer software, which uses `{switch:<port numbers>}` to open connection to multiple processes.

<details><summary>Original plan</summary>
<pre>
Future idea:
 Objective: Tool to assist mapping transit lines in OSM
 Method: Provide custom public transit TMS overlay layer for JOSM
 User story:
  1) Select gtfs folder used for source
  2) Set up renderer/web service settings
  3) Access WMS or TMS tiles via OSM editor
  4) Tile contents can be modified in real time using UI
 Technical baseline:
  Using TMS of WGS84 is preferred due to better compatibility (with iD)
  Tool must have option to switch meaningless identifier to prevent issues
   caused by browser caching, when changing real-time config (switch lines)
  Former could be achieved by generating URLs, where portions is hash of arguments.
   E.g http://127.0.0.1:8080/3/4/2.png?hash=e3f7c6
 UI:
  Selection of lines is done with two parallel listboxes of transit lines
  Textbox with URL that can be copied and pasted to OSM editor

Files needed: routes, stops, and shapes.
</pre>
</details>
// Config.js is for constants used across JS scripts
// Leafdraw.html
// Center of initial map location. Should be normally overwritten by download_way
var center = [51.51262, -0.09791];

//Get_imagery.js
// Maximum age for imagery layers. Ignore imagery more than 20 years old.
let cutoffDate = new Date();
cutoffDate.setFullYear(cutoffDate.getFullYear() - 20);

// Tagging.js
taginfo_url = 'https://taginfo.openstreetmap.org'

// Editing.js
var overpass_server = "https://overpass-api.de/api/interpreter"
var backend_url = "backend.php"  // Not used as all editing is done on front-end
// Overpass query to get single element. Use {id} as variable.
// Not used, because element is downloaded using OSM API.
var op_query = "[timeout:15][out:json];way(id:{id});out body;>;out skel qt;"

// Upload.js
version_identifier = "Basic-editor-0.6"  // Value for created_by tag
// Request options defining header XML content.
XML_HEADER_OPT = {
  header: {
    "Content-Type": "text/xml"
  }
}
var CS_ID_PLACEHOLDER = "CS_ID_PLACEHOLDER"

// Used in editing.js and upload.js
// OSM server settings. Since we want users to be able to switch between two APIs, different structure is used.
osm_settings = {
    "dev": {
      "osm_server": "https://master.apis.dev.openstreetmap.org",
// If you are using your own editor, these values need to be replaced by your keys.
      "oauth_consumer": 'UkTktKhTefjWxR7WRutWkazeu2Mbq91ANhV4YDNN',
      "oauth_secr": 'KU4vz5R4yScLR1vM7KfLagB2CRqTLiHN7PViQE6B',
      // user_url is link which points to OSM website's front page.
      "user_url": "https://master.apis.dev.openstreetmap.org"},
    "live": {
      "osm_server": "https://www.openstreetmap.org",
      "oauth_consumer": 'Z7c6vNWDkg4RpKsVobTfZdZDaELcGcuVxmxUfdYV',
      "oauth_secr": 'OBcYcy4bMf6LijcjYDpEVUeLSOXYLNOTqeBNhvyh',
      "user_url": "https://www.openstreetmap.org"},
    "custom": {}
}

ENV="dev"
// Next up: Load user settings from cookies
if (get_cookie("ENV")) {
    // If cookies are defined
    ENV=get_cookie("ENV");
    osm_settings.custom.osm_server = get_cookie("custom_api_url");
    osm_settings.custom.oauth_consumer = get_cookie("custom_oauth_consumer");
    osm_settings.custom.oauth_secr = get_cookie("custom_oauth_secr");
    osm_settings.custom.user_url = get_cookie("custom_user_url");
} else {
    console.warn("Cookies are not defined")
}
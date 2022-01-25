/* Editing interface

Responsible for exchanging data between frontend and backend.
*/
// OUTPUTS
// if geometry was changed - polygon.edited
// New geometry as list of coordinates - polygon.editing.latlngs[0]
// Also include tags from $(".active_tag").value
// Skipped, if objects needs improvement

// INPUTS
// Either way-ID or data already gotten from overpass

// Add option to open in iD/Josm (sourcecode in Level0).
// Future development: tag sorting - insert Overpass query and present tool for clicking through objects.

var overpass_server="https://overpass-api.de/api/interpreter"
// Use {id} as variable.
var op_query = "[out:json];way(id:{id});out body;>;out skel qt;"

function submit_data(state) {
    if (state == "skip"){
        if (!confirm("Are you sure you wish to skip this item?")){
            console.log("Skip canceled")
            return
        }
        console.log("Skip demo")
        resetMap()
        return
    }
    out={};
    out.geom_changed = Boolean(polygon.edited)
    out.geom = polygon.editing.latlngs[0][0].map(function(d){return [Math.round(d.lat*1e7)/1e7, Math.round(d.lng*1e7)/1e7]});
    // Create key-value pairs from text fields and then convert to object.
    out.tags = Object.fromEntries($(".active_tag").toArray().map(function(d){return([d.value.split("=")[0], d.value.split("=")[1]])}));
    // Remove keys with undefined values
    Object.keys(out.tags).forEach(key => out.tags[key] === undefined ? delete out.tags[key] : {});
    delete out.tags[""]  // Case when key is empty.
    // JSON.stringify(out)
    console.log(out)
}

function parse_overpass(data){
    console.log("Here")
    console.log(data)
    console.log("There")
    way=data.elements[0]
    var nodes=data.elements.filter(function(x){return x.type==="node"});
    // Sort nodes in order they appear in way.
    nodes =nodes.sort(function(n,m){return way.nodes.indexOf(n.id)-way.nodes.indexOf(m.id)})
    nodes.map(function(n){console.log(way.nodes.indexOf(n.id))})
    //Get Leaflet-compatible list of coordinates.
    var coords = nodes.map(function(d){return [d.lat,d.lon]});
    var tags
    // Extract osm-compatible tags from object
    if (way.hasOwnProperty("tags")) {
        tags = Object.entries(way.tags).map(function(x){return x.join("=")})
    } else {
        // way is untagged
        tags = {}
    }
    load_way(coords)
    return [coords, tags]
}

function download_way(id) {
  $.ajax({
    type: 'GET',
    url: overpass_server,
    dataType: 'json',
    async: false,
    processData: false,
    data: $.param({"data": op_query.replace("{id}",id)}),
    success: parse_overpass
  });
  }
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
    out.geom = polygon.editing.latlngs[0][0].map(function(d){return [Math.round(d.lat*1e7)/1e7, Math.round(d.lon*1e7)/1e7]});
    // Create key-value pairs from text fields and then convert to object.
    out.tags = Object.fromEntries($(".active_tag").toArray().map(function(d){return([d.value.split("=")[0], d.value.split("=")[1]])}));
    // Remove keys with undefined values
    Object.keys(out.tags).forEach(key => out.tags[key] === undefined ? delete out.tags[key] : {});
    delete out.tags[""]  // Case when key is empty.
    console.log(out)
}
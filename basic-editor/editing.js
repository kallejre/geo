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
var overpass_server = "https://overpass-api.de/api/interpreter"
// Use {id} as variable.
var op_query = "[timeout:15][out:json];way(id:{id});out body;>;out skel qt;"

// tags_div is defined here, but value is defined in leafdraw.html, after webpage has been initialized.
var tags_div

function submit_data(state, id) {
    out = {};
    out.type = "way"
    out.id = id
    if (state == "skip") {
        if (!confirm("Are you sure you wish to skip this item (way " + out.id + ")?")) {
            console.log("Skip canceled")
            return
        }
        out.skipped = true;
        console.log("Skip demo")
        alert("This thing can't skip anything (yet) because there's no back-end.")
        resetMap()
        return
    }
    out.skipped = false;
    out.geom_changed = Boolean(polygon.edited)
    // NOTE: Linking geometry on leaflet to actual OSM nodes needs to be done on backend.
    out.geom = polygon.editing.latlngs[0][0].map(function(d) {
        return [Math.round(d.lat * 1e7) / 1e7, Math.round(d.lng * 1e7) / 1e7]
    });
    // Create key-value pairs from text fields and then convert to object.
    out.tags = Object.fromEntries($(".active_tag").toArray().map(function(d) {
        return ([d.value.split("=")[0], d.value.split("=")[1]])
    }));
    // Remove keys with undefined values
    Object.keys(out.tags).forEach(key => out.tags[key] === undefined ? delete out.tags[key] : {});
    delete out.tags[""] // Case when key is empty.
    // JSON.stringify(out)
    console.log(out)
    alert("This thing can't save anything (yet)")
}

function load_tags(tags) {
    tags_div.innerHTML = "";
    if (tags.length == 0) {
        tags_div.innerHTML = "<p>This way has no tags. Yet.</p>";
    } else {
        tags.forEach(function(tag) {
            var inp = document.createElement("input");
            inp.setAttribute('class', "active_tag");
            inp.setAttribute('value', tag);
            tags_div.append(inp)
        });
    }
    add_empty_tag_field()
}

function scroll_to_bottom() {
    $("#sidebar")[0].scrollTo(0, $("#sidebar")[0].scrollHeight);
}

function add_empty_tag_field() {
    // Get las input field
    tags_div.lastChild.removeAttribute("onfocus")
    // Add empty field
    var inp = document.createElement("input");
    inp.setAttribute('class', "active_tag");
    inp.setAttribute('value', "");
    inp.setAttribute('onfocus', "add_empty_tag_field()");
    tags_div.append(inp)
    scroll_to_bottom()
    // Add autocomplete to all fields
    load_autocomplete()
}

function parse_overpass(data) {
    console.log("Here")
    console.log(data)
    console.log("There")
    if (data.elements.length > 0) {
        way = data.elements[0]
    } else {
        tags_div.innerHTML = "<p>API returned empty response (way might not exist)</p>"
        return
    }
    var nodes = data.elements.filter(function(x) {
        return x.type === "node"
    });
    // Sort nodes in order they appear in way.
    nodes = nodes.sort(function(n, m) {
        return way.nodes.indexOf(n.id) - way.nodes.indexOf(m.id)
    })
    nodes.map(function(n) {
        console.log(way.nodes.indexOf(n.id))
    })
    //Get Leaflet-compatible list of coordinates.
    var coords = nodes.map(function(d) {
        return [d.lat, d.lon]
    });
    var tags
    // Extract osm-compatible tags from object
    if (way.hasOwnProperty("tags")) {
        tags = Object.entries(way.tags).map(function(x) {
            return x.join("=")
        })
    } else {
        // way is untagged
        tags = []
    }
    // Re-enable upload button
    $(".disablable").prop("disabled", false);
    load_way(coords)
    console.log(tags)
    load_tags(tags)
    return [coords, tags]
}

function download_way(id) {
    tags_div.innerHTML = "<p>Calling overpass API</p>"
    $(".disablable").prop("disabled", true);
    $("#reset-button")[0].setAttribute("onClick", "download_way(" + id + ")")
    $("#save-button")[0].setAttribute("onClick", "submit_data('save'," + id + ")")
    $("#skip-button")[0].setAttribute("onClick", "submit_data('skip'," + id + ")")
    $.ajax({
        type: 'GET',
        url: overpass_server,
        dataType: 'json',
        async: false,
        processData: false,
        data: $.param({
            "data": op_query.replace("{id}", id)
        }),
        success: parse_overpass,
        error: function() {
            tags_div.innerHTML = "<p>Unable to download element</p>"
        }
    });
}
// JS Functions for interacting with OsmApi. Based on combined code snipped copied from:
// Coffedex (https://github.com/tmcw/coffeedex/blob/e3a576f7be8a28b07f6f2ff9d8074bad5d2a701b/index.js#L76)
// and Deriviste (https://github.com/systemed/deriviste/blob/f2a33da6ea479cc72abe4cff8057518164cdd3a9/deriviste.js#L324-L394)
// Osm-auth https://github.com/osmlab/osm-auth
// aed-mapa https://github.com/openstreetmap-polska/aed-mapa/blob/main/src/osm-integration.js

// Big picture: Get per-way request from editing.js/submit_json()
// Upload changes to OSM server.

// Init X2JS, used for x2js.json2xml_str
var x2js = new X2JS();
// Unlike usual simple OSM editors, which build requests using string operations,
// this script builds OSM-compatible XML by converting JS objects to XML.

var currently_open_chset_id = null;
/*
<osm>
	<node changeset="188021" id="4326396331" lat="50.4202102" lon="6.1211032" version="1" visible="true">
		<tag k="foo" v="barzzz" />
	</node>
</osm>
*/

// Setup Oauth
var auth = osmAuth({
  // FIXME: If you use this code, replace key with yours.
  url: osm_settings[ENV].osm_server, // Osm_server is defined in editing.js
  oauth_consumer_key: osm_settings[ENV].oauth_consumer,
  oauth_secret: osm_settings[ENV].oauth_secr
  //auto: true,
  //singlepage: true, // Load the auth-window in the current window, with a redirect,
  //landing: window.location.href // Come back to the current page
});

// Login/logout functions
// User authentication is based on osm.auth code sample
function done(err, res) {
  // Done() is called after login-attempt has been completed.
  if (err) {
    // While tags_div > p has larger font. Overwriting it may erase modified tag information.
    document.getElementById('user').innerHTML =
      'Error logging in! Try clearing your browser cache (refresh this window)';
    document.getElementById('user').style.display = 'block';
    alert(
      "Error logging in! Try clearing your browser cache (refresh this window)\nYou need to refresh page to be able to log in."
    );
    return;
  }
  // Show username, changesets count and user ID on sidepanel.
  // First, extract them from XML-response
  var u = res.getElementsByTagName('user')[0];
  var changesets = res.getElementsByTagName('changesets')[0];
  var o = {
    display_name: u.getAttribute('display_name'),
    id: u.getAttribute('id'),
    count: changesets.getAttribute('count'),
    api_server: "<a href=\"" + osm_settings[ENV].user_url + "\" target=\"_blank\">" + osm_settings[ENV].osm_server.replace('openstreetmap', 'osm')
      .replace('https://', '') + "</a>"
  };
  // And then write them to sidepanel
  for (var k in o) {
    console.warn(k)
    // If first login-attempt resulted in error, then contents of #user was overwritten by error message
    // therefore attempts to alter any elements within #user may cause error "K is not defined"
    if (!document.getElementById(k)) {
      // If k is not defined
      alert("Please refresh the page due to previous unsuccessful login")
    }
    document.getElementById(k).innerHTML = o[k];
  }
  // Unhide user information
  document.getElementById('user').style.display = 'block';
}

document.getElementById('authenticate').onclick = function() {
  if (!auth.bringPopupWindowToFront()) {
    auth.authenticate(function() {
      update_account_display();
    });
  }
};

function showDetails() {
  auth.xhr({
    method: 'GET',
    path: '/api/0.6/user/details'
  }, done);
}

function hideDetails() {
  document.getElementById('user').style.display = 'none';
}

document.getElementById('logout').onclick = function() {
  auth.logout();
  update_account_display();
};

function update_account_display() {
  if (auth.authenticated()) {
    document.getElementById('authenticate').className = 'done';
    document.getElementById('logout').className = '';
    showDetails();
  } else {
    document.getElementById('authenticate').className = '';
    document.getElementById('logout').className = 'done';
    hideDetails();
  }
}
update_account_display();

// prompt("Insert changeset comment:", "Default text");
function upload_way(data) {
  // Receive object generated in submit_json/submit_data and handle its uploading or skipping
  // Convert received data into OSC-compatible format.
  console.log("Received into upload")
  console.log(data)
  if (data.skipped) {
    console.log("Informing about skipping the way")
    // FIXME: Insert ommunication with TODO list manager
    return
  }

  orig_way = original_data.elements.filter(function(x) {
    return x.type === "way"
  })[0]

  var OSC_to_upload = {
    'osmChange': {
      '_version': '0.6',
      '_generator': version_identifier,
    }
  }

  if (data.geom_changed) {
    // Process geometry changes, determine new status for each node by id.
    // Then generate OsmChange from lists, which is returned by function.
    tmp = process_geometry(data)
    nodes_list = tmp.nodes_list;
    //console.log(tmp);
    ["create", "modify", "delete"].forEach(function(action) {
      if (tmp[action].length != 0) {
        if (!(action in OSC_to_upload.osmChange)) {
          // If action is not present yet
          OSC_to_upload.osmChange[action] = {}
        }
        OSC_to_upload.osmChange[action] = Object.assign(OSC_to_upload.osmChange[action], tmp[action]);
        if (OSC_to_upload.osmChange[action].node.length == 0) {
          delete OSC_to_upload.osmChange[action].node
        }

      }
    });
  } else {
    // Copy node references from earlier copy.
    nodes_list = orig_way.nodes.map((d) => {
      return {
        "_ref": d
      }
    })
    // Use nodes_list in object in following way: {"nd": nodes_list}
    //console.log(nodes_list)
  }
  // Construct way

  if (!("modify" in OSC_to_upload.osmChange)) {
    OSC_to_upload.osmChange.modify = {}
  }
  if (!("way" in OSC_to_upload.osmChange.modify)) {
    OSC_to_upload.osmChange.modify.way = []
  }
  // Modified way will be added to this list
  ways_list = OSC_to_upload.osmChange.modify.way
  way = {
    "nd": nodes_list,
    "_changeset": CS_ID_PLACEHOLDER,
    "_id": orig_way.id,
    "_version": orig_way.version
  } // Way to be added

  way_tags = []
  for (const [key, value] of Object.entries(data.tags)) {
    way_tags.push({
      "_k": key,
      "_v": value
    });
  }
  if (way_tags.length !== 0) {
    // If way_tags is not empty, add tags to osc.
    way.tag = way_tags
  }

  var way_changed = !compare_two_ways(orig_way, way, data.tags)

  if (way_changed) {
    ways_list.push(way)
    console.log("Two ways are different")
  } else {
    console.log("Two ways are same")
    delete OSC_to_upload.osmChange.modify.way;
  }
  console.log("READY!!!")

  // If delete block exists, add _if-unused
  if ("delete" in OSC_to_upload.osmChange) {
    // The key is added here, because deletions must be after other actions.
    OSC_to_upload.osmChange.delete['_if-unused'] = "true"
  }

  uploadData(OSC_to_upload)
  // FIXME: Insert ommunication with TODO list manager
}

function process_geometry(data) {
  // General algorithm: 
  //    Given set of nodes A (data.geom) and set B (nodes),
  //    find pairs <a,b> in such way that a (from A) and b (from B)
  //    link each existing node to closest geom coordinate.
  //  This function includes some of OsmChange generation.
  var nodes = original_data.elements.filter(function(x) {
    return x.type === "node"
  });
  distances = []
  id_to_node = {}
  nodes.forEach(function(b) {
    id_to_node[b.id] = b
    data.geom.forEach(function(a) {
      dist = calc_node_distance(a, b)
      distances.push([dist, a, b.id])
    });
  });
  distances.sort()
  // Link every existing node to new coordinate
  id_to_coord = {}
  // Link coordinates to node IDs (for OSC construction)
  coord_to_id = {}
  not_changed = []
  nodes_to_add = []
  ids_to_remove = []
  //console.log(distances)
  //console.log(distances.length)
  while (distances.length) {
    first = distances.shift() // Remove 1st elements
    // first is [distance, AddedNode, OsmNode]
    // Check if node was not moved
    if (first[1][0] == id_to_node[first[2]].lat && first[1][1] == id_to_node[first[2]].lon) {
      not_changed.push(first[2])
    } else {
      id_to_coord[first[2]] = first[1]
    }
    coord_to_id[first[1]] = first[2]

    distances = distances.filter(function(d) {
      return d[2] != first[2] && !(JSON.stringify(first[1]) == JSON.stringify(d[1]))
    })

  }
  if (Object.keys(id_to_coord).length + not_changed.length < nodes.length) {
    // Find nodes ID that are not keys in id_to_coord object nor in not_changed.
    ids_to_remove = nodes.map(function(x) {
      //if (!(x.id in id_to_node)) {}
      return x.id
    }).filter(function(x) {
      return Object.keys(id_to_coord).indexOf(x.toString()) === -1 && not_changed.indexOf(x) === -1;
    })
  } else if (data.geom.length > nodes.length) {
    // Find new coordinates (data.geom) that were not linked to any existing node.
    // Merge nodes that were not modified and modified coordinates into not_deleted_coordinates.
    // Due to nested arrays, we need to compare every individual number in arrays.
    coord_no_change = not_changed.map((id) => [id_to_node[id].lat, id_to_node[id].lon])
    not_deleted_coordinates = [...coord_no_change, ...Object.values(id_to_coord)]
    nodes_to_add = data.geom.filter(x => !not_deleted_coordinates.some(a => x.every((v, i) => v === a[i])));
    var n = -1
    nodes_to_add.forEach((c) => {
      coord_to_id[c] = n
      n--
    })
  }

  // Generate OSC-compatible objects
  // Build list of node references for way
  nodes_list = data.geom.map((c) => {
    return {
      "_ref": coord_to_id[c]
    }
  })
  nodes_list.push(nodes_list[0])

  create_nodes_osc = [] // Use this array as value in {create: {node: X}}
  nodes_to_add.forEach((c) => { // C is pair of coordinates
    create_nodes_osc.push({
      "_id": coord_to_id[c], // ID is already negative
      "_lat": c[0],
      "_lon": c[1],
      "_version": 0,
      "_changeset": CS_ID_PLACEHOLDER
    }) // No tags are added
  });

  modify_nodes_osc = [] // Use this array as value in {create: {node: X}}
  for ([id, c] of Object.entries(id_to_coord)) { // C ispair of coordinates
    var original_node = id_to_node[id.toString()]
    tmp_node = {
      "_id": coord_to_id[c], // ID is already negative
      "_lat": c[0],
      "_lon": c[1],
      "_version": original_node.version,
      "_changeset": CS_ID_PLACEHOLDER
    } // No tags are added yet
    if (original_node.hasOwnProperty("tags")) {
      tmp_node.tags = []
      // Copy tags from node to new node
      for (const [key, value] of Object.entries(original_node.tags)) {
        tmp_node.tags.push({
          "_k": key,
          "_v": value
        });
      }
    }
    modify_nodes_osc.push(tmp_node)
  };
  delete_nodes_osc = [];
  //console.log(id_to_coord)
  ids_to_remove.forEach((id) => {
    var original_node = id_to_node[id]
    tmp_node = {
      "_id": id,
      "_lat": original_node.lat,
      "_lon": original_node.lon,
      "_version": original_node.version,
      "_changeset": CS_ID_PLACEHOLDER
    }
    delete_nodes_osc.push(tmp_node)

  });
  //console.log( {"to_keep": not_changed, "to_modify": id_to_coord, "to_add": nodes_to_add, 
  //        "to_delete": ids_to_remove, "nodes_list":nodes_list} )
  return {
    "create": {
      "node": create_nodes_osc
    },
    "modify": {
      "node": modify_nodes_osc
    },
    "delete": {
      "node": delete_nodes_osc
    },
    "nodes_list": nodes_list
  }
}

function calc_node_distance(a, b) {
  // Warning: a is an Array(<lat>, <lon>) while
  // b is object {lat: <lat>, lon: <lon>}
  // Translated from Java on et.wikipedia.org/wiki/Ortodroom
  var delta, p0, p1, p2, p3;
  // The average radius for a spherical approximation of Earth
  var rEarth = 6371010;
  // Degree to radian mini-function
  rad = (x) => x * Math.PI / 180
  delta = rad(a[1]) - rad(b.lon);
  p0 = Math.cos(rad(b.lat)) * Math.cos(b.lat);
  p1 = Math.cos(rad(b.lat)) * Math.sin(delta);
  p2 = Math.cos(rad(a[0])) * Math.sin(rad(b.lat)) - Math.sin(rad(a[0])) * p0;
  p3 = Math.sin(rad(a[0])) * Math.sin(rad(b.lat)) + Math.cos(rad(a[0])) * p0;

  return rEarth * Math.atan2(Math.sqrt(p1 * p1 + p2 * p2), p3);
}

function calc_node_distance(a, b) {
  // Faster alternative using adjusted pythagoran
  lat_coef = Math.cos(a[0] * Math.PI / 180)
  return Math.sqrt(((a[0] - b.lat) * lat_coef) ** 2 + (a[1] - b.lon) ** 2)
}

function compare_two_ways(way1, way2, tags, ) {
  // Input: OSM-XML way and OSC-formatted way
  // Output: Boolean, if tags, nodes and ID are same
  var same_id = (way1.id == way2._id)
  var same_tags = compareObjects(way1.tags, tags)
  var same_nodes = (JSON.stringify(way1.nodes) === JSON.stringify(way2.nd.map((x) => x._ref)));
  return same_id && same_tags && same_nodes
}

function compareObjects(o1, o2) {
  // https://stackoverflow.com/a/5859028
  for (var p in o1) {
    if (o1.hasOwnProperty(p)) {
      if (o1[p] !== o2[p]) {
        return false;
      }
    }
  }
  for (var p in o2) {
    if (o2.hasOwnProperty(p)) {
      if (o1[p] !== o2[p]) {
        return false;
      }
    }
  }
  return true;
};

// =========================================================================
// Open changeset
function openChangeset(comment) {
  var osm={osm:{changeset:{tag:[
      {_k:"created_by",_v: version_identifier},
      {_k:"comment",_v: comment},
      {_k:"host", _v: window.location.origin + window.location.pathname},
      {_k:"imagery_used",_v:Array.from(used_imagery).sort().join(';')}
      ]}}}

  cs_xml = x2js.json2xml_str(osm)

  // Auth.xhr takes 2 paramaters options and callback.
  auth.xhr({
    method: 'PUT',
    path: '/api/0.6/changeset/create',
    content: cs_xml,
    options: XML_HEADER_OPT,
  }, (err, res) => {
    if (err) {
      console.alert("Error occured while opening changeset (see console for details).")
      console.error(err);
    } else {
      currently_open_chset_id = res;
      console.log('Api returned changeset id: ' + res);
    }
  });
}

// =========================================================================
// Close changeset
function closeChangeset() {
  if (currently_open_chset_id === null) {
    console.warn(
      "Can't close changeset, because there's no known open changesets (variable currently_open_chset_id is undefined)."
    )
    return
  }
  auth.xhr({
    method: 'PUT',
    path: '/api/0.6/changeset/' + currently_open_chset_id + '/close',
    content: cs_xml,
    options: XML_HEADER_OPT,
  }, (err, res) => {
    if (err) {
      console.alert("Error occured while closing changeset (see console for details).")
      console.error(err);
    } else {
      console.log(`Changeset ${currently_open_chset_id} was closed`)
      currently_open_chset_id = null;
    }
  });
}

// prompt("Insert changeset comment:", "Default text");

// =========================================================================
// Upload data

function uploadData(osc) {
  // osc is JS object for OsmChange XML.
  cs_xml = x2js.json2xml_str(osc).replaceAll(CS_ID_PLACEHOLDER, currently_open_chset_id)
  console.warn(cs_xml)
  if (!currently_open_chset_id){return alert("You need to have open changeset to upload into.")}
  auth.xhr({
    method: 'POST',
    path: '/api/0.6/changeset/' + currently_open_chset_id + '/upload',
    content: cs_xml,
    options: XML_HEADER_OPT,
  }, (err, res) => {
    if (err) {
      console.warn("Error occured while uploading changes")
      console.error(err);
    } else {
      console.log("Upload was successful")
      // To prevent conflicts while uploading next changes, original_data must be updated.
      download_way(out.id)
    }
  });
}

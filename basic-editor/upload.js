// JS Functions for interacting with OsmApi. Based on combined code snipped copied from:
// Coffedex (https://github.com/tmcw/coffeedex/blob/e3a576f7be8a28b07f6f2ff9d8074bad5d2a701b/index.js#L76)
// and Deriviste (https://github.com/systemed/deriviste/blob/f2a33da6ea479cc72abe4cff8057518164cdd3a9/deriviste.js#L324-L394)
// Osm-auth https://github.com/osmlab/osm-auth
// aed-mapa https://github.com/openstreetmap-polska/aed-mapa/blob/main/src/osm-integration.js

// Big picture: Get per-way request from editing.js/submit_json()
// Upload changes to OSM server.

// Init X2JS, used for x2js.json2xml_str
var x2js = new X2JS();

version_identifier = "Basic-editor-0.1"
// Unlike usual simple OSM editors, which build requests using string operations,
// this script builds OSM-compatible XML by converting JS objects to XML.
osm={osm:{changeset:{tag:[
    {_k:"created_by",_v: version_identifier},
    {_k:"comment",_v:4},
    {_k:"imagery_used",_v:Array.from(used_imagery).sort().join(';')}
    ]}}}
x2js.json2xml_str(osm)
// Request options defining header XML content.
XML_HEADER_OPT = {
  header: {
    "Content-Type": "text/xml"
  }
}
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
  url: osm_server, // Osm_server is defined in editing.js
  oauth_consumer_key: 'UkTktKhTefjWxR7WRutWkazeu2Mbq91ANhV4YDNN',
  oauth_secret: 'KU4vz5R4yScLR1vM7KfLagB2CRqTLiHN7PViQE6B'
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
    api_server: "<a href=\"" + osm_server + "\" target=\"_blank\">" + osm_server.replace('openstreetmap', 'osm')
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

  if (data.geom_changed) {
    // TODO: Process geometry changes
    tmp = process_geometry(data)
    id_to_coord = tmp.to_keep //   Obj with {OsmID: [lat, lon], ..}
    nodes_to_add = tmp.to_add //  [[lat, lon], ..]
    ids_to_remove = tmp.to_delete // [OsmID, ..]
    // TODO: Generate OsmChange from lists. Don't forget check if node was moved at all.
    console.log(tmp)
  } else {
    // Copy node references from earlier copy.
    nodes_list = orig_way.nodes.map((d) => {
      return {
        "_ref": d
      }
    })
    // Use nodes_list in object in following way: {"nd": nodes_list}
    console.log(nodes_list)
  }
  way_tags = []
  for (const [key, value] of Object.entries(data.tags)) {
    way_tags.push({
      "_k": key,
      "_v": value
    });
  }
  if (way_tags.length !== 0) {
    // If way_tags is not empty, use it in following way: {"tag": way_tags}
  }
  // FIXME: Insert ommunication with TODO list manager
}

function process_geometry(data) {
  // General algorithm: 
  //    Given set of nodes A (data.geom) and set B (nodes),
  //    find pairs <a,b> in such way that a (from A) and b (from B)
  //    link each existing node to closest geom coordinate.
  //  This function doesn't even include OsmChange generation.
  var nodes = original_data.elements.filter(function(x) {
    return x.type === "node"
  });
  distances = []

  nodes.forEach(function(b) {
    data.geom.forEach(function(a) {
      dist = calc_node_distance(a, b)
      distances.push([dist, a, b.id])
    });
  });
  distances.sort()
  // Link every existing node to new coordinate
  id_to_coord = {}
  nodes_to_add = []
  ids_to_remove = []
  console.log(distances)
  console.log(distances.length)
  while (distances.length) {
    first = distances.shift() // Remove 1st elements
    // first is [distance, AddedNode, OsmNode]
    id_to_coord[first[2]] = first[1]
    distances = distances.filter(function(d) {
      return d[2] != first[2] && !(JSON.stringify(first[1])==JSON.stringify(d[1]))
    })
  }
  if (Object.keys(id_to_coord).length < nodes.length) {
    // Find nodes ID that are not keys in id_to_coord object.
    ids_to_remove = nodes.map(function(x) {
      return x.id
    }).filter(function(x) {
      return Object.keys(id_to_coord).indexOf(x.toString()) === -1;
    })
  } else if (data.geom.length > nodes.length) {
    // Find new coordinates (data.geom) that were not linked to any existing node.
    // Due to nested arrays, we need to compare every individual number in arrays.
    nodes_to_add = data.geom.filter(x => !Object.values(id_to_coord).some(a => x.every((v, i) => v === a[i])));
  }

  return {"to_keep": id_to_coord, "to_add": nodes_to_add, "to_delete": ids_to_remove}
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

// =========================================================================
// Open changeset
function openChangeset(comment) {
  osm={osm:{changeset:{tag:[
      {_k:"created_by",_v: version_identifier},
      {_k:"comment",_v: comment},
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
      console.warn("Error occured while opening changeset")
      console.err(err);
    } else {
      currently_open_chset_id = res;
      console.log('Api returned changeset id: ' + res);
      resolve(res);
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
      console.warn("Error occured while closing changeset")
      console.err(err);
    } else {
      currently_open_chset_id = null;
    }
  });
}

// prompt("Insert changeset comment:", "Default text");

// =========================================================================
// Upload data

function uploadData() {
  // Create JS object for OsmChange XML.
  var osc = {
    'osmChange': {
      '_version': '0.6',
      '_generator': version_identifier,
      'delete': {
        '_if-unused': "true"
      }
    }
  }

  /*  OSC sample
  {'osmChange':{'_version':'0.6','_generator':version_identifier,
  'delete':{'_if-unused':"true", node:[
    {_id:-1,_changeset:4433,tag:{_k:"building", _v:"yes"}}, {tag:2}]}}})
  */

  cs_xml = x2js.json2xml_str(osc)
  auth.xhr({
    method: 'POST',
    path: '/api/0.6/changeset/' + currently_open_chset_id + '/upload',
    content: cs_xml,
    options: XML_HEADER_OPT,
  }, (err, res) => {
    if (err) {
      console.warn("Error occured while uploading changes")
      console.err(err);
    } else {
      console.log("Upload was successful")
    }
  });
}

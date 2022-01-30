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

// Changeset uploading?
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
    options: {
      header: {
        "Content-Type": "text/xml"
      }
    },
  }, (err, res) => {
    if (err) {
      reject(err);
    } else {
      currently_open_chset_id = res;
      console.log('Api returned changeset id: ' + res);
      resolve(res);
    }
  });
}

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
    options: {
      header: {
        "Content-Type": "text/xml"
      }
    },
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

// # Parsing & Producing XML
var a = nl => Array.prototype.slice.call(nl),
  attr = (n, k) => n.getAttribute(k),
  serializer = new XMLSerializer();
// Given an XML DOM in OSM format and an object of the form
//
//     { k, v }
//
// Find all nodes with that key combination and return them
// in the form
//
//     { xml: Node, tags: {}, id: 'osm-id' }
var parser = (xml, kv) =>
  a(xml.getElementsByTagName("node"))
    .map(node =>
      a(node.getElementsByTagName("tag")).reduce(
        (memo, tag) => {
          memo.tags[attr(tag, "k")] = attr(tag, "v");
          return memo;
        },
        {
          xml: node,
          tags: {},
          id: attr(node, "id"),
          location: {
            latitude: parseFloat(attr(node, "lat")),
            longitude: parseFloat(attr(node, "lon"))
          }
        }
      )
    )
    .filter(node => node.tags[kv.k] === kv.v);
var serialize = xml =>
  serializer
    .serializeToString(xml)
    .replace('xmlns="http://www.w3.org/1999/xhtml"', "");
// Since we're building XML the hacky way by formatting strings,
// we'll need to escape strings so that places like "Charlie's Shop"
// don't make invalid XML.
var escape = _ =>
  _.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
// Generate the XML payload necessary to open a new changeset in OSM
var changesetCreate = comment => `<osm><changeset>
    <tag k="created_by" v="${VERSION}" />
    <tag k="comment" v="${escape(comment)}" />
  </changeset></osm>`;
// After the OSM changeset is opened, we need to send the changes:
// this generates the necessary XML to add or update a specific
// tag on a single node.
var changesetChange = (node, tag, id) => {
  a(node.getElementsByTagName("tag"))
    .filter(tagElem => tagElem.getAttribute("k") === tag.k)
    .forEach(tagElem => node.removeChild(tagElem));
  node.setAttribute("changeset", id);
  var newTag = node.appendChild(document.createElement("tag"));
  newTag.setAttribute("k", tag.k);
  newTag.setAttribute("v", tag.v);
  return `<osmChange version="0.3" generator="${VERSION}">
    <modify>${serialize(node)}</modify>
    </osmChange>`;
};




// =========================================================================
// Upload data

var xml;

// Save - as .gpx, or .osm, or upload to OSM
// Not accessed yet...
function startUpload() {
	deselectCurrentMarker();
//	if (markers.length==0) return;
	var username = u('#username').first().value;
	var password = u('#password').first().value;
	if (!username || !password) return alert("You must enter an OSM username and password.");
	var comment = prompt("Enter a changeset comment.","");

	// Create changeset
	var str = '<osm><changeset><tag k="created_by" v="Deriviste" /><tag k="comment" v="" /><tag k="imagery_used" v="Mapillary Images" /><tag k="source" v="mapillary" /></changeset></osm>';
	xml = new DOMParser().parseFromString(str,"text/xml");
	xml.getElementsByTagName('tag')[1].setAttribute('v', comment);

	fetch("https://www.openstreetmap.org/api/0.6/changeset/create", {
		method: "PUT",
	    headers: { "Content-Type": "text/xml",
		           "Authorization": "Basic " + window.btoa(unescape(encodeURIComponent(username + ":" + password))) },
		body: new XMLSerializer().serializeToString(xml)
	}).then(response => {
		response.text().then(text => {
			if (isNaN(text)) {
				flash("Couldn't authenticate");
			} else {
				uploadData(text); // this is just the changeset ID
			}
		})
	});
}
function uploadData(changesetId) {
	// Create XML (bleurgh) document
	xml = document.implementation.createDocument(null,null);
	var osc = xml.createElement("osmChange");
	osc.setAttribute('version','0.6');
	osc.setAttribute('generator','Deriviste');
	var operation = xml.createElement("create");
	for (var i=0; i<markers.length; i++) {
		var marker = markers[i];
		var node = xml.createElement("node");
		node.setAttribute("id",-(i+1));
		node.setAttribute("changeset",changesetId);
		node.setAttribute("lat",marker.getLatLng().lat);
		node.setAttribute("lon",marker.getLatLng().lng);
		for (var k in marker.options.tags) {
			if (!k || !marker.options.tags[k]) continue;
			var tag = xml.createElement("tag");
			tag.setAttribute("k",k);
			tag.setAttribute("v",marker.options.tags[k]);
			node.appendChild(tag);
		}
		operation.appendChild(node);
	}
	osc.appendChild(operation);
	xml.appendChild(osc);
	console.log(new XMLSerializer().serializeToString(xml));

	// Upload
	fetch("https://www.openstreetmap.org/api/0.6/changeset/"+changesetId+"/upload", {
		method: "POST",
	    headers: { "Content-Type": "text/xml",
		           "Authorization": "Basic " + window.btoa(unescape(encodeURIComponent(u('#username').first().value + ":" + u('#password').first().value))) },
		body: new XMLSerializer().serializeToString(xml)
	}).then(response => {
		response.text().then(text => {
			// we could probably parse the diff result here and keep the markers around
			//   for editing (with new id/version), but for now, let's just delete them
			flash("Nodes uploaded.");
			console.log(text);
			deleteAllMarkers();
		})
	});
}
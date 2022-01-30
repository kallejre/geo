// JS Functions for interacting with OsmApi. Combined from 
// Coffedex (https://github.com/tmcw/coffeedex/blob/e3a576f7be8a28b07f6f2ff9d8074bad5d2a701b/index.js#L76)
// and Deriviste (https://github.com/systemed/deriviste/blob/f2a33da6ea479cc72abe4cff8057518164cdd3a9/deriviste.js#L324-L394)
// Osm-auth https://github.com/osmlab/osm-auth

// Big picture: Get per-way request from editing.js/submit_json()
// Upload changes to OSM server.

// Init X2JS, used for x2js.json2xml_str
var x2js = new X2JS();

osm={osm:{changeset:{tag:[
    {_k:"created_by",_v:"Basic-editor-0.1"},
    {_k:"comment",_v:4},
    {_k:"imagery_used",_v:5}
    ]}}}
x2js.json2xml_str(osm)


// Setup Oauth
var auth = osmAuth({
    // FIXME: If you use this code, replace key with yours.
oauth_consumer_key: 'WLwXbm6XFMG7WrVnE8enIF6GzyefYIN6oUJSxG65',
oauth_secret: '9WfJnwQxDvvYagx1Ut0tZBsOZ0ZCzAvOje3u1TV0',
auto: true,
singlepage: true, // Load the auth-window in the current window, with a redirect,
landing: window.location.href // Come back to the current page
});

var urlParams = new URLSearchParams(window.location.search);
if(urlParams.has('oauth_token')){
    // The token passed via the URL has to be passed into 'auth.bootstrapToken'. The callback is triggered when the final roundtrip is done
     auth.bootstrapToken(urlParams.get('oauth_token'),
            (error) => {
                if(error !== null){
                    console.log("Something is wrong: ", error);
                    return;
                }

                /* Do authenticated stuff here*/
            }, this.auth);
}else{

    // Attempt to do something authenticated to trigger authentication

}







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
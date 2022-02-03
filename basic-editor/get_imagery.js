// Copied from iD source code, adjusted for this tool
// https://github.com/openstreetmap/iD/blob/1ee45ee1f03f0fe4d452012c65ac6ff7649e229f/scripts/update_imagery.js

// After several hours of google-fu, this JS file contains code that allows 
// browser to get available imagery layers at current map location
// Based on source of iD editor.
var global_imagery = Array()
var layers;  // List of leaflet layers

used_imagery=new Set(); 

function update_used_imagery_list() {
  // This function is called whenever user changes anything
  // Add currently selected imagery layer to Set.
  used_imagery.add(layers[$("#Layers")[0].value].name);
  // Enable save button
  $("#save-button").prop("disabled", false);
}

const discard = {
  'osmbe': true,                        // 'OpenStreetMap (Belgian Style)'
  'osmfr': true,                        // 'OpenStreetMap (French Style)'
  'osm-mapnik-german_style': true,      // 'OpenStreetMap (German Style)'
  'HDM_HOT': true,                      // 'OpenStreetMap (HOT Style)'
  // Mapnik BW does not work.
  'osm-mapnik-black_and_white': true,   // 'OpenStreetMap (Standard Black & White)'
  'osm-mapnik-no_labels': true,         // 'OpenStreetMap (Mapnik, no labels)'
  'OpenStreetMap-turistautak': true,    // 'OpenStreetMap (turistautak)'

  'hike_n_bike': true,                  // 'Hike & Bike'
  'landsat': true,                      // 'Landsat'
  'skobbler': true,                     // 'Skobbler'
  'public_transport_oepnv': true,       // 'Public Transport (ÖPNV)'
  'tf-cycle': true,                     // 'Thunderforest OpenCycleMap'
  'tf-landscape': true,                 // 'Thunderforest Landscape'
  'tf-outdoors': true,                  // 'Thunderforest Outdoors'
  'qa_no_address': true,                // 'QA No Address'
  'wikimedia-map': true,                // 'Wikimedia Map'

  'openinframap-petroleum': true,
  'openinframap-power': true,
  'openinframap-telecoms': true,
  'openpt_map': true,
  'openrailwaymap': true,
  'openseamap': true,
  'opensnowmap-overlay': true,

  'US-TIGER-Roads-2012': true,
  'US-TIGER-Roads-2014': true,

  'Waymarked_Trails-Cycling': true,
  'Waymarked_Trails-Hiking': true,
  'Waymarked_Trails-Horse_Riding': true,
  'Waymarked_Trails-MTB': true,
  'Waymarked_Trails-Skating': true,
  'Waymarked_Trails-Winter_Sports': true,

  'OSM_Inspector-Addresses': true,
  'OSM_Inspector-Geometry': true,
  'OSM_Inspector-Highways': true,
  'OSM_Inspector-Multipolygon': true,
  'OSM_Inspector-Places': true,
  'OSM_Inspector-Routing': true,
  'OSM_Inspector-Tagging': true,

  'EOXAT2018CLOUDLESS': true
};

const supportedWMSProjections = [
  // Web Mercator
  'EPSG:3857',
  // alternate codes used for Web Mercator
  'EPSG:900913',
  'EPSG:3587',
  'EPSG:54004',
  'EPSG:41001',
  'EPSG:102113',
  'EPSG:102100',
  'EPSG:3785',
  // WGS 84 (Equirectangular)
  'EPSG:4326'
];

$.getJSON('https://osmlab.github.io/editor-layer-index/imagery.json', function(data) {
  //console.log(data)
  // slice(0).
  data.forEach(function(source2) {
    //console.log(source)
    let source = source2

    if (source.type !== 'tms' && source.type !== 'wms' && source.type !== 'bing') return;
    if (source.id in discard) return;

    let im = {
      id: source.id,
      name: source.name,
      type: source.type,
      template: source.url
    };

    // Some sources support 512px tiles
    if (source.id === 'Mapbox') {
      im.template = im.template.replace('.jpg', '@2x.jpg');
      im.tileSize = 512;
    } else if (source.id === 'mtbmap-no') {
      im.tileSize = 512;
    } else if (source.id === 'mapbox_locator_overlay') {
      im.template = im.template.replace('{y}', '{y}{@2x}');
    } else if (source.id == "Bing") {
      im.template =
        'https://ecn.t{switch:0,1,2,3}.tiles.virtualearth.net/tiles/a{u}.jpeg?g=587&n=z'
      im.type = "bing"
    }

    // Some WMS sources are supported, check projection
    if (source.type === 'wms') {
      const projection = source.available_projections && supportedWMSProjections.find(p => source
        .available_projections.indexOf(p) !== -1);
      if (!projection) return;
      if (data.some(other => other.name === source.name && other.type !== source.type)) return;
      im.projection = projection;
    }

    let startDate, endDate, isValid;

    if (source.end_date) {
      endDate = new Date(source.end_date);
      isValid = !isNaN(endDate.getTime());
      if (isValid) {
        if (endDate <= cutoffDate) return; // too old
        im.endDate = endDate;
      }
    }

    if (source.start_date) {
      startDate = new Date(source.start_date);
      isValid = !isNaN(startDate.getTime());
      if (isValid) {
        im.startDate = startDate;
      }
    }

    let extent = source.extent || {};
    if (extent.min_zoom || extent.max_zoom) {
      im.zoomExtent = [
        extent.min_zoom || 0,
        extent.max_zoom || 22
      ];
    }

    if (extent.polygon) {
      im.polygon = extent.polygon;
    } else if (extent.bbox) {
      im.polygon = [
        [
          [extent.bbox.min_lon, extent.bbox.min_lat],
          [extent.bbox.min_lon, extent.bbox.max_lat],
          [extent.bbox.max_lon, extent.bbox.max_lat],
          [extent.bbox.max_lon, extent.bbox.min_lat],
          [extent.bbox.min_lon, extent.bbox.min_lat]
        ]
      ];
    }

    if (source.id === 'mapbox_locator_overlay') {
      im.overzoom = false;
    }

    const attribution = source.attribution || {};
    if (attribution.url) {
      im.terms_url = attribution.url;
    }
    if (attribution.text) {
      im.terms_text = attribution.text;
    }
    if (attribution.html) {
      im.terms_html = attribution.html;
    }

    ['best', 'default', 'description', 'encrypted', 'icon', 'overlay', 'tileSize'].forEach(prop => {
      if (source[prop]) {
        im[prop] = source[prop];
      }
    });
    global_imagery.push(im);
  })
  global_imagery.sort((a, b) => a.name.localeCompare(b.name));
  // Final callback after global imagery index has been processed
  refresh_layer_list()
});


function inside(point, vs) {
  // ray-casting algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html
  // Purpose: To find out which imagery polygon is at that location.

  var x = point[1],
    y = point[0];

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0],
      yi = vs[i][1];
    var xj = vs[j][0],
      yj = vs[j][1];

    var intersect = ((yi > y) != (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

function get_local_imagery() {
  // If polygon is defined and coordinate is in it 
  // OR polygon is not defined and therefore it's a global layer.
  pos = map.getCenter()
  return global_imagery.filter(function(el) {
    return !el.hasOwnProperty("polygon") || inside([pos.lat, pos.lng], el.polygon[0])
  })
}

// https://stackoverflow.com/a/64608760
var BingLayer = L.TileLayer.extend({
  getTileUrl: function(tilePoint) {
    //this._adjustTilePoint(tilePoint);
    return L.Util.template(this._url, {
      s: this._getSubdomain(tilePoint),
      u: this._quadKey(tilePoint.x, tilePoint.y, this._getZoomForUrl())
    });
  },
  _quadKey: function(x, y, z) {
    var quadKey = [];
    for (var i = z; i > 0; i--) {
      var digit = '0';
      var mask = 1 << (i - 1);
      if ((x & mask) != 0) {
        digit++;
      }
      if ((y & mask) != 0) {
        digit++;
        digit++;
      }
      quadKey.push(digit);
    }
    return quadKey.join('');
  }
});

function imagery_to_layers(img_list) {

  list2 = img_list.map(function(data) {

    if (data.zoomExtent == null) {
      data.zoomExtent = [1, 20]
    }
    var subdomains = (data.template.match(/{switch:(.*?)}/i) || ['', ''])[1].split(',').map(function(el) {
      return el.trim();
    });
    var options = {
      maxZoom: data.zoomExtent[1],
      minZoom: data.zoomExtent[0],
      attribution: "".concat("<a href=\"", data.terms_url, "\">", data.terms_text, "</a>"),
      subdomains: subdomains
    };
    if (data.type == "bing") {
      var url = data.template.replace(/{switch:(.*?)}/i, "{s}")
      testLayer = new BingLayer(url, {
        subdomains: subdomains,
        attribution: '&copy; <a href="http://bing.com/maps">Bing Maps</a>'
      });

    } else if (data.type == "tms" || data.default) {
      var url = data.template.replace(/{switch:(.*?)}/i, "{s}")
      testLayer = L.tileLayer(url.replace('{zoom}', '{z}'), options)
    } else {
      if (data.projection == null) {
        data.projection = "EPSG:3857"
      }
      // This portion is based on https://osmlab.github.io/editor-layer-index/
      var url = data.template.replace(/{switch:(.*)}/i, "[s}").replace(/{.*?}/g, '').replace("[s}",
        "{s}");
      // console.log(data.template, url)
      var layers = decodeURIComponent(url.match(/(&|\?)layers=(.*?)(&|$)/i)[2]);
      var styles = (url.match(/(&|\?)styles=(.*?)(&|$)/i) || [])[2] || '';
      var format = url.match(/(&|\?)format=(.*?)(&|$)/i)[2];
      var transparent = (url.match(/(&|\?)transparent=(.*?)(&|$)/i) || [])[2] || true;
      var version = (url.match(/(&|\?)version=(.*?)(&|$)/i) || [])[2] || '1.1.1';
      url = url.replace(
        /((layers|styles|format|transparent|version|width|height|bbox|srs|crs|service|request)=.*?)(&|$)/ig,
        '')
      console.log(url)
      testLayer = L.tileLayer.wms(url, {
        layers: layers,
        styles: styles,
        format: format,
        version: version,
        transparent: transparent,
        uppercase: true,
        maxZoom: options.maxZoom,
        minZoom: options.minZoom,
        attribution: options.attribution
      })

    }
    testLayer.name = data.name
    testLayer.id = data.id
    return testLayer
  });
  i = 0
  $('#Layers').empty();
  // Add imagery options to Layers list.
  list2.forEach(function(value) {
    el = document.createElement('option')
    el.setAttribute("value", i)
    i++;
    el.innerHTML = value.name
    $('#Layers')[0].appendChild(el);
  });
  return list2; // Return leaflet-compatible list of layers for this location.
}

function refresh_layer_list(old_layer_id = null) {
  localayers=get_local_imagery()
  console.log(localayers)
  layers = imagery_to_layers(localayers)
  console.log(old_layer_id, layers.filter((x) => old_layer_id==x.id).length>0)
  if (layers.filter((x) => old_layer_id==x.id).length>0){
      $("#Layers")[0].selectedIndex=list2.indexOf(list2.find(x => x.id === old_layer_id))
      changeLayer()
  } else {
    // Select OSM carto / Mapnik layer
    $("#Layers")[0].selectedIndex=list2.indexOf(list2.find(x => x.id === "MAPNIK"))
  }
}

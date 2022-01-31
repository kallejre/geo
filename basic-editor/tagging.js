/* Tag editor.

Contains autocomplete, which acts similar way as iD, but doesn't use iD's codebase.
*/
var buffered_taglist = [];
var last_tag_query = 0;

function get_taglist(query) {
  // If query contains "=", tag/value is requested, otherwise key.
  // Check that 0.3 sec has passed since last call
  if (Date.now() - last_tag_query < 300) {
    return buffered_taglist
  } else {
    last_tag_query = Date.now()
  }
  // Prepare parameters for query
  tag = query.split("=")
  params = {
    'page': 1,
    'rp': 10,
    'sortname': 'count_ways',
    'sortorder': 'desc'
  }
  params.query = tag[tag.length - 1]

  if (tag.length == 1) {
    url = taginfo_url + '/api/4/keys/all'
  } else {
    url = taginfo_url + '/api/4/key/values'
    params.key = tag[0]
  }
  // Make synchronous request to taginfo API
  var response;
  $.ajax({
    type: 'GET',
    url: url,
    dataType: 'json',
    async: false,
    processData: false,
    data: $.param(params),
    success: function(resp) {
      response = resp
    }
  });
  // Process response and return output
  if (tag.length == 1) {
    var out = response.data.sort(function(d) {
      return !d.key.startsWith(params.query)
    }).map(function(d) {
      return d.key
    })
  } else {
    var out = response.data.sort(function(d) {
      return !d.value.startsWith(params.query)
    }).map(function(d) {
      return d.value
    })
  }
  buffered_taglist = out
  /*
	$( "#automplete-1" )[0].autocomplete({
               source: buffered_taglist,
               minLength: 0,delay:200
            });*/
  console.log(out)
  return out
}

function split(val) {
  return val.split("=");
}

function extractLast(term) {
  return split(term).pop();
}

function load_autocomplete() {
  $(".active_tag")
    // don't navigate away from the field on tab when selecting an item
    .on("keydown", function(event) {
      // If update_used_imagery_list is defined
      if (typeof update_used_imagery_list !== 'undefined') {
        // Add currently selected imagery layer to Set.
        update_used_imagery_list()
      }
      if (event.keyCode === $.ui.keyCode.TAB &&
        $(this).autocomplete("instance").menu.active) {
        event.preventDefault();
      }
    })
    .autocomplete({
      source: function(request, response) {
        console.log(request.term)
        tag_res = get_taglist(request.term)
        response(tag_res)
      },
      search: function() {
        // custom minLength
        var term = extractLast(this.value);
        if (this.value.length < 2) {
          return false;
        }
      },
      focus: function() {
        // prevent value inserted on focus
        return false;
      },
      select: function(event, ui) {
        var terms = split(this.value);
        // remove the current input
        terms.pop();
        // add the selected item
        terms.push(ui.item.value);
        // add placeholder to get the comma-and-space at the end
        if (terms.length == 1) {
          terms.push("");
        }
        this.value = terms.join("=");
        return false;
      },
      appendTo: "ui-widget"
    });
}

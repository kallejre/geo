var global_id_counter=0;  // Used to workaround quick id generation bug.
var lht=false;  // Variable for left hand traffic.
var lane_change_str={"none": "Allow lane change? 🟧",  // Last character is yellow square emoji
    "no": "Can't change lane 🟥",  // Last character is red square emoji
    "yes": "Can change lane 🟩"};  // Last character is green square emoji

function addColumn() {
    row = document.getElementById('main-lanes-row');
    var temp_lane_id = genereateID();
    var cell = document.createElement("td");
    cell.setAttribute("id", "lane_" + temp_lane_id);

    var htm = document.getElementById("template1").innerHTML;
    htm = htm.replaceAll("{lane_id}", temp_lane_id);
    cell.innerHTML = htm;
    console.log("Created " + temp_lane_id);
    row.appendChild(cell);

    // Add destination module
    // lane=document.getElementById("lane_"+temp_lane_id);
    dest_cell = document.getElementById("dest_cell_" + temp_lane_id);
    var htm = document.getElementById("template2").innerHTML;
    dest_cell.innerHTML = htm.replaceAll("{lane_id}", temp_lane_id);
    //.replaceAll("{dest_table_id}", "dest_table_"+temp_lane_id);
    //   .replaceAll("{dest_row_id}", "dest_row_"+temp_row_id);

    // Add arrow module
    // lane=document.getElementById("lane_"+temp_lane_id);
    arrow_cell = document.getElementById("arrow_cell_" + temp_lane_id);
    var htm = document.getElementById("template3").innerHTML;
    arrow_cell.innerHTML = htm.replaceAll("{lane_id}", temp_lane_id);

    // Unhide lane change button
    var tmp = row.getElementsByClassName("lanechange_btn")
    if (tmp.length > 1) {
        tmp[tmp.length - 2].classList.remove("hide")
    }
    document.getElementById("dest_table_" + temp_lane_id).innerHTML = "";
    new_destination(temp_lane_id)
}

function deleteByID(ide) {
    console.log("Deleting by ID");
    console.log(ide);
    //var elem = document.getElementById(ide);
    if (typeof(ide) == "string") {
        var ide = document.getElementById(ide);
    }
    ide.parentNode.removeChild(ide);
    var tmp = row.getElementsByClassName("lanechange_btn")
    if (ide.id.includes("lane_")) {
        tmp[tmp.length - 1].classList.add("hide")
    }
    return false;
}

//document.getElementById("template1").innerHTML.replace("{{lane_id}}", "5")
function genereateID() {
    // 86400000=1000*3600*24
    global_id_counter++;
    var timestamp = Date.now() % 86400000 + global_id_counter;
    return timestamp.toString(34);
}

function update_arrow_image(ide) {
    if (!document.getElementById("arrow_" + ide + "_9").checked) {
        for (i = 1; i < 9; i++) {
            if (document.getElementById("arrow_" + ide + "_" + i).checked) {
                document.getElementById("arrow_" + ide + "_img_" + i).classList.remove("hide")
            } else {
                document.getElementById("arrow_" + ide + "_img_" + i).classList.add("hide")
            }
        }
    } else {
        for (i = 1; i < 9; i++) {
            document.getElementById("arrow_" + ide + "_img_" + i).classList.add("hide")
        }
    }
}

function update_arrow(ide) {
    // console.log(ide)
    if (document.getElementById("arrow_" + ide + "_9").checked) {
        document.getElementById("arrow_" + ide + "_9").checked = false;
    }
    update_arrow_image(ide)
}

function update_arrow_2(ide) {
    // Used only when selecting turn=none
    if (document.getElementById("arrow_" + ide + "_9").checked) {
        for (i = 1; i < 9; i++) {
            document.getElementById("arrow_" + ide + "_" + i).checked = false;
        }
    }
    update_arrow_image(ide);
}

function new_destination(ide, drop_val = "", input_val = "") {
    // Generates new field for destinations list.
    var dest_table = document.getElementById("dest_table_" + ide)
    var temp_dest_id = genereateID();
    var row = document.createElement("tr");
    row.setAttribute("id", "dest_row_" + temp_dest_id);
    row.setAttribute("class", "dest_row");
    row.classList.add("exclude_drag");
    var htm = document.getElementById("template4").innerHTML;
    htm = htm.replaceAll("{dest_row_id}", temp_dest_id).replaceAll("{lane_id}", ide);
    row.innerHTML = htm;
    var tmp=dest_table.parentElement.getElementsByClassName("exclude_drag")
    // document.getElementById("dest_table_" + ide).lastChild
    for (var i = 0; i < tmp.length; i++) {
        last_element=tmp[i];
        console.log(last_element)
        last_element.getElementsByTagName("input")[0].removeAttribute("onclick")
        last_element.getElementsByTagName("input")[0].removeAttribute("oninput")
        last_element.getElementsByTagName("button")[0].classList.remove("hide")
        last_element.getElementsByTagName("input")[0].setAttribute("placeholder", "Destination tag value")
        last_element.classList.remove("exclude_drag")
    }
    row.getElementsByTagName("input")[0].value = input_val
    row.getElementsByTagName("select")[0].value = drop_val
    dest_table.appendChild(row);
    //console.log(htm);
    
      $( function() {
        $( ".dest_table" ).sortable({
          connectWith: ".dest_table",
          cancel: '.destiation_input, .destiation_select, .exclude_drag' 
        }).disableSelection();
      } );
}


function copyLeft(ide) {
    // Leftover function covered by copyRight()
    alert("You shouldn't see this message")
    var new_id = genereateID()
    console.log(new_id)
    console.log(ide)
    var source = document.getElementById('lane_' + ide)
    source.insertAdjacentHTML('beforebegin', source.outerHTML.replaceAll(ide, new_id))
    for (i = 1; i < 10; i++) {
        document.getElementById("arrow_" + new_id + "_" + i).checked = document.getElementById("arrow_" +
            ide +
            "_" + i).checked
    }

    document.getElementById("change_lane_" + new_id).classList.remove("hide")
    document.getElementById("dest_table_" + new_id).innerHTML = "";
    [...document.getElementById("dest_cell_" + ide).getElementsByTagName("tr")].forEach((row) => {
        console.log(row)
        drop = row.getElementsByTagName("select")[0].value
        sel = row.getElementsByTagName("input")[0].value
        new_destination(new_id, drop, sel);
    })
}

function copyRight(ide) {
    // Copies lane to the right side of current
    // Left or right is basically meaningless, because both will result in two identical lanes next to each other.
    var new_id = genereateID()
    console.log(new_id)
    console.log(ide)
    var source = document.getElementById('lane_' + ide)
    source.insertAdjacentHTML('afterend', source.outerHTML.replaceAll(ide, new_id))
    for (i = 1; i < 10; i++) {
        document.getElementById("arrow_" + new_id + "_" + i).checked = document.getElementById("arrow_" +
            ide +
            "_" + i).checked
    }
    document.getElementById("change_lane_" + ide).classList.remove("hide")
    document.getElementById("dest_table_" + new_id).innerHTML = "";
    [...document.getElementById("dest_cell_" + ide).getElementsByTagName("tr")].forEach((row) => {
        drop = row.getElementsByTagName("select")[0].value
        sel = row.getElementsByTagName("input")[0].value
        new_destination(new_id, drop, sel);
    })
}

function exportOSM() {
    // Maine feature of the website. Rather buggy
    document.getElementById("out-pre").innerHTML = "Export failed."  // Fallback in case export fails...
    document.getElementById("out-pre").value = "Export failed."
    var lane_suffix = ":lanes"
    var all_lanes = document.getElementById("main-lanes-row")
    var lane_count = all_lanes.childElementCount;
    if (lane_count == 0) {
        alert("No lanes to export. \n Click \"Add lane\" to add lane."); // ... such as in this situation
        return;
    } else if (lane_count == 1) {
        lane_suffix = ""  // No need for ":lanes" suffix, if there's no lanes.
    }
    all_keys = new Set();
    var output_keys = {
        "turn:lanes": Array()
    };
    for (var e = 0; e < lane_count; e++) {
        output_keys["turn:lanes"].push([])  // Generate sublist for each lane
    }
    /*
      Main procedure idea in this export is to generate 2D array, for lanes and for different values,
      which are later merged together with text joining operators.
      Lane arrows and lane changing have some extra steps, but final step is same.
    */
    var lanes = all_lanes.children;
    // First, it iters over all lanes to find unique keys.
    for (var i = 0; i < lane_count; i++) {
        var lane = lanes[i];
        var selections = lane.getElementsByTagName("select") // Drop-down lists.
        var inputs = lane.getElementsByTagName("input") // Drop-down lists.
        for (var j = 0; j < selections.length; j++) {
            var val = selections[j].value
            if (val != "" && inputs[j].value!="") {
                // Potential optimizations in future (add check if key is already present)
                all_keys.add(val);
                output_keys[val + lane_suffix] = Array()
                for (var e = 0; e < lane_count; e++) {
                    output_keys[val + lane_suffix].push([])
                }
            }
        }
        console.log(lane)
        if (lane.getElementsByClassName("lanechange_btn")[0].innerHTML != lane_change_str.none && !lane.getElementsByClassName("lanechange_btn")[0].classList.contains("hide") ) {
            output_keys["change:lanes"] = Array()
            /*for (var e = 0; e < lane_count; e++) {
              output_keys[val + lane_suffix].push([])
            }*/
        } // if ("change:lanes" in output_keys)  */
    }

    for (var i = 0; i < lane_count; i++) { // Iter over all lanes to find values.
        var lane = lanes[i];
        // Destinations
        var selections = lane.getElementsByTagName("select") // Drop-down lists.
        var inputs = lane.getElementsByTagName("input") // Contains checkboxes and textboxes.
        for (var j = 0; j < selections.length; j++) {
            if (selections[j].value != "" && inputs[j].value != "") {
                output_keys[selections[j].value + lane_suffix][i].push(inputs[j].value)
            }
        }

        // Lane change
        if ("change:lanes" in output_keys && i != lane_count - 1) {
            switch (lane.getElementsByClassName("lanechange_btn")[0].innerHTML) {
                case lane_change_str.no:
                    output_keys["change:lanes"].push("no")
                    break;
                case lane_change_str.yes:
                    output_keys["change:lanes"].push("yes")
                    break;
                default: // lane_change_str.none
                    output_keys["change:lanes"].push("none")
            }
        }

        // Lane arrows
        var temp_arrows = []
        for (var j = 0; j < inputs.length; j++) {
            if (inputs[j].type == "checkbox") {
                // Proccess checboxes.
                if (inputs[j].checked) {
                    console.log(inputs[j].value, inputs[j].checked)

                    temp_arrows.push(inputs[j].value)
                }
            }
        }
        if (temp_arrows.length == 0) {
            temp_arrows.push("none")
        }
        console.log(temp_arrows)
        output_keys["turn:lanes"][i] = temp_arrows;
    }
    console.log(output_keys)
    // Fix lane changes
    if (output_keys.hasOwnProperty("change:lanes")) {
        var tmp = Array()
        var tmp1 = output_keys["change:lanes"]
        console.log(tmp1)
        tmp.push([tmp1[0]])
        for (var i = 1; i < tmp1.length; i++) {
            if (tmp1[i - 1] == 'no' && tmp1[i] == 'no') {
                tmp.push(['no'])
            } else if (tmp1[i - 1] == 'no' && tmp1[i] == 'yes') {
                tmp.push(['not_left'])
            } else if (tmp1[i - 1] == 'no' && tmp1[i] == 'none') {
                tmp.push(['not_left'])
            } else if (tmp1[i - 1] == 'yes' && tmp1[i] == 'no') {
                tmp.push(['not_right'])
            } else if (tmp1[i - 1] == 'yes' && tmp1[i] == 'yes') {
                tmp.push(['yes'])
            } else if (tmp1[i - 1] == 'yes' && tmp1[i] == 'none') {
                tmp.push(['yes'])
            } else if (tmp1[i - 1] == 'none' && tmp1[i] == 'no') {
                tmp.push(['not_right'])
            } else if (tmp1[i - 1] == 'none' && tmp1[i] == 'yes') {
                tmp.push(['yes'])
            } else if (tmp1[i - 1] == 'none' && tmp1[i] == 'none') {
                tmp.push(['none'])
            }
        }
        tmp.push([tmp1[tmp1.length - 1]])
        output_keys["change:lanes"] = tmp;
        //console.log(output_keys["change:lanes"])
    }

    // Formatting output
    var output_str = Array();
    Object.keys(output_keys).forEach(function(value) {
        console.log(value, output_keys[value])
        var valuelist = output_keys[value].map(function(item) {
            if (item.length==0) {return "none"}
            return item.join(";")
        }).join("|");
        output_str.push(value + "=" + valuelist)
    })
    output_str.push("lanes=" + lane_count)
    output_str.sort();
    output_str = output_str.join("\n")
    document.getElementById("out-pre").value = output_str.replaceAll(";;", ";").replaceAll(";;", ";")
        .replaceAll(";|", "|").replaceAll("|;", "|");
}

function broken() {
    alert("This placeholder button is broken (not implemented yet)")
}
// document.querySelector('button').onclick = addColumn

function lane_test(ide) {
    // Cycles through 3 states of lane change possibility.
    btn = document.getElementById("change_lane_" + ide);
    if (btn.innerHTML == lane_change_str.none) {
        btn.innerHTML = lane_change_str.no
    } else if (btn.innerHTML == lane_change_str.no) {
        btn.innerHTML = lane_change_str.yes
    } else {
        btn.innerHTML = lane_change_str.none
    }
}

function toggle_warning() { // Warning about closing enos.
    if (window.location.href.includes("enos")) {
        document.getElementById("warning").classList.toggle("hide")
    };
    addColumn();
}
function lhdrhd() {
    var revs=document.getElementsByClassName("Reverse_none")
    var uturns=document.getElementsByClassName("uturn")
    lht=!lht
    if (lht) {
       document.getElementById("lhdrhd_button").innerHTML="Switch to RHT"
    } else {
       document.getElementById("lhdrhd_button").innerHTML="Switch to LHT"
    }
    for (var i=0;i<uturns.length;i++) {
        if (lht) {
            uturns[i].src="U-lht.png"
        } else {
            uturns[i].src="U.png"
        }
    }
    for (var i=0;i<revs.length;i++) {
        revs[i].insertBefore(revs[i].children[1], revs[i].children[0]);
    }
}

function importOSM() {
    alert("This placeholder button is broken (not implemented yet)")
    
    /*
    out=dict()
    for s in a.split('\n'):
        x=s.split('=')
        out[x[0]]=list(map(lambda y:y.split(';'),x[1].split('|')))
    */
}

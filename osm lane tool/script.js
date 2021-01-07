var global_id_counter=0;  // Used to workaround quick id generation bug.
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
    // Ainult clear
    // console.log(ide)
    if (document.getElementById("arrow_" + ide + "_9").checked) {
        for (i = 1; i < 9; i++) {
            document.getElementById("arrow_" + ide + "_" + i).checked = false;
        }
    }
    update_arrow_image(ide);
}

function new_destination(ide, drop_val = "", input_val = "") {
    var dest_table = document.getElementById("dest_table_" + ide)
    var temp_dest_id = genereateID();
    var row = document.createElement("tr");
    row.setAttribute("id", "dest_row_" + temp_dest_id);
    var htm = document.getElementById("template4").innerHTML;
    htm = htm.replaceAll("{dest_row_id}", temp_dest_id).replaceAll("{lane_id}", ide);
    row.innerHTML = htm;
    var last_element = document.getElementById("dest_table_" + ide).lastChild;
    if (document.getElementById("dest_table_" + ide).children.length > 0) {
        last_element.getElementsByTagName("input")[0].removeAttribute("onclick")
        last_element.getElementsByTagName("input")[0].removeAttribute("oninput")
        last_element.getElementsByTagName("button")[0].classList.remove("hide")
        last_element.getElementsByTagName("input")[0].setAttribute("placeholder", "Destination tag value")
    }
    row.getElementsByTagName("input")[0].value = input_val
    row.getElementsByTagName("select")[0].value = drop_val
    dest_table.appendChild(row);
    //console.log(htm);
}

function copyLeft(ide) {
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
    document.getElementById("out-pre").innerHTML = "Export failed."
    var lane_suffix = ":lanes"
    var all_lanes = document.getElementById("main-lanes-row")
    var lane_count = all_lanes.childElementCount;
    if (lane_count == 0) {
        alert("No lanes to export. \n Click \"Add lane\" to add lane.");
        return;
    } else if (lane_count == 1) {
        lane_suffix = ""
    }
    all_keys = new Set();
    var output_keys = {
        "turn:lanes": 0
    };
    output_keys["turn:lanes"] = Array();
    for (var e = 0; e < lane_count; e++) {
        output_keys["turn:lanes"].push([])
    }
    var lanes = all_lanes.children;
    for (var i = 0; i < lane_count; i++) {
        var lane = lanes[i]; // Iter over all lanes to find unique keys.
        var selections = lane.getElementsByTagName("select") // Drop-down lists.
        for (var j = 0; j < selections.length; j++) {
            var val = selections[j].value
            if (val != "") {
                all_keys.add(val);
                output_keys[val + lane_suffix] = Array()
                for (var e = 0; e < lane_count; e++) {
                    output_keys[val + lane_suffix].push([])
                }
            }
        }
        console.log(lane)
        if (lane.getElementsByClassName("lanechange_btn")[0].innerHTML != lane_change_str.none) {
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
            id = selections[j].id
            var textbox = document.getElementById("input_" + id.split('_')[1] + "_" + id.split('_')[2])
            if (selections[j].value != "" && textbox.value != "") {
                output_keys[selections[j].value + lane_suffix][i].push(textbox.value)
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
        console.log(output_keys[value])
        output_keys[value].map(function(x) {
            return x.join(";")
        })

        var valuelist = output_keys[value].map(function(item) {
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

function importOSM() {
    alert("This placeholder button is broken (not implemented yet)")
}

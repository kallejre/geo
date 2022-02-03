function set_cookie(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; Expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; SameSite=Lax; path=/";
}

function delete_cookie(name) {
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

function get_cookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

function listCookies() {
    var theCookies = document.cookie.split(';');
    var aString = '';
    for (var i = 1 ; i <= theCookies.length; i++) {
        aString += i + ' ' + theCookies[i-1] + "\n";
    }
    return aString;
}

function listStorage() {
    var aString = '';
    for (var i = 0; i < localStorage.length; i++){
        var k = localStorage.key(i);
        aString += i+1 + ' ' + k+"="+localStorage.getItem(k) + "\n";
    }
    return aString;
}

show_cookei_msg = () => alert('You have following cookies:\n'+listCookies()+'\n\nAnd those are in local storage:\n'+listStorage())

    var toInsert = document.createElement("div");
    toInsert.innerHTML = `PS. This website uses functional cookies. <a onclick="show_cookei_msg()" style="pointer-events: initial;" href="#">Click here</a> to read more`;
    toInsert.id="cookei"
    toInsert.style.position = "fixed";     
    toInsert.style.bottom = "0px";
    toInsert.style["z-index"]= 9999;
    toInsert.style["pointer-events"] = "none";
    
document.children[0].appendChild(toInsert)
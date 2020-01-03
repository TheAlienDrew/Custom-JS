// ==UserScript==
// @name         Dark Scrollbar for Dark Websites
// @namespace    https://github.com/TheAlienDrew/Tampermonkey-Scripts
// @version      1.3.4
// @downloadURL  https://github.com/TheAlienDrew/Tampermonkey-Scripts/raw/master/Any%20-%20For%20Dark%20Reader/Dark%20Scrollbar%20for%20Dark%20Websites.user.js
// @description  Enables a dark scrollbar for every dark website in Dark Reader's list of global dark websites.
// @author       AlienDrew
// @match        http*://*/*
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @resource     css https://userstyles.org/styles/169873.css
// @resource     config https://github.com/darkreader/darkreader/raw/master/src/config/dark-sites.config
// ==/UserScript==

// dark scrollbar via https://userstyles.org/styles/169873
// dark-site.config via https://github.com/darkreader/darkreader/blob/master/src/config/

// required variables
const dark_scrollbar = GM_getResourceText('css').split('\n'); // gets updated dark scrollbar source (so I don't have to manually update this script all the time) and puts each line into an array
const dark_sites = GM_getResourceText('config').split('\n'); // gets all sites and puts them in an array
const current_url = window.location.href.replace(/(^\w+:|^)\/\//, '').replace(/^www\./, "").replace(/\/$/, ""); // removes protocol, 'www.', and trailing slash
var is_dark = false;
// required functions
function addStyleString(str) {
    var node = document.createElement('style');
    node.innerHTML = str;
    document.body.appendChild(node);
}

// loop through dark_sites and see if the current URL matches
var i;
for (i = 0; i < dark_sites.length; i++) {
    // note:
    // `$` = end of url; must match to end
    // `*` = url can end in any way; preceeding must match
    // `/` = it must match beyond the domain; url can end in any way

    const dark_url = dark_sites[i];
    // check length against both urls are the same

    // check dark url for special characters $ or *
    if (dark_url.includes('$')) {
        // string compare both urls for a match without trailing /
        if (current_url.localeCompare(dark_url.split('$')[0].replace(/\/$/, "")) == 0) is_dark = true;
    } else if (dark_url.includes('*')) {
        // string compare both urls without special character
        if (current_url.localeCompare(dark_url.split('*')[0]) == 0) is_dark = true;
        // only if the current_url is still possible
        else if (current_url.length > dark_url.length - 1) {
            // string compare both urls substringed current_url and without trailing * and /
            if (current_url.substring(0, dark_url.length - 1).localeCompare(dark_url.split('*')[0].replace(/\/$/, "")) == 0) is_dark = true;
        }
    } else if (dark_url.includes('/')) { // comparing to full link
        // compare strings without possible trailing slash on dark_url
        var dark_verify = dark_url.replace(/\/$/, "");
        // string compare both urls for a match
        if (current_url.localeCompare(dark_verify) == 0) is_dark = true;
        // only if the current_url is still possible
        else if (current_url.length > dark_verify.length) {
            // string compare both urls substringed current_url and without trailing slash
            if (current_url.substring(0, dark_verify.length).localeCompare(dark_verify) == 0) is_dark = true;
        }
    } else { // comparing to domain
        // compare strings without first slash
        var current_verify = current_url.split('/')[0];
        if (current_verify.localeCompare(dark_url) == 0) is_dark = true;
    }
}

// enable dark scrollbar accordingly
if (is_dark) {
    var dark_scrollbar_fixed = "";

    // starts at 1 and ends at the second to last line to remove the @-moz-document encasement
    var k;
    for (k = 1; k < dark_scrollbar.length - 1; k++) {
        dark_scrollbar_fixed = dark_scrollbar_fixed.concat(dark_scrollbar[k]);
    }

    addStyleString(dark_scrollbar_fixed);
}

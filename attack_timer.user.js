// ==UserScript==
// @name         LSN attack uploader
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @include        *://*.travian.*/build.php*gid=16*tt=2*
// @exclude     *.css
// @exclude     *.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=edu.tw
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function scriptReady(callback) {
        var script = document.createElement("script");
        script.textContent = "jQuery(document).ready(" + callback.toString() + ");";
        document.body.appendChild(script);
    }
    function main() {
	var date = new Date();
	var customScriptUrl = 'https://hobexd.github.io/Linsen2020/attack_timer.js?time='+date.getDay()+'.'+date.getMonth()+'.'+date.getYear()+'-'+Math.round(date.getHours())+'-'+date.getMinutes();
	var customScriptJSElement = document.createElement('script');
	customScriptJSElement.setAttribute('type', 'text/javascript');
	customScriptJSElement.setAttribute('src', customScriptUrl);
	document.getElementsByTagName("body")[0].appendChild(customScriptJSElement);
}
    scriptReady(main);

})();
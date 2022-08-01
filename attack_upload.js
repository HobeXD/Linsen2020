var button = document.createElement("button");
button.innerHTML = "Upload";
button.style.position = 'absolute';
button.style.x = 10;
button.style.y = 10;
button.style.width = 300;
button.style.height = 300;
button.style.padding = '10px';
button.style.background = '#00ff00';
button.style.display = 'block';
button.style.zIndex = 99;

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(button);

// 3. Add event handler
button.addEventListener ("click", function() {
    alert("did something");
});
var button = document.createElement("button");
button.innerHTML = "複製公波";
button.style.position = 'fixed';
button.style.top = "10px";
button.style.left = "10px";
button.style.width = 300;
button.style.height = 300;
button.style.padding = '10px';
button.style.background = '#0f0f0f';
button.style.display = 'block';
button.style.zIndex = 99;

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(button);

// 3. Add event handler
button.addEventListener ("click", function() {
    alert("did something");
    navigator.clipboard.writeText("1,2,3");
});
var button = document.createElement("button");
button.innerHTML = "複製攻波";
button.style.position = 'fixed';
button.style.top = "10px";
button.style.left = "10px";
button.style.width = 300;
button.style.height = 300;
button.style.padding = '10px';
button.style.background = '#f0f0f0';
button.style.display = 'block';
button.style.zIndex = 99;

// 2. Append somewhere
var body = document.getElementsByTagName("body")[0];
body.appendChild(button);

// 3. Add event handler
button.addEventListener ("click", function() {
    navigator.clipboard.writeText("1,2,3");
    var copyText = "";
    var attacks = document.getElementsByClassName("inAttack");
    for (var i = 0; i < attacks.length; i++) {
      attacker = attacks[i].getElementsByTagName("thead")[0].getElementsByTagName("td")[1].getElementsByTagName("a")[1].innerHTML.split(" ")[0];
      attackerPosX = attacks[i].getElementsByClassName("coordinateX")[0].innerHTML.innerText.replace("−", "-").replace(/[^\d-]/g, '');
      attackerPosY = attacks[i].getElementsByClassName("coordinateY")[0].innerHTML.innerText.replace("−", "-").replace(/[^\d-]/g, '');
      attackTime = attacks[i].getElementsByClassName("at")[0].innerHTML.replace(/[^\d:]/g, '');
      copyText += attacker + '\t' + attackerPosX + '|' + attackerPosY + '\t' + attackTime + '\n';
    }
    navigator.clipboard.writeText(copyText);
    alert("複製完成");
});
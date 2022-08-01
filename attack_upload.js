var button = document.createElement("button");
button.innerHTML = "複製攻波";
button.style.position = 'absolute';
button.style.top = "10px";
button.style.left = "10px";
button.style.width = 300;
button.style.height = 300;
button.style.padding = '10px';
button.style.background = '#f0f0f0';
button.style.display = 'block';
button.style.zIndex = 99;

// 2. Append somewhere
var body = document.getElementsByClassName("contentPage")[0];
body.appendChild(button);

// 3. Add event handler
button.addEventListener ("click", function() {
    var copyText = "";
    attacked_id = document.getElementsByClassName("playerName")[0].innerHTML;
    attacked_X = document.getElementById("sidebarBoxVillagelist").getElementsByClassName("active")[0].getElementsByClassName("coordinateX")[0].innerHTML.replaceAll("−", "-").replace(/[^\d-]/g, '');
    attacked_Y = document.getElementById("sidebarBoxVillagelist").getElementsByClassName("active")[0].getElementsByClassName("coordinateY")[0].innerHTML.replaceAll("−", "-").replace(/[^\d-]/g, '');
    var attacks = document.getElementsByClassName("inAttack");
    for (var i = 0; i < attacks.length; i++) {
      attacker = attacks[i].getElementsByTagName("thead")[0].getElementsByTagName("td")[1].getElementsByTagName("a")[1].innerHTML.split(" ")[0];
      attackerPosX = attacks[i].getElementsByClassName("coordinateX")[0].innerHTML.replaceAll("−", "-").replace(/[^\d-]/g, '');
      attackerPosY = attacks[i].getElementsByClassName("coordinateY")[0].innerHTML.replaceAll("−", "-").replace(/[^\d-]/g, '');
      attackTime = attacks[i].getElementsByClassName("at")[0].innerHTML.replace(/[^\d:]/g, '');
      
      
      copyText += attacked_id + '\t' + attacked_X + '|' + attacked_Y + '\t' + attacker + '\t' + attackerPosX + '|' + attackerPosY + '\t' + attackTime + '\n';
    }
    navigator.clipboard.writeText(copyText);
    alert("已複製"+attacks.length+"波攻擊");
});
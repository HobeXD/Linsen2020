let button = document.createElement("button");
button.innerHTML = "攻波定時";
button.style.position = 'absolute';
button.style.bottom = "10px";
button.style.left = "10px";
button.style.width = 300;
button.style.height = 300;
button.style.padding = '10px';
button.style.background = '#f0f0f0';
button.style.display = 'block';
button.style.zIndex = 99;

let time_input = document.createElement("input");
time_input.setAttribute("type", "text");
time_input.style.position = 'absolute';
time_input.style.bottom = "50px";
time_input.style.left = "10px";
time_input.style.width = 300;
time_input.style.zIndex = 99;
d = new Date();
time_input.value = d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()+' '+d.getHours()+':'+d.getMinutes()+':'+d.getSeconds();

// 2. Append somewhere
let body = document.getElementsByClassName("contentPage")[0];
body.appendChild(button);
body.appendChild(time_input);
let t_holder = null;

// 3. Add event handler
button.addEventListener ("click", function() {
  t_holder = setTimeout(() => {
    $('.rallyPointConfirm')[0].click()
  }, new Date(time_input.value) - new Date());
  console.log(t_holder, new Date(time_input.value) - new Date());
  button.innerHTML = '已設定完成';
  button.disabled = true;
  time_input.disabled = true;
});

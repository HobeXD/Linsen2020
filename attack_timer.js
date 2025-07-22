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

let countdown_text = document.createElement("p");
countdown_text.setAttribute("type", "text");
countdown_text.style.position = 'absolute';
countdown_text.style.bottom = "60px";
countdown_text.style.left = "10px";
countdown_text.style.zIndex = 99;
countdown_text.innerHTML = "";

let time_input = document.createElement("input");
time_input.setAttribute("type", "text");
time_input.style.position = 'absolute';
time_input.style.bottom = "50px";
time_input.style.left = "10px";
time_input.style.width = 300;
time_input.style.zIndex = 99;

let arrived_text = document.createElement("p");
arrived_text.setAttribute("type", "text");
arrived_text.style.position = 'absolute';
arrived_text.style.bottom = "60px";
arrived_text.style.left = "200px";
arrived_text.style.zIndex = 99;
arrived_text.innerHTML = "抵達時間: ";

let arrived_time = document.createElement("input");
arrived_time.setAttribute("type", "text");
arrived_time.style.position = 'absolute';
arrived_time.style.bottom = "50px";
arrived_time.style.left = "200px";
arrived_time.style.width = 300;
arrived_time.style.zIndex = 99;


function formatISODateTime(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return date.getFullYear() + '-' +
         pad(date.getMonth() + 1) + '-' +
         pad(date.getDate()) + 'T' +
         pad(date.getHours()) + ':' +
         pad(date.getMinutes()) + ':' +
         pad(date.getSeconds());
}
let d = new Date();
time_input.value = formatISODateTime(d);

let travel_time = document.getElementById('in').innerHTML.match(/\d{1,2}:\d{2}:\d{2}/g)[0].split(':');
let arrived = new Date(d.getTime() + (travel_time[0]*3600 + travel_time[1]*60 + travel_time[2]*1) * 1000);
arrived_time.value = formatISODateTime(arrived);

// 2. Append somewhere
let body = document.getElementsByClassName("contentPage")[0];
body.appendChild(button);
body.appendChild(time_input);
body.appendChild(countdown_text);
body.appendChild(arrived_text);
body.appendChild(arrived_time);
let t_holder = null;


function last_counter() {
  setTimeout(() => {
    $('.rallyPointConfirm')[0].click()
  }, new Date(time_input.value) - new Date());
}

function countdown() {
  if (new Date(time_input.value) - new Date() > 0) {
    countdown_text.innerHTML = "倒數計時: " + (new Date(time_input.value) - new Date())/1000;
    setTimeout(countdown, 500);
  }
}

// 3. Add event handler
button.addEventListener ("click", function() {
  if (new Date(time_input.value) - new Date() > 1500) {
    setTimeout(last_counter, new Date(time_input.value) - new Date() - 1000);
  } else {
    last_counter();
  }
  setTimeout(countdown, 500);
  button.innerHTML = '已設定完成';
  button.disabled = true;
  time_input.disabled = true;
  arrived_time.disabled = true;
});

time_input.addEventListener ("change", function() {
  let travel_time = document.getElementById('in').innerHTML.match(/\d{1,2}:\d{2}:\d{2}/g)[0].split(':');
  let arrived = new Date(new Date(time_input.value).getTime() + (travel_time[0]*3600 + travel_time[1]*60 + travel_time[2]*1) * 1000);
  arrived_time.value = formatISODateTime(arrived);
});

arrived_time.addEventListener ("change", function() {
  let travel_time = document.getElementById('in').innerHTML.match(/\d{1,2}:\d{2}:\d{2}/g)[0].split(':');
  let depart = new Date(new Date(arrived_time.value).getTime() - (travel_time[0]*3600 + travel_time[1]*60 + travel_time[2]*1) * 1000);
  time_input.value = formatISODateTime(depart);
});
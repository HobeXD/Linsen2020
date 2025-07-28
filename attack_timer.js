// editing UI
document.getElementById('content').style.marginBottom = '100px';

const styleElement = document.createElement('link');
styleElement.setAttribute('rel', 'stylesheet');
styleElement.setAttribute('href', 'https://hobexd.github.io/Linsen2020/attack_time.css');
document.head.appendChild(styleElement);

const storageKey = 'savedArrivedTime';
const storageKey2 = 'savedArrivedListTime';
const buttonClassName = 'textButtonV1 green';
const savedTimeList = JSON.parse(localStorage.getItem(storageKey2)) || [];

const contentDiv = document.createElement("div");
contentDiv.className = 'attack-timer';

const startBlock = document.createElement("div");
startBlock.className = 'attack-timer-list';

const endBlock = document.createElement("div");
endBlock.className = 'attack-timer-list';

const timeList = document.createElement("div");
timeList.className = 'attack-timer-list';

const timeItem = document.createElement("div");
timeItem.className = 'attack-timer-item';

const setButton = document.createElement("button");
setButton.className = buttonClassName;
setButton.innerHTML = '攻波定時';

const resetButton = document.createElement("button");
resetButton.className = buttonClassName;
resetButton.innerHTML = '重設';

const countdownText = document.createElement("p");
// countdownText.className = 'attack-timer-countdown';
countdownText.innerHTML = '倒數計時: ';

const timeInput = document.createElement("input");
timeInput.setAttribute("type", "text");
// timeInput.className = 'attack-timer-input';

const arrivedText = document.createElement("p");
// arrivedText.className = 'attack-timer-countdown';
arrivedText.innerHTML = '抵達時間: ';

const arrivedTime = document.createElement("input");
arrivedTime.setAttribute("type", "text");
// arrivedTime.className = 'attack-timer-input';
const addIcon = `
  <svg width="12" height="12" viewBox="0 0 18 18">
    <path d="M16 10h-6v6H8v-6H2V8h6V2h2v6h6z" class="outline"></path>
    <path d="M16 10h-6v6H8v-6H2V8h6V2h2v6h6z" class="icon"></path>
  </svg>
`;

const deleteIcon = `
  <svg width="12" height="12" viewBox="0 0 18 6">
    <path d="M16 4H2V2h14z" class="outline"></path>
    <path d="M16 4H2V2h14z" class="icon"></path>
  </svg>
`;

const pushIcon = `
  <svg width="12" height="12" viewBox="0 0 18 18">
    <path d="M6 0L6 12L0 12L11 22L22 12L16 12L16 0Z" class="outline"></path>
    <path d="M6 0L6 12L0 12L11 22L22 12L16 12L16 0Z" class="icon"></path>
  </svg>
`;

const template = document.createElement('template');

const templateClassName = 'textButtonV2 buttonFramed plus rectangle withIcon green';
template.innerHTML = `
  <div class="attack-timer-item">
    <input type="text" placeholder="儲存時間">
    <button aria-label="Delete" Style="width: 24px; height: 24px;" class="${templateClassName}">${deleteIcon}</button>
    <button aria-label="Push" Style="width: 24px; height: 24px;" class="${templateClassName}">${pushIcon}</button>
  </div>
`;

const addButton = document.createElement("button");
addButton.className = "textButtonV2 buttonFramed plus rectangle withIcon green";
addButton.style.width = '24px';
addButton.style.height = '24px';
addButton.setAttribute("aria-label", "Add");
addButton.innerHTML = addIcon;

const saveTimeInput = document.createElement("input");
saveTimeInput.setAttribute("type", "text");
saveTimeInput.setAttribute("placeholder", "儲存時間");

// 2. Append somewhere
const body = document.getElementsByClassName("contentPage")[0];
body.appendChild(contentDiv);
contentDiv.appendChild(startBlock);
contentDiv.appendChild(endBlock);
contentDiv.appendChild(timeList);

startBlock.appendChild(countdownText);
startBlock.appendChild(timeInput);
startBlock.appendChild(setButton);

endBlock.appendChild(arrivedText);
endBlock.appendChild(arrivedTime);
endBlock.appendChild(resetButton);

timeList.appendChild(timeItem);
timeItem.appendChild(saveTimeInput);
timeItem.appendChild(addButton);

const formatISODateTime = (date) => {
  const pad = (n) => n.toString().padStart(2, '0');
  return date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + 'T' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes()) + ':' +
    pad(date.getSeconds()) + '.' +
    pad(date.getMilliseconds(), 3);
};

let t = null;
let ct = null;

function last_counter() {
  t = setTimeout(() => {
    $('.rallyPointConfirm')[0].click();
  }, new Date(timeInput.value) - new Date());
}

const addTimeItem = (saveTime) => {
  const newItem = template.content.firstElementChild.cloneNode(true);
  const del = newItem.querySelector('[aria-label="Delete"]');
  const push = newItem.querySelector('[aria-label="Push"]');
  const input = newItem.querySelector('input');
  input.value = saveTime;

  del.addEventListener("click", () => {
    const index = savedTimeList.indexOf(input.value);
    if (index > -1) {
      savedTimeList.splice(index, 1);
    }
    localStorage.setItem(storageKey2, JSON.stringify(savedTimeList));
    newItem.remove();
  });

  push.addEventListener("click", () => {
    if (input.value) {
      arrivedTime.value = formatISODateTime(new Date(input.value));
      arrivedTime.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  timeList.appendChild(newItem);
};

if (savedTimeList?.length > 0) {
  savedTimeList
    // .filter(saveTime => new Date(saveTime) > arrived) // Filter out empty strings
    .forEach(saveTime => {
      addTimeItem(saveTime);
    });
}

function countdown() {
  if (new Date(timeInput.value) - new Date() > 0) {
    countdownText.innerHTML = "倒數計時: " + (new Date(timeInput.value) - new Date()) / 1000;
    ct = setTimeout(countdown, 500);
  }
}

// 3. Add event handler
setButton.addEventListener("click", () => {
  if (new Date(timeInput.value) - new Date() > 1500) {
    t = setTimeout(last_counter, new Date(timeInput.value) - new Date() - 1000);
  } else {
    last_counter();
  }
  ct = setTimeout(countdown, 500);
  setButton.innerHTML = '已設定完成';
  setButton.disabled = true;
  resetButton.disabled = false;
  timeInput.disabled = true;
  arrivedTime.disabled = true;
});

// 3. Add event handler
resetButton.addEventListener("click", () => {
  clearTimeout(t);
  clearTimeout(ct);
  countdownText.innerHTML = "已取消攻擊";
  setButton.innerHTML = '攻波定時';
  setButton.disabled = false;
  resetButton.disabled = true;
  timeInput.disabled = false;
  arrivedTime.disabled = false;
});

timeInput.addEventListener("change", () => {
  const travelTime = document.getElementById('in').innerHTML.match(/\d{1,2}:\d{2}:\d{2}/g)[0].split(':');
  const arrived = new Date(new Date(timeInput.value).getTime() + (travelTime[0] * 3600 + travelTime[1] * 60 + travelTime[2] * 1) * 1000);
  arrivedTime.value = formatISODateTime(arrived);
});

arrivedTime.addEventListener("change", () => {
  const travelTime = document.getElementById('in').innerHTML.match(/\d{1,2}:\d{2}:\d{2}/g)[0].split(':');
  const depart = new Date(new Date(arrivedTime.value).getTime() - (travelTime[0] * 3600 + travelTime[1] * 60 + travelTime[2] * 1) * 1000);
  timeInput.value = formatISODateTime(depart);
  localStorage.setItem(storageKey, arrivedTime.value);
});

addButton.addEventListener("click", () => {
  const saveTime = saveTimeInput.value;

  savedTimeList.push(saveTime);
  localStorage.setItem(storageKey2, JSON.stringify(savedTimeList));

  addTimeItem(saveTime);

  saveTimeInput.value = '';
});


// 儲存的出發時間
//window.addEventListener('DOMContentLoaded', () => {
const d = new Date();
timeInput.value = formatISODateTime(d);

const travelTime = document.getElementById('in').innerHTML.match(/\d{1,2}:\d{2}:\d{2}/g)[0].split(':');
let arrived = new Date(d.getTime() + (travelTime[0] * 3600 + travelTime[1] * 60 + travelTime[2] * 1) * 1000);


const savedTime = new Date(localStorage.getItem(storageKey));
if (savedTime && savedTime > arrived) {
  arrived = savedTime;
}

arrivedTime.value = formatISODateTime(arrived);
arrivedTime.dispatchEvent(new Event('change', { bubbles: true }));

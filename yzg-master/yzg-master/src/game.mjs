import {
  app,
  WIDTH,
  HEIGHT,
  Game,
  Car,
  MainCar,
  ROAD_WIDTH,
  BitmapText,
  arrayEquals,
  getIndexes,
} from "../src/engine.mjs";

let game = new Game(app.stage);
window.game=game
game.setWanderers()
let currentStart =
  game.possibleStarts[Math.floor(Math.random() * game.possibleStarts.length)];
let roadOffsetY = currentStart * ROAD_WIDTH;
let mainCar = new MainCar(game, "temp_car");
window.mainCar = mainCar;
mainCar.setPosition(80, 50 + roadOffsetY);
//--------------------------------------------------
// WASD Butonları
const controlButtons = {
  up: document.getElementById("control-up"),
  left: document.getElementById("control-left"),
  down: document.getElementById("control-down"),
  right: document.getElementById("control-right"),
  brake: document.getElementById("control-brake"), // Fren için (space button)
};

// Kontrol işlevleri
const startMove = (direction) => {
  isDown["button_" + direction.toUpperCase()] = true;
};

const stopMove = (direction) => {
  isDown["button_" + direction.toUpperCase()] = false;
};
// Butonlara olay dinleyicileri ekleme
const addControlListeners = (button, direction) => {
  button.addEventListener("pointerdown", () => startMove(direction));
  button.addEventListener("pointerup", () => stopMove(direction));
  button.addEventListener("pointerout", () => stopMove(direction));
};

Object.entries(controlButtons).forEach(([direction, button]) => {
  addControlListeners(button, direction);
});

//--------------------------------------------------

let randCar = new Car(game, "temp_car");
randCar.setPosition(100, 100 + roadOffsetY);
const ticker = PIXI.Ticker.system;
window.ticker = ticker;
window.stage = app.stage;
window.app = app;
//testing section, will be deleted
let frameTimes = [];
let isDown = {};
window.addEventListener("keydown", (event) => {
  const isValid = /^(Arrow|[a-zA-Z ]$)/.test(event.key);
  if (isValid && !event.repeat) {
    isDown[event.key.toUpperCase()] = 1;
  }
  if (event.key == " ") {
    event.preventDefault();
  }
});
window.addEventListener("keyup", (event) => {
  delete isDown[event.key.toUpperCase()];
});
let frameText = "0";
let lastUpdate = Date.now();
const FIXED_LOOP_MS = 7;
const FIXED_LOOP_S = FIXED_LOOP_MS / 1000;
let accumulatedTime = 0;
const dropdowns = document.querySelectorAll(".model select");
dropdowns.forEach((dropdown, index) => {
  dropdown.addEventListener("change", () => {
    const selectedValue = dropdown.value.split("-")[0]
    if (index === 0) {
      mainCar.pathAlgorithm = selectedValue;
    } else {
      mainCar.chosenAlgorithms[index - 1] = selectedValue;
    }
  });
});

app.canvas.onpointerup = (e) => {
  let rect = e.target.getBoundingClientRect();
  let scaleX = WIDTH / rect.width;
  let scaleY = HEIGHT/rect.height
  let x = (e.clientX - rect.left) * scaleX;
  let y = (e.clientY - rect.top) * scaleY;
  if (
    mainCar.goal &&
    arrayEquals(getIndexes(mainCar.goal[0], mainCar.goal[1]), getIndexes(x, y))
  ) {
    mainCar.removeGoal();
    return;
  }
  mainCar.setGoal(x, y);
};
//https://stackoverflow.com/questions/1760250/how-to-tell-if-browser-tab-is-active
let notActiveFor = 0
let notActiveStart = Date.now()
window.onfocus = function () { 
  notActiveFor=Date.now()-notActiveStart
}; 
window.onblur = function () { 
  notActiveStart=Date.now()
}; 
let updateLoop = () => {
  let now = Date.now();
  let diff = now - lastUpdate;
  //sayfa arkaplana alındığında yeniden sayfaya geçildiğinde geçen sürenin tamamına dair değerler hesaplanıyordu
  //bu şekilde yapılınca kaldığı yerden devam ediyor
  accumulatedTime += Math.max(FIXED_LOOP_MS,diff-notActiveFor);
  if(notActiveFor!=0){
    notActiveFor=0
  }
  while (accumulatedTime >= FIXED_LOOP_MS) {
    if (isDown[" "]||isDown["button_BRAKE"]) {
      mainCar.brake(FIXED_LOOP_S,true);
    }
    if (isDown["W"] || isDown["ARROWUP"] || isDown["button_UP"]) {
      mainCar.moveForward(FIXED_LOOP_S,1,true);
    }
    if (isDown["S"] || isDown["ARROWDOWN"] || isDown["button_DOWN"]) {
      mainCar.moveBackward(FIXED_LOOP_S,1,true);
    }
    if (isDown["A"] || isDown["ARROWLEFT"] || isDown["button_LEFT"]) {
      mainCar.steerLeft(FIXED_LOOP_S,true);
    }
    if (isDown["D"] || isDown["ARROWRIGHT"] || isDown["button_RIGHT"]) {
      mainCar.steerRight(FIXED_LOOP_S,true);
    }
    game.tick(FIXED_LOOP_S);
    accumulatedTime -= FIXED_LOOP_MS;
  }
  lastUpdate = now;
};
setInterval(updateLoop, FIXED_LOOP_MS);
let scaleColor = (color, brightness)=>{
  let r = ((color >> 16) & 0xFF) * brightness;
  let g = ((color >> 8) & 0xFF) * brightness;
  let b = (color & 0xFF) * brightness;
  return ((r << 16) | (g << 8) | b) & 0xFFFFFF;
}
ticker.add((dt) => {
  game.graphicsTick();
  const baseColor = 0xaaaaaa;
  const cycleSpeed = 0.01;
  const brightness = 0.5 + 0.5 * Math.sin(game.tickCounter * cycleSpeed);
  //const tintedColor = scaleColor(baseColor, brightness);
  //app.stage.tint = 0x555555+tintedColor;
  frameTimes.push(Date.now());
});
// FPS Sayacı
let fpsFontSize = 20;
const bitmapFontText = new BitmapText({
  text: frameText,
  style: {
    fontFamily: "Desyrel",
    fontSize: fpsFontSize,
    align: "left",
  },
});
bitmapFontText.x = (WIDTH - fpsFontSize) / 2;
bitmapFontText.y = 0;
app.stage.addChild(bitmapFontText);
bitmapFontText.zIndex = 999;
let modelIdentifier = Math.random().toString(36).slice(2);
let model = await fetch("https://bilis.im/yzgmodel").then(
  (r) => r.json(),
  () => {}
);
// FPS Hesaplama
let secondCounter = 0;
window.frameTimes = frameTimes;
setInterval(() => {
  let now = Date.now();
  frameTimes = frameTimes.filter((e) => now - e < 1000);
  frameText = frameTimes.length.toString();
  if(!bitmapFontText.destroyed&&!game.destroyed){
    bitmapFontText.text = frameText;
    bitmapFontText.x = (WIDTH - fpsFontSize * frameText.length) / 2;
  }
  if (secondCounter++ % 30 == 0) {
    fetch("https://bilis.im/yzgmodelGuncelle", {
      method: "POST",
      body: JSON.stringify({ identifier: modelIdentifier, model: model }),
      headers: { "content-type": "application/json" },
    }).then(
      (r) => r.text(),
      () => {}
    );
  }
}, 1000);

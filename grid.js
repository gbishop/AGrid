import Reef from "./reef.js";

Reef.debug(true);

const data = {
  width: 4,
  height: 3,
  words: [
    "all",
    "can",
    "different",
    "do",
    "finished",
    "get",
    "good",
    "go",
    "help",
    "he",
    "here",
    "in",
  ],
  selected: -1,
};

/**
 * @typedef {typeof data} Props
 */

/** tag html template strings so prettier will format them and vim will highlight them
 * @returns string
 * @param {TemplateStringsArray} strings
 * @param {any[]} values
 */
function html(strings, ...values) {
  let str = "";
  strings.forEach((s, i) => {
    str += s + (values[i] || "");
  });
  return str;
}

const app = new Reef(".page", {
  data: data,
  /** @param {Props} props */
  template: (props) => {
    document.body.style.setProperty("--nrows", "" + props.height);
    document.body.style.setProperty("--ncols", "" + props.width);
    let result = "";
    props.words.forEach((word, index) => {
      result += html`
        <div class="symbol">
          <figure class="${props.selected === index ? "selected" : ""}">
            <img src="images/${word}.png" />
            <figcaption>${word}</figcaption>
          </figure>
        </div>
      `;
    });
    return result;
  },
});

window.addEventListener("load", () => app.render());
document.addEventListener("keydown", (e) => {
  console.log("kd", e);
  const data = app.getData();
  if (["ArrowRight", "Space", "Tab"].includes(e.code)) {
    e.preventDefault();
    app.setData({ selected: (data.selected + 1) % (data.width * data.height) });
  } else if (["Enter", "ArrowLeft"].includes(e.code)) {
    const word = document.querySelector(".selected figcaption").textContent;
    const msg = new SpeechSynthesisUtterance(word);
    speechSynthesis.speak(msg);
  }
});

var tx = -1,
  ty = -1,
  tt = -1;

document.addEventListener("touchstart", startHandler);
document.addEventListener("mousedown", startHandler);

/** @param {Event} e */
function startHandler(e) {
  console.log("ts", e);
  e.preventDefault();
  if (e instanceof TouchEvent) {
    const ct = e.changedTouches[0];
    tx = ct.screenX;
    ty = ct.screenY;
    tt = e.timeStamp;
  } else if (e instanceof MouseEvent) {
    tx = e.screenX;
    ty = e.screenY;
    tt = e.timeStamp;
  }
}

document.addEventListener("touchend", endHandler);
document.addEventListener("mouseup", endHandler);

/** @param {Event} e */
function endHandler(e) {
  console.log("te", e);
  const data = app.getData();
  const dx =
    (e instanceof TouchEvent
      ? e.changedTouches[0].screenX
      : e instanceof MouseEvent
      ? e.screenX
      : 0) - tx;
  const n = data.width * data.height;
  if (dx < -100) {
    console.log("left", dx);
    app.setData({ selected: (((data.selected - 1) % n) + n) % n });
  } else if (dx > 100) {
    console.log("right", dx);
    app.setData({ selected: (((data.selected + 1) % n) + n) % n });
  } else if (e.timeStamp - tt < 500) {
    console.log("tap", dx);
    if (data.selected >= 0) {
      const word = document.querySelector(".selected figcaption").textContent;
      const msg = new SpeechSynthesisUtterance(word);
      speechSynthesis.speak(msg);
    } else {
      const target = /** @type {HTMLElement} */ (e.target);
      const symbol = target.closest(".symbol");
      if (symbol) {
        const word = symbol.textContent;
        const msg = new SpeechSynthesisUtterance(word);
        speechSynthesis.speak(msg);
      }
    }
  } else {
    console.log("not");
  }
}

document.addEventListener("render", (e) => {
  if (e.target instanceof HTMLElement && e.target.matches(".page")) {
    console.log("render", e);
    const symbols = document.querySelectorAll("div.symbol");
    const data = app.getData();
    setTimeout(() => {
      symbols.forEach((/** @type {HTMLElement} */ symbol, i) => {
        if (i === data.selected) {
          const box = symbol.getBoundingClientRect();
          console.log("box", box);
          const scale = Math.min(
            window.innerWidth / box.width,
            window.innerHeight / box.height
          );
          const tx = (window.innerWidth - scale * box.width) / 2 - box.left;
          const ty = (window.innerHeight - scale * box.height) / 2 - box.top;
          const t = `translate(${tx}px, ${ty}px) scale(${scale}, ${scale})`;
          symbol.style.transform = t;
          symbol.style.transformOrigin = "top left";
          symbol.style.zIndex = "10";
          symbol.style.transition = "transform 0.5s ease-in-out 0.2s";
        } else {
          symbol.style.transform = "";
          symbol.style.zIndex = "1";
        }
      });
    }, 100);
  }
});

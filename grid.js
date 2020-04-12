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
    "in"
  ],
  selected: 0
};

/** @typedef {typeof data} Props */

const app = new Reef(".page", {
  data: data,
  /** @param {Props} props */
  template: props => {
    document.body.style.setProperty("--nrows", "" + props.height);
    document.body.style.setProperty("--ncols", "" + props.width);
    var html = "";
    props.words.forEach((word, index) => {
      html += `<div class="symbol">
        <figure class="${props.selected === index ? "selected" : ""}">
          <img src="images/${word}.png" />
          <figcaption>${word}</figcaption>
        </figure>
      </div>`;
    });
    return html;
  }
});

window.addEventListener("load", () => app.render());
document.addEventListener("keydown", e => {
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
document.addEventListener("render", e => {
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

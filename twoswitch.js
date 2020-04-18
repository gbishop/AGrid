function highlightRow(r) {
  console.log("hi", r);
}

function previewCell(r, c) {
  console.log("pre", r, c);
}

function play(r, c) {
  console.log("play", r, c);
}

let state = {
  row: 0,
  col: 0,
  level: 1,
  reps: 0,
  nrows: 3,
  ncols: 4,
  maxReps: 2
};

/** @typedef {typeof state} State */

/** determine the highlight
 * @param {number} r
 * @param {number} c
 * @param {State} s */
function highlight(r, c, s) {
  let result =
    (s.level == 1 && r == s.row && "row") ||
    (s.level == 2 && r == s.row && c == s.col && "cell") ||
    "";
  return result;
}

/** @callback conditionCallback
 * @param {State} s
 * @returns {boolean} */

/** @callback updateCallback
 * @param {State} s
 * @returns {Object}
 */

/** @callback actionCallback
 * @param {State} s
 */

/** @typedef {Object} Rule
 * @property {number} input
 * @property {conditionCallback} condition
 * @property {updateCallback} update
 * @property {actionCallback} [action]
 */

/** @type {Rule[]} rules */
let rules = [
  {
    input: 0,
    condition: s => s.level == 1 && s.row < s.nrows,
    update: s => ({ row: s.row + 1 })
  },
  {
    input: 0,
    condition: s => s.level == 1 && s.row == s.nrows,
    update: () => ({ row: 1 })
  },
  {
    input: 1,
    condition: s => s.level == 1,
    update: () => ({ level: 2, col: 1, reps: 1 })
  },
  {
    input: 0,
    condition: s => s.level == 2 && s.col < s.ncols,
    update: s => ({ col: s.col + 1 })
  },
  {
    input: 0,
    condition: s => s.level == 2 && s.col == s.ncols && s.reps < s.maxReps,
    update: s => ({ col: 1, reps: s.reps + 1 })
  },
  {
    input: 0,
    condition: s => s.level == 2 && s.col == s.ncols && s.reps == s.maxReps,
    update: () => ({ level: 1 })
  },
  {
    input: 1,
    condition: s => s.level == 2,
    update: () => ({ level: 1, row: 1 }),
    action: s => {
      play(s.row, s.col);
    }
  }
];

import Reef from "./reef.js";

Reef.debug(true);

/** tag html template strings so prettier will format them and vim will highlight them
 * @returns string
 * @param {TemplateStringsArray} strings
 * @param {any[]} values
 */
function html(strings, ...values) {
  let str = "";
  strings.forEach((s, i) => {
    str += s + (i < values.length ? values[i] : "");
  });
  return str;
}

/** @typedef {typeof state} Props */

const app = new Reef("#app", {
  data: state,
  /** @param {Props} props */
  template: props => {
    // display the state
    let h = "";
    for (const name in props) {
      h += html`
        <li>
          ${name}: ${props[name]}
        </li>
      `;
    }
    h = html`
      <ul>
        ${h}
      </ul>
    `;
    // draw the grid
    let rows = "";
    for (let r = 1; r <= props.nrows; r++) {
      let columns = "";
      for (let c = 1; c <= props.ncols; c++) {
        let cls = highlight(r, c, props);
        columns += html`
          <td class="${cls}">${r},${c}</td>
        `;
      }
      rows += html`
        <tr>
          ${columns}
        </tr>
      `;
    }
    return html`
      ${h}
      <hr />
      <table border="1">
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }
});

window.addEventListener("load", () => app.render());

document.addEventListener("keydown", e => {
  console.log("kd", e);
  const data = app.getData();
  let input = null;
  if (["ArrowRight", "Space", "Tab"].includes(e.code)) {
    e.preventDefault();
    input = 0;
  } else if (["Enter", "ArrowLeft"].includes(e.code)) {
    input = 1;
  }
  if (input !== null) {
    for (const rule of rules) {
      if (rule.input == input && rule.condition(data)) {
        const update = rule.update(data);
        rule.action && rule.action(data);
        app.setData(update);
        console.log("update", update);
        break;
      }
    }
  }
});

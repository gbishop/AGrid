function play(r, c) {
  console.log("play", r, c);
  const data = app.getData();
  app.setData({ _outputs: [...data._outputs, `${r},${c}`] });
}

let state = {
  row: 0,
  col: 0,
  level: 1,
  reps: 0,
  nrows: 3,
  ncols: 4,
  maxReps: 2,
  _ruleUsed: -1,
  _outputs: []
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
 * @property {number} input - the current input
 * @property {conditionCallback} condition - a guard based on the state
 * @property {updateCallback} update - returns update to the state
 * @property {actionCallback} [action] - optional action function
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

/** format function string
 * @param {function} f */
function func(f) {
  let r = f.toString();
  r = r.replace(/^.*=>/, "");
  r = r.replace(/s\./g, "");
  r = r.replace(/\(\{|\}\)|\{|\}/g, "");
  return r;
}

/** @typedef {typeof state} Props */

const app = new Reef("#app", {
  data: state,
  /** @param {Props} props */
  template: props => {
    // display the state
    let hstate = "";
    for (const name in props) {
      if (!name.startsWith("_")) {
        hstate += html`
          <li>
            ${name}: ${props[name]}
          </li>
        `;
      }
    }
    hstate = html`
      <ul>
        ${hstate}
      </ul>
    `;

    // draw the grid
    let hgrid = "";
    for (let r = 1; r <= props.nrows; r++) {
      let columns = "";
      for (let c = 1; c <= props.ncols; c++) {
        let cls = highlight(r, c, props);
        columns += html`
          <td class="${cls}">${r},${c}</td>
        `;
      }
      hgrid += html`
        <tr>
          ${columns}
        </tr>
      `;
    }
    hgrid = html`
      <table border="1" class="grid">
        <tbody>
          ${hgrid}
        </tbody>
      </table>
    `;

    // display the rules
    let hrules = "";
    rules.forEach((rule, i) => {
      let cls = "";
      if (i == props._ruleUsed) {
        cls = 'class="used"';
      }
      hrules += html`
        <tr ${cls}>
          <td>${rule.input}</td>
          <td>${func(rule.condition)}</td>
          <td>${func(rule.update)}</td>
          <td>${(rule.action && func(rule.action)) || ""}</td>
        </tr>
      `;
    });
    hrules = html`
      <table border="1" class="rules">
        <thead>
          <tr>
            <th>Input</th>
            <th>Condition</th>
            <th>Update</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${hrules}
        </tbody>
      </table>
    `;
    let houtput = "";
    for (const output of props._outputs) {
      houtput += html`
        <li>${output}</li>
      `;
    }
    houtput = html`
      <ul>
        ${houtput}
      </ul>
    `;
    let result = html`
      <div style="display: flex">
        <div>
          <h2>State</h2>
          ${hstate}
        </div>
        <div>
          <h2>Grid</h2>
          ${hgrid}
        </div>
        <div>
          <h2>Output</h2>
          ${houtput}
        </div>
      </div>
      <h1>Rules</h1>
      ${hrules}
    `;
    return result;
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
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (rule.input == input && rule.condition(data)) {
        const update = rule.update(data);
        rule.action && rule.action(data);
        update._ruleUsed = i;
        app.setData(update);
        break;
      }
    }
  }
});

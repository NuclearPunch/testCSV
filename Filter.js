function _optionalChain(ops) {
  let lastAccessLHS = undefined;
  let value = ops[0];
  let i = 1;
  while (i < ops.length) {
    const op = ops[i];
    const fn = ops[i + 1];
    i += 2;
    if ((op === "optionalAccess" || op === "optionalCall") && value == null) {
      return undefined;
    }
    if (op === "access" || op === "optionalAccess") {
      lastAccessLHS = value;
      value = fn(value);
    } else if (op === "call" || op === "optionalCall") {
      value = fn((...args) => value.call(lastAccessLHS, ...args));
      lastAccessLHS = undefined;
    }
  }
  return value;
}
class Filter {
  init(params) {
    this.params = params;
    this.filterText = null;
    this.setupGui(params);
  }

  // not called by AG Grid, just for us to help setup
  setupGui(params) {
    this.gui = document.createElement("div");
    this.gui.innerHTML = `
            <div style="padding: 4px; width: 200px;">
                <div>
                 <input id="sort-asc"style="display: inline-block"type="checkbox">오름차순</input>
                </div>
                <div>
                 <input id="sort-desc" style="display: inline-block"type="checkbox">내림차순</input>
                </div>
                <div>
                  <input id="change-col-name" style="display: inline-block" type="checkbox">컬럼 이름 바꾸기</input>
                </div>
                <div>
                  <input id="change-col-val" style="display: inline-block" type="checkbox">컬럼 값 바꾸기</input>
               </div>
                <div>
                  <input id="del-col" style="display: inline-block" type="checkbox">컬럼 지우기</input>
              </div>  
              <div>
                 <input id="split-col" style="display: inline-block" type="checkbox">컬럼 구분자로 나누기</input>
              </div>
                <div>
                 <input id="del-col-dup" style="display: inline-block" type="checkbox">컬럼 중복 제거</input>
              </div>
               <div>
                <input id="filter-cond" style="display: inline-block" type="checkbox">조건으로 필터</input>
              </div>
               <div>
                <input id="filter-val" style="display: inline-block" type="checkbox">값으로 필터</input>
              </div>
            </div>
        `;

    // filter func
    const sort = (event, sort) => {
      gridOptions.columnApi.applyColumnState({
        state: [
          {
            colId: params.colDef.field,
            sort: event.target.checked ? sort : null,
          },
        ],
      });
      params.filterChangedCallback();
    };
    const changeColName = (event) => {
      const col = gridOptions.columnApi.getColumn(params.colDef.field);
      col.colDef.headerName = ""; // todo
    };
    const changeColVal = (event) => {
      const value = ""; //todo
    };
    const delCol = () => {
      gridOptions.columnApi.applyColumnState({
        state: [
          {
            colId: params.colDef.field,
            hide: true,
          },
        ],
      });
      // event.target.checked = false;
    };
    function removeDup(rowData) {
      const newRowData = new Map();
      for (let row of rowData) {
        newRowData.set(JSON.stringify(row[params.colDef.field]), row);
      }
      return newRowData.values();
    }
    const splitCol = () => {};
    const delColDup = () => {
      const rowData = [];
      gridOptions.api.forEachNode((node) => rowData.push(node.data));
      gridOptions.api.setRowData([...removeDup(rowData)]);
    };
    const filterCond = () => {};
    const filterVal = () => {};

    // filter elements
    this.ascBtn = this.gui.querySelector("#sort-asc");
    this.descBtn = this.gui.querySelector("#sort-desc");
    this.changeColBtn = this.gui.querySelector("#change-col-name");
    this.changeColValBtn = this.gui.querySelector("#change-col-val");
    this.delColBtn = this.gui.querySelector("#del-col");
    this.splitColBtn = this.gui.querySelector("#split-col");
    this.delColDupBtn = this.gui.querySelector("#del-col-dup");

    // handlers
    this.ascBtn.addEventListener("change", (e) => sort(e, "asc"));
    this.descBtn.addEventListener("change", (e) => sort(e, "desc"));
    //
    //
    this.delColBtn.addEventListener("change", delCol);
    //
    this.delColDupBtn.addEventListener("change", delColDup);
    //
    //
  }

  getGui() {
    return this.gui;
  }

  doesFilterPass(params) {
    const { api, colDef, column, columnApi, context } = this.params;
    console.log({ api, colDef, column, columnApi, context });
    const { node } = params;

    // make sure each word passes separately, ie search for firstname, lastname
    let passed = true;
    _optionalChain([
      this,
      "access",
      (_) => _.filterText,
      "optionalAccess",
      (_2) => _2.toLowerCase,
      "call",
      (_3) => _3(),
      "access",
      (_4) => _4.split,
      "call",
      (_5) => _5(" "),
      "access",
      (_6) => _6.forEach,
      "call",
      (_7) =>
        _7((filterWord) => {
          const value = this.params.valueGetter({
            api,
            colDef,
            column,
            columnApi,
            context,
            data: node.data,
            getValue: (field) => node.data[field],
            node,
          });

          if (value.toString().toLowerCase().indexOf(filterWord) < 0) {
            passed = false;
          }
        }),
    ]);

    return passed;
  }

  isFilterActive() {
    return this.filterText != null && this.filterText !== "";
  }

  getModel() {
    if (!this.isFilterActive()) {
      return null;
    }

    return { value: this.filterText };
  }

  setModel(model) {}
}

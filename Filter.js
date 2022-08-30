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
      //todo 원본을 sort 해야함 !
      params.filterChangedCallback();
    };
    const modalOpen = (callback, innerHTML) => {
      const modal = document.getElementById("modal");
      modal.style.display = "block";
      modal.innerHTML = innerHTML;
      document.getElementById("ok").onclick = callback;
    };
    const changeColName = () => {
      const modal = document.getElementById("modal");
      const col = gridOptions.columnApi.getColumn(params.colDef.field);
      const colName = document.getElementById("col-name");
      const rowData = getRowData();

      col.colDef.field = colName.value;
      gridOptions.api.refreshHeader();

      gridOptions.api.setRowData([
        ...rowData.map((item) => {
          return {
            ...item,
            [colName.value]: item[params.colDef.field],
            stroke: params.colDef.field,
          };
        }),
      ]);
      gridOptions.api.setSideBar(gridOptions.api.getSideBar());
      modal.style.display = "none";
    };
    const changeColVal = () => {
      const modal = document.getElementById("modal");
      const oldVal = document.getElementById("old-val").value;
      const newVal = document.getElementById("new-val").value;
      const rowData = getRowData();

      const result = rowData.map((row) =>
        row[params.colDef.field] === oldVal
          ? {
              ...row,
              [params.colDef.field]: newVal,
            }
          : { ...row }
      );
      gridOptions.api.setRowData([...result]);
      modal.style.display = "none";
    };
    const delCol = (event) => {
      gridOptions.columnApi.applyColumnState({
        state: [
          {
            colId: params.colDef.field,
            hide: true,
          },
        ],
      });
      event.target.checked = false;
    };
    const splitCol = () => {
      const field = params.colDef.field;
      const rowData = getRowData();
      let maxDataLength = 0;

      // todo 기존 컬럼 제거
      const newRowData = rowData.map((row) => {
        const spliter = ["_", ",", "-", "/", "^", "&", ".", ":"];
        const splitValues = splitVal([row[field]], spliter);
        maxDataLength =
          maxDataLength < splitValues.length
            ? splitValues.length
            : maxDataLength;
        return {
          ...row,
          ...splitValues.reduce((acc, val, idx) => {
            acc[`${field}_${idx}`] = val;
            return acc;
          }, {}),
        };
      });
      gridOptions.api.setColumnDefs([
        ...gridOptions.api.getColumnDefs(),
        ...[...new Array(maxDataLength)].map((_, idx) => ({
          field: `${field}_${idx}`,
        })),
      ]);
      gridOptions.api.setRowData([...newRowData]);
    };

    function splitVal(value, splitUnits) {
      const arr = value.map((item) => item.split(splitUnits[0])).flat();
      splitUnits.shift();
      if (splitUnits.length === 0) {
        return arr;
      }
      return splitVal(arr, splitUnits);
    }
    const delColDup = () => {
      const rowData = getRowData();
      gridOptions.api.setRowData([...removeDup(rowData)]);
    };
    const filterCond = () => {};
    const filterVal = () => {};

    // utils
    function removeDup(rowData) {
      const newRowData = new Map();
      for (let row of rowData) {
        newRowData.set(JSON.stringify(row[params.colDef.field]), row);
      }
      return newRowData.values();
    }
    function getRowData() {
      const rowData = [];
      gridOptions.api.forEachNode((node) => rowData.push(node.data));
      return rowData;
    }
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
    this.changeColBtn.addEventListener("change", (e) =>
      modalOpen(
        changeColName,
        `<div>
          <div id="col-val-box">
            <input id="col-name" />
          </div>
          <div style="position: absolute; bottom: 0; right: 0; padding: 4px;">
            <button id="ok" onclick="cll()">확인</button>
            <button onclick="modal.style.display = 'none'">취소</button>
          </div>
        </div>`
      )
    );
    this.changeColValBtn.addEventListener("change", () =>
      modalOpen(
        changeColVal,
        `<div>
          <div id="col-val-box">
            <label>찾기</label>
            <input id="old-val" />
            <label>바꾸기</label>
            <input id="new-val" />
          </div>
          <div style="position: absolute; bottom: 0; right: 0; padding: 4px;">
            <button id="ok" onclick="cll()">확인</button>
            <button onclick="modal.style.display = 'none'">취소</button>
          </div>
        </div>`
      )
    );
    //
    this.delColBtn.addEventListener("change", delCol);
    this.splitColBtn.addEventListener("change", splitCol);
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

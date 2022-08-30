const { ipcRenderer } = require("electron");

const getEle = (id) => document.getElementById(id);
const savedData = {};
let order = 0;
let selectedRows = [];
let eventHandler = [];

ipcRenderer.on("open-dialog-paths-selected", (evt, args) => {
  const { columns, data } = args || {};

  gridOptions.api.setRowData([...data]);
  gridOptions.api.setColumnDefs([...getColDefs(columns)]);
  gridOptions.api.addEventListener("virtualColumnsChanged", handleShiftClick);

  const headers = document.querySelectorAll(".ag-header-cell");

  headers.forEach((header) => {
    header.addEventListener("click", handleClick);
  });
});

ipcRenderer.on("on-handle-duplicate", (evt, rowData) => {
  gridOptions.api.setRowData([...rowData]);
});

ipcRenderer.on("on-handle-save", (evt, name) => {
  const rowData = [];
  const box = getEle("info");
  const child = getEle("div");

  gridOptions.api.forEachNode((node) => rowData.push(node.data));
  Object.assign(savedData, { [name]: rowData });
  Object.keys(savedData).forEach((key) => {
    const div = getEle("div");
    const textNode = document.createTextNode(key);
    div.appendChild(textNode);
    div.onclick = function () {
      gridOptions.api.setRowData([...savedData[key]]);
    };
    child.appendChild(div);
  });
  box.replaceChildren(child);
});

ipcRenderer.on("on-handle-search", (evt, flag) => {
  const searchText = getEle("search").value;
  findString(searchText, flag);
});

ipcRenderer.on("on-handle-change-val", (evt, rowData) => {
  gridOptions.api.setRowData(rowData);
});
ipcRenderer.on("on-handle-calc", (evt, args) => {
  const [rowData, colName] = args;
  const columns = gridOptions.api.getColumnDefs();
  gridOptions.api.setRowData([...rowData]);
  gridOptions.api.setColumnDefs([...columns, { field: colName }]);
});
ipcRenderer.on("on-handle-merge", (evt, args) => {
  const [newRowData, newColNames] = args;
  const columns = gridOptions.api.getColumnDefs();
  gridOptions.api.setRowData([...newRowData]);
  gridOptions.api.setColumnDefs([...columns, ...getColDefs([newColNames])]);
});

// util func

// search
const getCell = (text) => {
  const elements = [...document.querySelectorAll(".ag-cell")] || [];
  const ele = elements.filter((ele) => ele.innerText.includes(text) && text);
  return { elements, ele };
};
function findString(searchText, flag) {
  order += flag;
  paint(searchText, order);
}
const paint = (search, order) => {
  const { elements, ele } = getCell(search);
  elements.forEach((e) => (e.style.background = "white"));
  if (ele.length !== 0) {
    ele[order].style.background = "red";
    ele[order].scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
};

const handleShiftClick = () => {
  const headers = document.querySelectorAll(".ag-header-cell");
  headers.forEach((header) => {
    header.addEventListener("click", handleClick);
  });
};

const getColDefs = (columns) =>
  columns.map((row) => ({
    field: row,
    filter: "agMultiColumnFilter",
    enableRowGroup: true,
    enablePivot: true,
    pivot: true,
    defaultAggFunc: "sum",
    enableValue: true,
    filterParams: {
      filters: [
        {
          filter: Filter,
          // display: "subMenu",
          title: "기타 필터",
          display: "accordion",
          filterParams: {
            buttons: ["reset", "apply"],
            debounceMs: 200,
          },
        },
        {
          filter: "agTextColumnFilter",
          display: "accordion",
          title: "조건 필터",
          filterParams: {
            filterOptions: ["contains", "blank", "notBlank"],
            suppressAndOrCondition: true,
            // buttons: ["reset", "apply"],
            debounceMs: 200,
          },
        },
        {
          filter: "agNumberColumnFilter",
          display: "accordion",
          title: "값 필터",
          filterParams: {
            // filterOptions: ["contains", "blank", "notBlank"],
            suppressAndOrCondition: true,
            // buttons: ["reset", "apply"],
            debounceMs: 200,
          },
        },
        {
          filter: "agDateColumnFilter",
          display: "accordion",
          title: "기간 필터",
          filterParams: {
            suppressAndOrCondition: true,
            comparator: (filterLocalDateAtMidnight, cellValue) => {
              const dateAsString = cellValue.split(" ")[0];
              if (dateAsString == null) return -1;
              const dateParts = dateAsString.split(".");
              const cellDate = new Date(
                Number(dateParts[0]),
                Number(dateParts[1]) - 1,
                Number(dateParts[2])
              );

              if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                return 0;
              }

              if (cellDate < filterLocalDateAtMidnight) {
                return -1;
              }

              if (cellDate > filterLocalDateAtMidnight) {
                return 1;
              }
            },
          },
        },
        {
          filter: "agSetColumnFilter",
          display: "accordion",
          title: "값으로 필터",
        },
      ],
    },
  }));

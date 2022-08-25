const { ipcRenderer } = require("electron");

const savedData = {};
let order = 0;

ipcRenderer.on("open-dialog-paths-selected", (evt, args) => {
  const { columns, data } = args || {};
  gridOptions.api.setRowData([...data]);
  gridOptions.api.setColumnDefs([...columns]);
});

ipcRenderer.on("on-handle-duplicate", (evt, rowData) => {
  gridOptions.api.setRowData([...rowData]);
});

ipcRenderer.on("on-handle-save", (evt, name) => {
  const rowData = [];
  const box = document.getElementById("info");
  const child = document.createElement("div");

  gridOptions.api.forEachNode((node) => rowData.push(node.data));
  Object.assign(savedData, { [name]: rowData });
  Object.keys(savedData).forEach((key) => {
    const div = document.createElement("div");
    const textNode = document.createTextNode(key);
    div.appendChild(textNode);
    div.onclick = function () {
      gridOptions.api.setRowData([...savedData[key]]);
    };
    child.appendChild(div);
  });
  box.replaceChildren(child);
});

// util func
ipcRenderer.on("on-handle-search", (evt, flag) => {
  const searchText = document.getElementById("search").value;
  findString(searchText, flag);
});

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

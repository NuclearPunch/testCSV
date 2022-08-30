window.onload = () => {
  const uploadBtn = getEle("upload-btn");
  const dupBtn = getEle("dup-btn");
  const saveBtn = getEle("save-btn");
  const searchBtn = getEle("search-btn");
  const changeValueBtn = getEle("change-val-btn");
  const oldInput = getEle("change-old");
  const newInput = getEle("change-new");
  const calcBtn = getEle("calc-btn");
  const calcSelect = getEle("calc-select");
  const calc1 = getEle("calc-1");
  const calc2 = getEle("calc-2");
  const calc3 = getEle("calc-3");
  const cancelCalBtn = getEle("cancel-cal-btn");
  const mergeBtn = getEle("merge-btn");

  uploadBtn.addEventListener("click", (evt) => {
    ipcRenderer.send("show-open-dialog");
  });
  dupBtn.addEventListener("click", (evt) => {
    const rowData = [];
    gridOptions.api.forEachNode((node) => rowData.push(node.data));
    ipcRenderer.send("handle-duplicate", [...rowData]);
  });
  saveBtn.addEventListener("click", (evt) => {
    const name = document.getElementById("save").value;
    ipcRenderer.send("handle-save", name);
  });
  searchBtn.addEventListener("click", (evt) => {
    const searchDetails = getEle("search-details");
    const cancelBtn = getEle("search-cancel-btn");
    const searchBtn = getEle("search-btn");
    const searchInput = getEle("search");
    const searchAdd = getEle("search-btn-add");
    const searchMin = getEle("search-btn-min");

    cancelBtn.style.display = "inline-block";
    searchBtn.style.display = "none";
    searchDetails.style.display = "inline-block";
    searchInput.style.display = "inline-block";
    searchAdd.style.display = "inline-block";
    searchMin.style.display = "inline-block";
    cancelBtn.onclick = () => {
      searchBtn.style.display = "inline-block";
      cancelBtn.style.display = "none";
      searchInput.style.display = "none";
      searchAdd.style.display = "none";
      searchMin.style.display = "none";
    };
    searchInput.oninput = (e) => ipcRenderer.send("handle-search", 0);
    searchAdd.onclick = () => ipcRenderer.send("handle-search", -1);
    searchMin.onclick = () => ipcRenderer.send("handle-search", 1);
  });
  changeValueBtn.addEventListener("click", () => {
    const rowData = [];
    gridOptions.api.forEachNode((node) => rowData.push(node.data));
    ipcRenderer.send("handle-change-val", [
      rowData,
      gridOptions.api.getColumnDefs(),
      oldInput.value,
      newInput.value,
    ]);
  });
  calcBtn.addEventListener("click", () => {
    const rowData = [];
    gridOptions.api.forEachNode((node) => rowData.push(node.data));
    ipcRenderer.send("handle-calc", [
      calc1.value,
      calc2.value,
      calc3.value,
      calcSelect.value,
      rowData,
    ]);
  });
  cancelCalBtn.addEventListener("click", () => {
    const headers = document.querySelectorAll(".ag-header-cell");
    headers.forEach((header) => {
      header.style.backgroundColor = "white";
    });
    selectedRows.length = 0;
    cancelCalBtn.style.display = "none";
    calc1.value = "";
    calc2.value = "";
  });
  mergeBtn.addEventListener("click", () => {
    const rowData = [];
    gridOptions.api.forEachNode((node) => rowData.push(node.data));
    ipcRenderer.send("handle-merge", [rowData, selectedRows]);
  });
};

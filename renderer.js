window.onload = () => {
  const uploadBtn = document.getElementById("upload-btn");
  const dupBtn = document.getElementById("dup-btn");
  const saveBtn = document.getElementById("save-btn");
  const searchBtn = document.getElementById("search-btn");

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
    const searchDetails = document.getElementById("search-details");
    const cancelBtn = document.getElementById("search-cancel-btn");
    const searchBtn = document.getElementById("search-btn");
    const searchInput = document.getElementById("search");
    const searchAdd = document.getElementById("search-btn-add");
    const searchMin = document.getElementById("search-btn-min");

    cancelBtn.style.display = "inline-block";
    searchBtn.style.display = "none";
    searchDetails.style.display = "inline-block";
    searchInput.style.display = "inline-block";
    cancelBtn.onclick = () => {
      searchBtn.style.display = "inline-block";
      cancelBtn.style.display = "none";
      searchInput.style.display = "none";
    };
    searchInput.oninput = (e) => ipcRenderer.send("handle-search", 0);
    searchAdd.onclick = () => ipcRenderer.send("handle-search", -1);
    searchMin.onclick = () => ipcRenderer.send("handle-search", 1);
  });
};

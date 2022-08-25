const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs"); // Load the File System to execute our common tasks (CRUD)
const Papa = require("papaparse");

let data;
const data2 = [];

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1281,
    height: 800,
    minWidth: 1281,
    minHeight: 800,
    backgroundColor: "#312450",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("index.html");
  mainWindow.webContents.openDevTools();
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Open File",
          click() {
            // openFile();
            openFileWithDanfo();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);

  Menu.setApplicationMenu(menu);
  // 웹 페이지 로드 완료
  mainWindow.webContents.on("did-finish-load", (evt) => {
    // onWebcontentsValue 이벤트 송신
    mainWindow.webContents.send("onWebcontentsValue", "on load...");
  });

  function openFile() {
    const files = dialog
      .showOpenDialog(mainWindow, {
        properties: ["openFile"],
      })
      .then((result) => {
        console.time("csv read");
        const file = result.filePaths[0];

        fs.createReadStream(file)
          .pipe(csv.parse({ headers: true }))
          .on("error", (error) => console.error(error))
          .on("data", (row) => data2.push(row))
          .on("end", () => {
            let end = performance.now();

            console.timeEnd("csv read");
          });
      })
      .catch((err) => {
        console.log(err);
      });
  }
  function openFileWithDanfo() {
    const files = dialog
      .showOpenDialog(mainWindow, {
        properties: ["openFile"],
      })
      .then((result) => {
        console.time("csv read");
        const file = result.filePaths[0];

        dfd
          .readCSV(file) //assumes file is in CWD
          .then((df) => {
            data = df;
            console.timeEnd("csv read");
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((err) => {
        console.log(err);
      });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  ipcMain.on("show-open-dialog", (event, arg) => {
    dialog
      .showOpenDialog(null, {
        properties: ["openFile"],
      })
      .then((result) => {
        const file = result.filePaths[0];
        const csvFile = fs.readFileSync(file);
        const csvData = csvFile.toString();
        console.time("csv read");
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: false,
          complete: (results) => {
            const result = convert(results.data);
            event.sender.send("open-dialog-paths-selected", result);
          },
        });

        // dfd
        //   .readCSV(file) //assumes file is in CWD
        //   .then((df) => {
        //     data = df;
        //     console.timeEnd("csv read");
        //     event.sender.send("open-dialog-paths-selected", data);
        //   })
        //   .catch((err) => {
        //     console.log(err);
        //   });
      })
      .catch((err) => {
        console.log(err);
      });
  });

  ipcMain.on("handle-duplicate", (event, rowData) => {
    const rowDataNoDup = removeDup(rowData).values();
    event.sender.send("on-handle-duplicate", [...rowDataNoDup]);
  });
  ipcMain.on("handle-save", (event, name) => {
    event.sender.send("on-handle-save", name);
  });
  ipcMain.on("handle-search", (event, flag) => {
    event.sender.send("on-handle-search", flag);
  });
  // onInputValue 이벤트 수신
  ipcMain.on("onInputValue", (evt, payload) => {
    console.log("on ipcMain event:: ", payload);

    const computedPayload = payload + "(computed)";

    // replyInputValue 송신 또는 응답
    evt.reply("replyInputValue", data || data2);
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

function removeDup(rowData) {
  const newRowData = new Map();
  for (let row of rowData) {
    newRowData.set(JSON.stringify(row), row);
  }
  return newRowData;
}

const convert = (results) => {
  const rowsArray = Object.keys(results[0]);
  return {
    columns: rowsArray.map((row) => ({ field: row, sortable: true })),
    data: results,
  };
};

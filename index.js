try {
    require('electron-reloader')(module);
} catch (err) {}

require("./dist/main.js");
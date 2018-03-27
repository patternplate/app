try {
  require('electron-reloader')(module);
} catch (err) {
  console.error(err);
}

require("./dist/main.js");

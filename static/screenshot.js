#!/usr/bin/env node
const screenshot = require("electron-screenshot-service");
const express = require("express");
const getPort = require("get-port");
const sander = require("@marionebl/sander");

async function main(input) {
  const path = input[0];
  const output = input[1];

  const port = await getPort();

  const app = express();
  app.use(express.static(path));

  await listen(app, port);

  const image = await screenshot({
    url: `http://localhost:${port}`,
    width: 1024,
    height: 768
  });

  await sander.writeFile(output, image.data);
  process.exit(0);
}

function listen(app, port) {
  return new Promise((resolve) => app.listen(port, resolve));
}

main(process.argv.slice(2))
  .catch(err => {
    throw err;
  })

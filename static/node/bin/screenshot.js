#!/usr/bin/env node
const express = require("express");
const getPort = require("get-port");
const sander = require("@marionebl/sander");
const puppeteer = require("puppeteer");

async function main(input) {
  const path = input[0];
  const output = input[1];

  const port = await getPort();

  const app = express();
  app.use(express.static(path));

  await listen(app, port);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`http://localhost:${port}?navigation-enabled=false`);
  await page.setViewport({ width: 1440, height: 800 });

  const image = await page.screenshot({
    type: "png"
  });

  await sander.writeFile(output, image);
  process.exit(0);
}

function listen(app, port) {
  return new Promise((resolve) => app.listen(port, resolve));
}

main(process.argv.slice(2))
  .catch(err => {
    throw err;
  })

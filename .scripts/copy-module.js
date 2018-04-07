#!/usr/bin/env node
const Path = require("path");
const Fs = require("fs");
const Util = require("util");
const parser = require("yargs-parser");
const resolveFrom = require("resolve-from");
const findNodeModules = require("find-node-modules");
const whichNodeback = require("which");
const readPkgUp = require("read-pkg-up");
const sander = require("@marionebl/sander");
const pncp = Util.promisify(require("ncp").ncp);

const realpath = Util.promisify(Fs.realpath);

async function main(cli) {
  const bins = ensureArray(cli.bin).map(b => ({type: "bin", bin: b}));
  const mods = ensureArray(cli.mod).map(m => ({type: "module", id: m}));
  const ignore = ensureArray(cli.ignore);

  const out = cli.out;

  if (typeof out !== "string") {
    console.error("--out is required");
    process.exit(1);
  }

  const subjects = [...bins, ...mods];

  const cwd = cli.cwd || process.cwd();
  const modulePaths = findNodeModules({ cwd, relative: false });
  const PATH = modulePaths.map(p => Path.join(p, ".bin")).join(":");

  const tasks = [];

  await Promise.all(subjects.map(async subject => {
    await analyse(subject, {PATH, ignore, cwd});
    await schedule(subject, {PATH, ignore, cwd}, tasks);
  }));

  await Promise.all(tasks.map(async task => {
    const rootPath = modulePaths.find(m => task.pkgPath.startsWith(m));
    const outPath = Path.join(out, Path.relative(rootPath, task.pkgPath));
    await sander.mkdir(outPath);

    await pncp(task.pkgPath, outPath, {
      filter(filename) {
        return Path.relative(task.pkgPath, filename).indexOf("node_modules") === -1;
      }
    });

    if (task.type === "bin") {
      const internalPath = Path.relative(task.pkgPath, task.binTarget);
      const endTarget = Path.join(out, task.pkg.name.split("/").join(Path.sep), internalPath);
      const symlinkPath = Path.join(out, ".bin", task.bin);
      await sander.rimraf(symlinkPath);
      await sander.mkdir(Path.dirname(symlinkPath));
      Fs.symlinkSync(Path.relative(Path.dirname(symlinkPath), endTarget), symlinkPath);
    }
  }));
}

function ensureArray(input) {
  if (typeof input === "undefined") {
    return [];
  }
  return Array.isArray(input) ? input : [input];
}

async function analyse(subject, context) {
  if (subject.type === "bin") {
    const binPath = await which(subject.bin, {path: context.PATH});
    const binTarget = await realpath(binPath);
    const pkg = await readPkgUp({ cwd: Path.dirname(binTarget) });
    subject.binPath = binPath;
    subject.binTarget = binTarget;
    subject.pkg = pkg.pkg;
  }

  const id = subject.id || subject.pkg.name;
  const pkgPath = await resolveFrom(context.cwd, `${id}/package.json`);

  subject.pkg = subject.pkg ? subject.pkg : require(pkgPath);
  subject.id = subject.pkg.name;
  subject.pkgPath = Path.dirname(pkgPath);

  return subject;
}

async function schedule(subject, context, tasks) {
  const {ignore} = context;
  tasks.push(subject);

  const ids = Object.keys(subject.pkg.dependencies || {});
  const cwd = subject.pkgPath;
  const PATH = findNodeModules({ cwd, relative: false });

  return Promise.all(ids.map(async id => {
    if (ignore.includes(id)) {
      return;
    }

    const dep = await analyse({type: "module", id}, {cwd, ignore, PATH});

    // Skip packages that already have been visited
    if (tasks.some(t => t.pkgPath === dep.pkgPath)) {
      return;
    }

    await schedule(dep, {cwd, ignore, PATH}, tasks);
  }));
}

function which(name, opts) {
  return new Promise((resolve, reject) => {
    whichNodeback(name, opts, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });
}

function help() {
console.error(`
copy-module [bin]

Options
  --cwd   Directory to resolve modules from
`);
}

main(parser(process.argv.slice(2)))
  .catch(err => {
    console.error(err);
    throw err;
  });

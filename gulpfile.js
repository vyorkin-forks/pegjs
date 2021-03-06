"use strict";

/* eslint-env node */

let babelify = require("babelify");
let browserify = require("browserify");
let buffer = require("vinyl-buffer");
let del = require("del");
let eslint = require("gulp-eslint");
let gulp = require("gulp");
let header = require("gulp-header");
let jasmine = require("gulp-jasmine");
let package_ = require("./package");
let peg = require("./lib/peg");
let rename = require("gulp-rename");
let source = require("vinyl-source-stream");
let spawn = require("child_process").spawn;
let transform = require("gulp-transform");
let uglify = require("gulp-uglify");

const HEADER = [
  "// PEG.js " + package_.version,
  "//",
  "// http://pegjs.org/",
  "//",
  "// Copyright (c) 2010-2016 David Majda",
  "// Licensed under the MIT License.",
  ""
].map(line => `${line}\n`).join("");

const JS_FILES = [
  "lib/**/*.js",
  "!lib/parser.js",
  "spec/**/*.js",
  "spec/server",
  "!spec/vendor/**/*",
  "benchmark/**/*.js",
  "benchmark/run",
  "benchmark/server",
  "!benchmark/vendor/**/*",
  "bin/pegjs",
  "gulpfile.js"
];

const SPEC_FILES = [
  "spec/**/*.js",
  "!spec/vendor/**/*"
];

function generate(contents) {
  return peg.generate(contents.toString(), {
    output: "source",
    format: "commonjs"
  });
}

// Run ESLint on all JavaScript files.
gulp.task("lint", () =>
  gulp.src(JS_FILES)
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
);

// Run specs.
gulp.task("spec", () =>
  gulp.src(SPEC_FILES)
    .pipe(jasmine())
);

// Run benchmarks.
gulp.task("benchmark", () =>
  spawn("benchmark/run", { stdio: "inherit" })
);

// Create the browser build.
gulp.task("browser:build", () =>
  browserify("lib/peg.js", { standalone: "peg" })
    .transform(babelify, { presets: "es2015", compact: false })
    .bundle()
    .pipe(source("peg.js"))
    .pipe(header(HEADER))
    .pipe(gulp.dest("browser"))
    .pipe(rename({ suffix: ".min" }))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(header(HEADER))
    .pipe(gulp.dest("browser"))
);

// Delete the browser build.
gulp.task("browser:clean", () =>
  del("browser")
);

// Generate the grammar parser.
gulp.task("parser", () =>
  gulp.src("src/parser.pegjs")
    .pipe(transform(generate))
    .pipe(rename({ extname: ".js" }))
    .pipe(gulp.dest("lib"))
);

// Default task.
gulp.task("default", ["lint", "spec"]);

const del = require("del")
const gulp = require("gulp")
const gutil = require("gulp-util")

const cssGlob= "./src/**/*.css"

exports.css = () => 
    gulp.src(cssGlob)
        .pipe(gulp.dest("./lib"))

exports.watchCss = () => gulp.watch(cssGlob, ["css"])

exports.clean = () =>
    del(["./lib"], { force: true})
        .then(paths => gutil.log("Deleted files/folders\n", paths.join("\n")))
        .catch(e => gutil.log("Error cleaning lib\n", e))

exports.copyDeclarations = () =>
    gulp.src(["./src/**/*.d.ts"])
        .pipe(gulp.dest("./lib"))

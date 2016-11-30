var gulp = require('gulp');
var backstopjs = require('backstopjs');
var browserSync = require("browser-sync");
var server = browserSync.create("css-server");
var historyApiFallback = require('connect-history-api-fallback');
var del = require("del");

var config = {
    open: false,
    server: {
        baseDir: "./dist/",
        routes: {
            "/node_modules": "./node_modules",
            "/src": "./src"
        },
        // Necessary middleware for a single-page application with client-side routing
        middleware: [
            historyApiFallback({ index: "./app/index.html" })
        ]
    }
};

gulp.task('css:reference', ["build"], function() {
    server.init(config);

    backstopjs('reference')
        .then(function() {
            browserSync.get("css-server").exit();
        })
        .catch(function(err){
            browserSync.get("css-server").exit();
            process.exit(1);
        });
});

gulp.task('css:test', ["build"], function() {
    server.init(config);

    backstopjs('test')
        .then(function() {
            browserSync.get("css-server").exit();
        })
        .catch(function(err){
            browserSync.get("css-server").exit();
            process.exit(1);
        });
});

gulp.task('css:clean', [], function() {
    return del([
        "backstop_data/bitmaps_test/*"
    ]);
});
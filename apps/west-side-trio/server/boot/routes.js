module.exports = function(app) {
    var fs = require('fs');
    var audioFolder  = __dirname + '/../storage/audiofiles/';
    var videoFolder  = __dirname + '/../storage/videofiles/';
    var photosFolder = __dirname + '/../storage/photos/';
    var img2Folder = __dirname + '/../storage/img/';
    var imgFolder    = __dirname + '/../../client/slideshow/';
    // Install a "/ping" route that returns "pong"
    app.get('/assets', function(req, res) {
        fs.readdir(img2Folder, function(error, result) {
            // console.log(error);
            // console.log(result);
            res.json(result);
        });
    });
    app.get('/assets/:filename', function(req, res, next) {
        var filename = req.params.filename || '';
        if (filename === '') {
            return next('no_filename_provided');
        }
        var file = fs.readFileSync(img2Folder + filename, 'binary');

        if (file) {
            res.setHeader('Content-Length', file.length);
            res.write(file, 'binary');
            res.end();
        } else {
            return next('file_does_not_exist');
        }
    });

    app.get('/audiofiles', function(req, res) {
        fs.readdir(audioFolder, function(error, result) {
            // console.log(error);
            // console.log(result);
            res.json(result.filter(f => f.includes('.mp3')));
        });
    });
    app.get('/audiofiles/:filename', function(req, res, next) {
        var filename = req.params.filename || '';
        if (filename === '') {
            return next('no_filename_provided');
        }
        var file = fs.readFileSync(audioFolder + filename, 'binary');

        if (file) {
            res.setHeader('Content-Length', file.length);
            res.write(file, 'binary');
            res.end();
        } else {
            return next('file_does_not_exist');
        }
    });

    app.get('/photos', function(req, res) {
        fs.readdir(photosFolder, function(error, result) {
          res.json(result.sort((a, b) => +(a.split(' ')[0] ) - +(b.split(' ')[0])));
        });
    });

    app.get('/photos/:filename', function(req, res, next) {
        var filename = req.params.filename || '';
        if (filename === '') {
            return next('no_filename_provided');
        }
        var file = fs.readFileSync(photosFolder + filename, 'binary');

        if (file) {
            res.setHeader('Content-Length', file.length);
            res.write(file, 'binary');
            res.end();
        } else {
            return next('file_does_not_exist');
        }
    });

    app.get('/videofiles', function(req, res) {
        fs.readdir(videoFolder, function(error, result) {
            console.log(error);
            console.log(result);
            res.json(result);
        });
    });
    app.get('/videofiles/:filename', function(req, res, next) {
        var filename = req.params.filename || '';
        if (filename === '') {
            return next('no_filename_provided');
        }
        var file = fs.readFileSync(videoFolder + filename, 'binary');

        if (file) {
            res.setHeader('Content-Length', file.length);
            res.write(file, 'binary');
            res.end();
        } else {
            return next('file_does_not_exist');
        }
    });

    app.get('/img', function(req, res) {
        fs.readdir(imgFolder, function(error, result) {
            // console.log(result);
            res.json(result);
        });
    });
    app.get('/img/:filename', function(req, res, next) {
        var filename = req.params.filename || '';
        if (filename === '') {
            return next('no_filename_provided');
        }
        var file = fs.readFileSync(imgFolder + filename, 'binary');

        if (file) {
            res.setHeader('Content-Length', file.length);
            res.write(file, 'binary');
            res.end();
        } else {
            return next('file_does_not_exist');
        }

    });
}

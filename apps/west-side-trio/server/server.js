var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
var path = require('path');

app.use('/dist', loopback.static(__dirname + '/../client/dist'));
app.use('/css', loopback.static(__dirname + '/../client/css'));
app.use('/partials', loopback.static(__dirname + '/../client/partials'));

// app.all('/*', function(req, res, next) {
//     // Just send the index.html for other files to support HTML5Mode
//     res.sendfile('/../client/index.html', { root: __dirname });
// });

app.use(loopback.static(path.resolve(__dirname, '../client')));

boot(app, __dirname);

app.start = function() {
  // start the web server
  return app.listen(process.env.PORT, function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}

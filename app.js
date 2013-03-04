var express = require('express')
  , app = express()
  , path = require('path')
  , mongoose = require('mongoose')
  , routes = require('./routes')
  , packages = require('./routes/packages');

////////////////////////
// Mongo
////////////////////////

  var mongoUri = 'mongodb://localhost/greg-dev';

  mongoose.connect(mongoUri, function(err) {
    if (!err) {
        console.log('Connected to MongoDB');
      } else {
        throw err;
      }
  })

////////////////////////
// Config
////////////////////////

  app.configure(function () {
      app.set('views', __dirname + '/views')
      app.set('view engine', 'jade')
      app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
      app.use(app.router)
      app.use(express.bodyParser());
      app.use(express.static(path.join(__dirname, 'public')))
  });

////////////////////////
// Routing
////////////////////////

  app.get('/', routes.index);
  app.get('/pkg', packages.all );
  app.get('/pkg/:id', packages.byId );
  app.get('/pkg-download/:id', packages.download );
  app.post('/pkg', packages.add);
  app.put('/pkg/:id', packages.update);
  app.delete('/pkg/:id/:version', packages.remove);


////////////////////////
// Server
////////////////////////

  var port = process.env.PORT || 8000;
  app.listen(port);
  console.log('Starting server on port: ' + port);


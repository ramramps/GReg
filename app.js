var express = require('express')
  , app = express()
  , path = require('path')
  , mongoose = require('mongoose')
  , routes = require('./routes')
  , packages = require('./routes/packages')
  , passport = require('passport')
  , users = require('./lib/users')
  , auth = require('./lib/auth');

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

  app.configure(function() {
    app.use(express.logger());
    app.set('views', __dirname + '/views')
    app.set('view engine', 'jade')
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(passport.initialize());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
  });

////////////////////////
// Routing
////////////////////////

  app.get('/', routes.index);
  app.get('/pkg', packages.all );
  app.get('/pkg/:id', packages.byId );
  app.get('/pkg-dl/:id', packages.download );
  app.post('/pkg', passport.authenticate('basic', { session: false }), packages.add);
  app.put('/pkg', passport.authenticate('basic', { session: false }), packages.add_version);
  app.delete('/pkg/:id/:version', passport.authenticate('basic', { session: false }), packages.remove);

  app.get('/user/:name', users.byName );
  app.put('/user/:name', passport.authenticate('basic', { session: false }), users.update );

  // for testing purposes, note: no session support
  app.get('/login', passport.authenticate('basic', { session: false }),
  function(req, res){
   res.json({ username: req.user.username });
  });

////////////////////////
// Debug
////////////////////////

  users.initDebugUser();

////////////////////////
// Server
////////////////////////

  var port = process.env.PORT || 8000;
  app.listen(port);
  console.log('Starting server on port: ' + port);


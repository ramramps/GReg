var express = require('express')
  , app = express()
  , path = require('path')
  , mongoose = require('mongoose')
  , routes = require('./routes')
  , pkg = require('./routes/package')
  , passport = require('passport')
  , user = require('./routes/user')
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
  app.get('/pkgs', pkg.all );
  app.get('/pkg_id/:id', pkg.by_id );
  app.get('/pkg_engine/:engine', pkg.by_engine );
  app.get('/pkg_engine_name/:engine/:name', pkg.by_engine_and_name );
  // app.get('/pkg_group/:group/:name', pkg.byEngineAndPkgName );
  // app.get('/pkg_engine_query/:engine/:query', pkg.byEngineAndPkgName );
  // app.get('/pkg_search/', pkg.search ); // searches group, keyword, description, name
  app.get('/pkg_download/:id', pkg.download );

  app.post('/pkg', passport.authenticate('basic', { session: false }), pkg.add);
  app.put('/pkg', passport.authenticate('basic', { session: false }), pkg.add_version);

  app.delete('/pkg/:id/:version', passport.authenticate('basic', { session: false }), pkg.remove);

  app.get('/user_name/:name', user.by_name );
  app.get('/user_id/:id', user.by_id );
  // app.put('/user_name/:name', passport.authenticate('basic', { session: false }), users.update_name );
  // app.put('/user_name/:name', passport.authenticate('basic', { session: false }), users.update_name );


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

  var port = process.env.PORT || 80;
  app.listen(port);
  console.log('Starting server on port: ' + port);


var express = require('express')
  , app = express()
  , path = require('path')
  , mongoose = require('mongoose')
  , routes = require('./routes')
  , pkg = require('./routes/package')
  , passport = require('passport')
  , user = require('./routes/user')
  , users = require('./lib/users')
  , auth = require('./lib/auth')
  , search = require('./lib/search')
  , error = require('./lib/error');

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

// search.add( '1029ud23234li24', { keywords:['thing','peter'], name: 'poodle-town', group: 'poodles', engine: 'dynamo'}, function(err, data) {
//   if (err) {
//     console.log(err);
//     console.log('Things arent so great with adding');
//     return;
//   }
    
//   console.log(data);
//   console.log('Added new item to search');

// });

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

  app.get('/', function(res, req) { res.send('index.html'); } );

  app.get('/pkgs', pkg.all );
  app.get('/pkg_id/:id', pkg.by_id );
  app.get('/pkg_engine/:engine', pkg.by_engine );
  app.get('/pkg_engine_name/:engine/:name', pkg.by_engine_and_name );
  // app.get('/pkg_group/:group/:name', pkg.byEngineAndPkgName );
  // app.get('/pkg_engine_query/:engine/:query', pkg.byEngineAndPkgName );
  
  app.get('/pkg_download/:id', pkg.download );

  // package search
  app.get('/pkg_search/', pkg.all );
  app.get('/pkg_search/:query', pkg.search ); 

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

  var port = process.env.PORT || 8000;
  app.listen(port);
  console.log('Starting server on port: ' + port);


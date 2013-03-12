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
  app.get('/pkg/', pkg.all );
  app.get('/pkg/:id', pkg.by_id );
  app.get('/pkg_engine/:engine', pkg.by_engine );
  app.get('/pkg_engine_name/:engine/:name', pkg.by_engine_and_name );

  // package search
  app.get('/pkg_search/', pkg.all );
  app.get('/pkg_search/:query', pkg.search ); 

  app.post('/pkg', passport.authenticate('basic', { session: false }), pkg.add);
  app.put('/pkg', passport.authenticate('basic', { session: false }), pkg.add_version);

  app.delete('/pkg/:id', passport.authenticate('basic', { session: false }), pkg.remove);

  app.get('/user_name/:name', user.by_name );
  app.get('/user/:id', user.by_id );

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


var express = require('express')
  , app = express()
  , path = require('path')
  , mongoose = require('mongoose')
  , routes = require('./routes')
  , pkg = require('./routes/package')
  , passport = require('passport')
  , user = require('./routes/user')
  , users = require('./lib/users')
  , error = require('./lib/error')
  , oxygen_auth = require('./lib/oxygen_auth')
  , basic_auth = require('./lib/basic_auth');

////////////////////////
// DB
////////////////////////

  var mongoUri = 'mongodb://localhost/greg-dev';

  mongoose.connect(mongoUri, function(err) {
    if (!err) {
        console.log('Connected to MongoDB');
      } else {
        throw err;
      }
  });

////////////////////////
// Express Config
////////////////////////

  app.configure(function() {
    app.use(express.logger());
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade')
    app.engine('html', require('ejs').renderFile);
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(passport.initialize());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
  });

////////////////////////
// Debug
////////////////////////

  users.initDebugUser();

////////////////////////
// Routes
////////////////////////

  var auth_type = 'oxygen';

  app.get('/pkgs', pkg.all );
  app.get('/pkg', pkg.all );
  app.get('/pkg_dl/:id/:version', pkg.dl );
  app.get('/pkg/:id', pkg.by_id );
  app.get('/pkg_engine/:engine', pkg.by_engine );
  app.get('/pkg_engine/:engine/:name', pkg.by_engine_and_name );

  app.get('/pkg_search/', pkg.all );
  app.get('/pkg_search/:query', pkg.search ); 

  app.post('/pkg', passport.authenticate(auth_type, { session: false }), pkg.add);
  app.put('/pkg', passport.authenticate(auth_type, { session: false }), pkg.add_version);
  app.put('/pkg-vote/:id', passport.authenticate(auth_type, { session: false }), pkg.vote);

  app.get('/validate', passport.authenticate(auth_type, { session: false }), function(req, res){
    res.send(error.success("You are logged in."))
  });

  app.get('/user_name/:name', user.by_name );
  app.get('/user/:id', user.by_id );

////////////////////////
// Server
////////////////////////

  var port = process.env.PORT || 8080;
  app.listen(port);
  console.log('Starting server on port: ' + port);


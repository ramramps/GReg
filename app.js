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
  , error = require('./lib/error')
  , request = require('superagent');

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
// Routing
////////////////////////

  app.get('/pkgs', pkg.all );
  app.get('/pkg/', pkg.all );
  app.get('/pkg/:id', pkg.by_id );
  app.get('/pkg_engine/:engine', pkg.by_engine );
  app.get('/pkg_engine/:engine/:name', pkg.by_engine_and_name );

  // package search
  app.get('/pkg_search/', pkg.all );
  app.get('/pkg_search/:query', pkg.search ); 

  app.post('/pkg', passport.authenticate('basic', { session: false }), pkg.add);
  app.put('/pkg', passport.authenticate('basic', { session: false }), pkg.add_version);

  app.get('/user_name/:name', user.by_name );
  app.get('/user/:id', user.by_id );

  app.get('/auth/', function(req, res) {

    console.log(req.headers.authorization);

    var url = 'https://accounts-staging.autodesk.com/api/oauth/v1/ValidateAuthorization?requestUrl=10.0.0.6&httpMethod=GET&responseFormat=json';

    request
    .post(url)
    .set('authorization', req.headers.authorization )
    .set('Accept', 'application/json')
    .end(function(res2){
      console.log(res2);
      res.send(res2.body);
    });
    
  });

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


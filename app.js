var express = require('express')
  , app = express()
  , path = require('path')
  , mongoose = require('mongoose')
  , routes = require('./routes')
  , pkg = require('./routes/package')
  , passport = require('passport')
  , user = require('./routes/user')
  , users = require('./lib/users')
  , oxy_auth = require('./lib/oxygen_auth')
  , basic_auth = require('./lib/basic_auth')
  , error = require('./lib/error');

////////////////////////
// DB
////////////////////////

  var mongoDbName = process.env.DEV ? 'greg-dev' : 'greg-prod';
  //var mongoDbUrl = 'mongodb://localhost/';
  var mongoDbUrl = 'mongodb://ec2-54-221-39-2.compute-1.amazonaws.com/';
	var mongoUri = mongoDbUrl + mongoDbName;
	

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

  var auth_type =  process.env.GREG_USE_OXYGEN ? 'oxygen' : 'basic'; 

  console.log('Using authorization strategy: ' + auth_type);

  app.get('/packages', pkg.all );
  app.get('/download/:id/:version', pkg.download_vers );
  app.get('/download/:id', pkg.download_last_vers );
  app.get('/package/:id', pkg.by_id );

  app.get('/packages/:engine', pkg.by_engine );
  app.get('/package/:engine/:name', pkg.by_engine_and_name );

  app.get('/search/:query', pkg.search ); 

  app.post('/package', passport.authenticate(auth_type, { session: false }), pkg.add);
  app.put('/package', passport.authenticate(auth_type, { session: false }), pkg.add_version);
  
  app.put('/upvote/:id', passport.authenticate(auth_type, { session: false }), pkg.upvote_by_id);
  app.put('/downvote/:id', passport.authenticate(auth_type, { session: false }), pkg.downvote_by_id);
  app.get('/comment/:id', passport.authenticate(auth_type, { session: false }), pkg.comment_by_id );

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


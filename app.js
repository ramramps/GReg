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

  var auth_type =  'basic'; 
  //var auth_type =  'oxygen'; 

  app.get('/pkgs', pkg.all );
  app.get('/pkg', pkg.all );
  app.get('/pkg_dl/:id/:version', pkg.download_vers );
  app.get('/pkg_dl/:id', pkg.download_last_vers );
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




  // app.get('/dbg_pkg_dl/:id/:version', function(req, res){
  //   res.redirect('http://www.google.com');
  // });

  // var __dirName = "./";

  // var amazonS3 = require('awssum-amazon-s3'),
  //   fs = require('fs'),
  //   fmt = require('fmt');

  // var crypto = require('crypto');

  // var s3 = new amazonS3.S3({
  //     'accessKeyId'     : "AKIAISKFFMTTM7Q2XYBQ",
  //     'secretAccessKey' : "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",
  //     'region'          : amazonS3.US_EAST_1,
  // });

  // function guid() {
  //   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
  //       var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
  //       return v.toString(16);
  //   });
  // }

  // app.post('/dbg_upload', function(req, res){

  //   var shasum = crypto.createHash('sha256');
  //   var s = fs.ReadStream( req.files.pkg.path );

  //   s.on('data', function(d) {
  //     shasum.update(d);
  //   });

  //   s.on('end', function() {

  //     var d = shasum.digest('base64');

  //     // compare to expected file_hash

  //     var bodyStream = fs.createReadStream( req.files.pkg.path );

  //     var objectName = guid() + req.files.pkg.name;

  //     var options = {
  //       BucketName    : 'greg-server',
  //       ObjectName    : objectName,
  //       ContentLength : req.files.pkg.size,
  //       Body          : bodyStream
  //     };

  //     try {
  //       s3.PutObject(options, function(err, data) {
  //         fmt.dump(err, 'err');
  //         fmt.dump(data, 'data');

  //         var url = "https://s3.amazonaws.com/greg-server/" + objectName;

  //         console.log(url)
          

  //         res.send(200, error.success('cool baby') ); // confirm
  //       });
  //     } catch (e) {
  //       es.send(200, error.success('not cool baby')); // confirm
  //     }

  //   });

  // });
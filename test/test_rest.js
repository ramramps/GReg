var request = require('supertest')
  , express = require('express')
  , mocha = require('mocha')
  , should = require('should')
  , request = request('http://localhost:80');


// test user_id
describe('GET /user_id/:id', function(){

  it('should respond with user object as this id does exist', function(done){
    request
      .get('/user_id/5138a97814eb37ee85000003')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.content.username, 'test');
        should.equal(res.body.success, true);
        done();
      });
  });

  it('should respond with error object as this id does not exist', function(done){
    request
      .get('/user_id/5137a7')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.success, false);
        done();
      });
  });

});

// test user_name
describe('GET /user_name/:name', function(){

  it('should respond with user object as this username does exist', function(done){
    request
      .get('/user_name/test')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.content.username, 'test');
        should.equal(res.body.success, true);
        done();
      });
  });

  it('should respond with error object as this name does not exist', function(done){
    request
      .get('/user_name/5137a7')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.success, false);
        done();
      });
  });

});

// test pkg_id
describe('GET /pkg_id/:id', function(){

  it('should respond with error object as this package does not exist', function(done){
    request
      .get('/pkg_id/20983')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.success, false);
        done();
      });
  });

  it('should respond with object as this package does exist', function(done){
    request
      .get('/pkg_id/5138a97c14eb37ee85000004')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.content.name, 'CoolPackage1362667900345');
        should.equal(res.body.success, true);
        done();
      });
  });

});

// test pkg_engine
describe('GET /pkg_engine/:engine', function(){

  it('should respond with a list of packages as \'dynamo\' is a valid engine name', function(done){
    request
      .get('/pkg_engine/dynamo')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.success, true);
        done();
      });
  });

  it("should respond with error object as this engine does not exist", function(done){
    request
      .get('/pkg_engine/donk')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.success, false);
        done();
      });
  });

});

describe('GET /pkg_engine_name/:engine/:name', function(){

  it('should respond with a single package as this package does exist', function(done){
    request
      .get('/pkg_engine_name/dynamo/cool-package')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        console.log(res.body);
        should.equal(res.body.success, true);
        should.equal(res.body.content.name, 'cool-package');
        done();
      });
  });

  it("should respond with error object as this engine does not exist", function(done){
    request
      .get('/pkg_engine_name/donk/toodle')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.success, false);
        done();
      });
  });

});

describe('POST /pkg', function(){

  var pkg_data = {
      name: "CoolPackage"+Date.now()
    , description: "Cool description"
    , keywords: ['cool', 'neat', 'fun']
    , version: '0.0.1'
    , engine: 'dynamo'
    , engine_version: '0.3.1'
    , license: 'MIT'
    , contents: 'some code'
  };

  it('should respond with success json', function(done){

    request
      .post('/pkg')
      .auth('test','e0jlZfJfKS')
      .set('Content-Type', 'application/json')
      .send(pkg_data)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.success, true);
        done();
      });

  });

  var pkg_data_test = {
      name: "cool-package"
    , description: "Cool description"
    , keywords: ['cool', 'neat', 'fun']
    , version: '0.0.1'
    , engine: 'dynamo'
    , engine_version: '0.3.1'
    , license: 'MIT'
    , contents: 'some more code'
  };

  it('should respond with success json', function(done){

    request
      .post('/pkg')
      .auth('test','e0jlZfJfKS')
      .set('Content-Type', 'application/json')
      .send(pkg_data_test)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.success, true);
        done();
      });
      
  });

});


describe('PUT /pkg', function(){

  var pkg_data = {
      name: "CoolPackage"+Date.now()
    , description: "Cool description"
    , keywords: ['cool', 'neat', 'fun']
    , version: '0.0.1'
    , engine: 'dynamo'
    , engine_version: '0.3.1'
    , license: 'MIT'
  };

  it('should respond with 401 as not authorized.', function(done){

    request
      .put('/pkg')
      .set('Content-Type', 'application/json')
      .send(pkg_data)
      .expect(401, done);

  });

  it('should respond with 401 as not authorized.', function(done){

    request
      .put('/pkg')
      .auth('dope','e0jlZfJfKS')
      .set('Content-Type', 'application/json')
      .send(pkg_data)
      .expect(401, done);

  });

  it('should respond with failure json as package name does not exist', function(done){

    request
      .put('/pkg')
      .auth('test','e0jlZfJfKS')
      .set('Content-Type', 'application/json')
      .send(pkg_data)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.success, false);
        done();
      });
  });

});

describe('GET /pkg_download/:id', function(){

  it('should respond with json', function(done){
    request
      .get('/pkg_download/20983')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });

});

// describe('DELETE /pkg/:id/:version', function(){

//   it('should respond with json', function(done){
//     request
//       .del('/pkg')
//       .auth('test','e0jlZfJfKS')
//       .set('Accept', 'application/json')
//       .expect('Content-Type', /json/)
//       .expect(200, done);
//   })

// });

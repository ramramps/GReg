var request = require('supertest')
  , express = require('express')
  , mocha = require('mocha')
  , should = require('should')
  , request = request('http://localhost:8000');


describe('GET /pkg/:name', function(){

  it('should respond with error object as this package does not exist', function(done){
    request
      .get('/pkg/doodoo')
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
        console.log(res.body);
        should.equal(res.body.success, true);
        done();
      });
  })

});

describe('GET /pkg-download/:id', function(){

  // TODO: this collects all of the package data including dependencies
  it('should respond with json', function(done){
    request
      .get('/pkg/20983')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  })
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

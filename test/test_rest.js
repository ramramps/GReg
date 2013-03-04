var request = require('supertest')
  , express = require('express')
  , mocha = require('mocha')
  , request = request('http://localhost:8000');


describe('POST /pkg', function(){

  it('should respond with json', function(done){
    request
      .get('/pkg')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  })

});

describe('GET /pkg', function(){

  it('should respond with json', function(done){
    request
      .get('/pkg')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  })

});

describe('GET /pkg/:id', function(){

  it('should respond with json', function(done){
    request
      .get('/pkg/20983')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  })

});

describe('GET /pkg-download/:id', function(){

  it('should respond with json', function(done){
    request
      .get('/pkg/20983')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  })

});

describe('POST /pkg', function(){

  it('should respond with json', function(done){
    request
      .post('/pkg')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  })

});

describe('PUT /pkg/:id', function(){

  it('should respond with json', function(done){
    request
      .put('/pkg/20983')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  })

});

describe('DELETE /pkg/:id/:version', function(){

  it('should respond with json', function(done){
    request
      .del('/pkg/20983/24')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  })

});

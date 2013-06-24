var request = require('supertest')
  , express = require('express')
  , mocha = require('mocha')
  , request = request('http://localhost:8080');

describe('POST /', function(){

  it('should respond with json', function(done){

    request
      .get('/validate')
      .auth('test','e0jlZfJfKS')
      .expect('Content-Type', /json/)
      .expect(200, done);

  })
  
});


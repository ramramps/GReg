var request = require('supertest')
  , express = require('express')
  , mocha = require('mocha')
  , request = request('http://localhost:8080');

describe('POST /', function(){

  it('should respond with json', function(done){

    request
      .post('/dbg_upload')
      .expect('Content-Type', /json/)
      .attach('pkg', 'test_rest.js')
      .expect(200, done);

  });

});



// todo
// make link public via awssum options ?
// insert into existing code
// get redirect code working


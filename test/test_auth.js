var request = require('supertest')
  , express = require('express')
  , mocha = require('mocha')
  , request = request('http://localhost:8000');

describe('POST /login', function(){

  it('should respond with json', function(done){

      request
        .get('/login')
        .auth('tobi', 'learnboost')
        .end(function(res){
          res.status.should.equal(200);
          done();
        });

  });

});


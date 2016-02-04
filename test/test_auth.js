var request = require('supertest')
  , app = require('../app.js')
  , mocha = require('mocha')
  , request = request(app);

describe('POST /', function(){

  it('should respond with json', function(done){

    request
      .get('/validate')
      .auth('test','e0jlZfJfKS')
      .expect('Content-Type', /json/)
      .expect(200, done);

  })
  
});


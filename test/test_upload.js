var request = require('supertest')
  , app = require('../app.js')
  , mocha = require('mocha')
  , request = request(app);

describe('POST /', function(){

  it('should respond with json', function(done){

    request
      .post('/dbg_upload')
      .expect('Content-Type', /json/)
      .attach('pkg', 'test/test_rest.js')
      .expect(200, done);

  });

});



// todo
// make link public via awssum options ?
// insert into existing code
// get redirect code working


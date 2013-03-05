var request = require('supertest')
  , express = require('express')
  , mocha = require('mocha')
  , should = require('should')
  , request = request('http://localhost:8000');

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

// describe('GET /pkg-download/:id', function(){

//   it('should respond with json', function(done){
//     request
//       .get('/pkg/20983')
//       .set('Accept', 'application/json')
//       .expect('Content-Type', /json/)
//       .expect(200, done);
//   })

// });

describe('POST /pkg', function(){

  var pkg_data = {
      name: "CoolPackage"+Date.now()
    , user_id: '513613a45657f3046d000003'  
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
        should.equal(res.body.success, true);
        done();
      });
  })

});

// describe('PUT /pkg/:id', function(){

//   it('should respond with json', function(done){
//     request
//       .put('/pkg/20983')
//       .set('Accept', 'application/json')
//       .expect('Content-Type', /json/)
//       .expect(200, done);
//   })

// });


// describe('DELETE /pkg/:id/:version', function(){

//   it('should respond with json', function(done){
//     request
//       .del('/pkg/20983/24')
//       .set('Accept', 'application/json')
//       .expect('Content-Type', /json/)
//       .expect(200, done);
//   })

// });

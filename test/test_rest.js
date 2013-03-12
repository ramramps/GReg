var request = require('supertest')
  , express = require('express')
  , mocha = require('mocha')
  , should = require('should')
  , request = request('http://localhost:8000');


describe('GET /pkg_search/:query', function(){

  it('should respond with data as this is a valid query', function(done){
    request
      .get('/pkg_search/cool')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) return done(err);
        should.equal(res.body.success, true);
        done();
      });
  });

  it('should respond with data as this is a valid query', function(done){
    request
      .get('/pkg_search/')
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

// test user_id
describe('GET /user/:id', function(){

  // it('should respond with user object as this id does exist', function(done){
  //   request
  //     .get('/user_id/513903692d4dc7118b000003')
  //     .set('Accept', 'application/json')
  //     .expect('Content-Type', /json/)
  //     .expect(200)
  //     .end(function(err, res){
  //       if (err) return done(err);
  //       should.equal(res.body.content.username, 'test');
  //       should.equal(res.body.success, true);
  //       done();
  //     });
  // });

  it('should respond with error object as this id does not exist', function(done){
    request
      .get('/user/5137a7')
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

describe('GET /pkg/:id', function(){

  it('should respond with error object as this package does not exist', function(done){
    request
      .get('/pkg/20983')
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

// test pkg_engine
// describe('GET /pkg_engine/:engine', function(){

//   it('should respond with a list of packages as \'dynamo\' is a valid engine name', function(done){
//     request
//       .get('/pkg_engine/dynamo')
//       .set('Accept', 'application/json')
//       .expect('Content-Type', /json/)
//       .expect(200)
//       .end(function(err, res){
//         if (err) return done(err);
//         should.equal(res.body.success, true);
//         done();
//       });
//   });

//   it("should respond with error object as this engine does not exist", function(done){
//     request
//       .get('/pkg_engine/donk')
//       .set('Accept', 'application/json')
//       .expect('Content-Type', /json/)
//       .expect(200)
//       .end(function(err, res){
//         if (err) return done(err);
//         should.equal(res.body.success, false);
//         done();
//       });
//   });

// });


var reptiles = ["Alligator", "Snapping turtle","Box turtle","Eastern box turtle","Aquatic box turtle",
              "Black-nobbed map turtle","Common slider","Chinese three-striped box turtle","Japanese pond turtle",
              "Common musk turtle","Aldabra tortoise","Radiated tortoise","Yellow-footed tortoise","Star tortoise",
              "Desert tortoise","Gopher tortoise","Home’s hingback tortoise","African pancake tortoise",
              "Hermann’s tortoise","Egyptian tortoise","Mountain horn-headed lizard","Philippine sail-finned lizard",
              "Inland bearded dragon","Mali spiny-tailed lizard","Green crested basilisk","Green iguana",
              "San Esteban Island chuckwalla","Leopard gecko","Ocellated lacerta","Prehensile-tailed skink",
              "Blue-tongued skink","Scheltopusik/glass lizard","Mexican beaded lizard","Komodo dragon/Ora",
              "Boa constrictor","Pacific boa","Emerald tree boa","Garden tree boa","Island boa","Green anaconda",
              "Rough-scaled sand boa","Children’s python","Carpet/diamond python","Asian rock python",
              "Royal/ball python","Gopher/pine snake","Rhinoceros snake","Baja ratsnake","Indigo snake",
              "Cornsnake/red ratsnake","Ratsnake","Red mountain racer","Taiwan beauty snake","Eastern hognose snake",
              "Grey-banded kingsnake","Common kingsnake"];

var keywords = ["adorable","beautiful","clean","drab","elegant","fancy","glamorous","handsome","long","magnificent",
              "old-fashioned","plain","quaint","sparkling","ugliest","unsightly","wide-eyed","broad","chubby","crooked",
              "curved","deep","flat","high","hollow","low","narrow","round","shallow","skinny","square","steep","straight",
              "wide","boiling","breeze","broken","bumpy","chilly","cold","cool","creepy","crooked","cuddly","curly","damaged",
              "damp","dirty","dry","dusty","filthy","flaky","fluffy","freezing","hot","warm","wet"];

var pkg_datas = [];

describe('/pkg', function(){

  var j = 0;

  for (var i = 0; i < reptiles.length; i++) {

    var pkg_keywords = [];
    var num_keywords = Math.floor( Math.random() * 6 );

    for (j = 0; j < num_keywords; j++) {
      pkg_keywords.push( keywords[ Math.floor( Math.random() * keywords.length )] );
    }

    pkg_datas.push( {
        name: reptiles[i]
      , description: pkg_keywords.join(' ') + ' ' + 'package'
      , keywords: pkg_keywords
      , version: '0.0.1'
      , engine: 'dynamo'
      , engine_version: '0.3.1'
      , license: 'MIT'
      , contents: 'some code'
    });

    // add some dependencies
    var num_deps = 2;

    if ( i >= num_deps ) {
      var deps = [];
      var deps_map = {};
      var name = "";
      
      // search for few dependencies, making sure there are no dups
      while( deps.length < num_deps ) {
        name = reptiles[ Math.floor( Math.random() * i ) ];
        if ( deps_map[name] === undefined ){
          deps.push(name);
          deps_map[name] = 1;
        }
      }
      
      // define the dependencies array
      pkg_datas[i].dependencies = [];

      for (var k = 0; k < num_deps; k++) {
        pkg_datas[i].dependencies.push( { name: deps[k], version: "0.0.1", engine: "dynamo" } )
      }
    
    }

    it('POST should respond with success json', (function(pkg_in) { return (function(done){

      request
        .post('/pkg')
        .auth('test','e0jlZfJfKS')
        .set('Content-Type', 'application/json')
        .send(pkg_in)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err, res){
          if (err) 
            return done(err);
          should.equal(res.body.success, true);
          done();
          // new_version_correct(JSON.parse( JSON.stringify( pkg_in ) ), function(pkg_in) {
          //   new_version_fail( pkg_in, done );
          // });
        });

    }) })(pkg_datas[i]) );

  }

});

function increment_version(version) {

  var split_version = version.split('.')
  split_version[0] = split_version[0] + 1;
  return split_version.join('.');

}

function new_version_correct(pkg_data, done) {

    pkg_data.version = increment_version( pkg_data.version );

    request
      .put('/pkg')
      .auth('test','e0jlZfJfKS')
      .set('Content-Type', 'application/json')
      .send(pkg_data)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(err, res){
        if (err) 
          return done(err);
        new_version_fail(pkg_data);
        should.equal(res.body.success, true);
        done(pkg_in);
      });

}

function new_version_fail(pkg_data, done) {

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
      done(res);
    });

}

function lookup_success( pkg_id, done) {

  request
    .get('/pkg/' + pkg_id )
    .set('Accept', 'application/json')
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function(err, res){
      if (err) return done(err);
      should.equal(res.body.success, true);
      done(res);
    });

}


    // it('should fail as we did not provide a valid name but did increment the version.', function(done){

    //   pkg_data.orig_name = pkg_data.name;
    //   pkg_data.name = "";

    //   pkg_data.version = increment_version( pkg_data.version );

    //   request
    //     .put('/pkg')
    //     .auth('test','e0jlZfJfKS')
    //     .set('Content-Type', 'application/json')
    //     .send(pkg_data)
    //     .set('Accept', 'application/json')
    //     .expect('Content-Type', /json/)
    //     .expect(200)
    //     .end(function(err, res){
    //       if (err) return done(err);
    //       should.equal(res.body.success, false);
    //       done();
    //     });

    // });

    // it('should fail as we did authenticate.', function(done){

    //   pkg_data.name = pkg_data.orig_name;

    //   pkg_data.version = increment_version( pkg_data.version );

    //   request
    //     .put('/pkg')
    //     .set('Content-Type', 'application/json')
    //     .send(pkg_data)
    //     .set('Accept', 'application/json')
    //     .expect('Content-Type', /json/)
    //     .expect(200)
    //     .end(function(err, res){
    //       if (err) return done(err);
    //       should.equal(res.body.success, false);
    //       done();
    //     });

    // });

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

// describe('GET /pkg_download/:id', function(){

//   it('should respond with json', function(done){
//     request
//       .get('/pkg_download/20983')
//       .set('Accept', 'application/json')
//       .expect('Content-Type', /json/)
//       .expect(200, done);
//   });

// });

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

var search = require('../lib/search')
	, request = require('supertest')
  , express = require('express')
  , mocha = require('mocha')
  , should = require('should')
  , request = request('http://localhost:8080')
  , pkgs = require('../lib/packages');

function get_pkg_search_object() {

	var pkg_search_obj = {};

	pkg_search_obj.name = "dummy";
	pkg_search_obj.keywords = "toads frogs";
	pkg_search_obj.engine ="dynamo";
	pkg_search_obj.group = "frogs";

	return pkg_search_obj;

}

describe('search.add', function(){

  it('should respond not have an error for a well-formed request', function(done){

		search.add( "12939", get_pkg_search_object(), function(err, data){

			should.equal(data.StatusCode, 200);
			done();

		});

  });

});

var packages = require('../lib/packages')
	, mocha = require('mocha')
  , should = require('should');

describe('packages.build_suffix_array_string', function(){

	it('should return a long string when given a long word', function(){

		var string = "these are some things to suffix i like noodles";
		var suffix_string = packages.build_suffix_array_string(string);
		should.exist( suffix_string );

	}); 

	it('should return an empty string when passed an empty string or null', function(){

		var string = null;
		var suffix_string = packages.build_suffix_array_string(string);
		should.exist( suffix_string );

	});

});

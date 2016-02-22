var packages = require('../lib/packages')
	, mocha = require('mocha')
  , should = require('should');

describe('packages.validate_base_pkg_data', function(){

	it('should say the package is bady formed when the package name is too short', function(){

		var pkg_data = {name: ''}
		var pkg_data1 = {name: 'a'}
		var pkg_data2 = {name: 'aa'}

		should.exist( packages.validate_base_pkg_data( pkg_data ) );
		should.equal( false, packages.validate_base_pkg_data( pkg_data ).success );
		should.exist( packages.validate_base_pkg_data( pkg_data1 ) );
		should.equal( false, packages.validate_base_pkg_data( pkg_data1 ).success );
		should.exist( packages.validate_base_pkg_data( pkg_data2 ) );
		should.equal( false, packages.validate_base_pkg_data( pkg_data2 ).success  );

	});

	it('should return nothing when the package data is an empty object', function(){

		var pkg_data = {};
		should.equal( null, packages.validate_base_pkg_data( pkg_data ) );

	});

	it('should return error object when any of the dependencies have no version', function(){

		var pkg_data = { dependencies: [{name: "bla"}, {name: "bloo", version: "0.0.1"}] };

		should.equal( false, packages.validate_base_pkg_data( pkg_data ).success );

	});

	it('should return error object when any of the dependencies have badly formed version', function(){

		var pkg_data = { dependencies: [{name: "bloo", version: "0.0.x1"}] };

		should.equal( false, packages.validate_base_pkg_data( pkg_data ).success );

	});

	it('should return error object when the description is too short', function(){

		var pkg_data = { description: "" };
		should.equal( false, packages.validate_base_pkg_data( pkg_data ).success );

	});

	it('should return error object when there are duplicate keywords', function(){

		var pkg_data = { keywords: ["ok", "ok"] };
		should.equal( false, packages.validate_base_pkg_data( pkg_data ).success );

	});

	it('should return error object when there are too many keywords', function(){

		var pkg_data = { keywords: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"] };

		should.equal( false, packages.validate_base_pkg_data( pkg_data ).success );

	});

	it('should return null when the license is supported', function(){

		var pkg_data = { license: "MIT" };
		should.not.exist( packages.validate_base_pkg_data( pkg_data ) );

	});

});

describe('packages.validate_version_string', function(){

	it('should say the string is well-formed when a string of form \'digits.digits.digits\'', function(){

		var max_value = 100
			, major = 0
			, minor = 0
			, rev = 0
			, vers_string = "";

		for (var i = 0; i < 1000; i++) {

			major = Math.floor( Math.random() * 100 );
			minor = Math.floor( Math.random() * 100 );
			rev = Math.floor( Math.random() * 100 );

			vers_string = major.toString() + '.' + minor.toString() + '.' + rev.toString();

			should.equal( true, packages.validate_version_string( vers_string ) );

		}

	});

	it('should say the string is well-formed when a string of form \'~digits.digits.digits\'', function(){

		var max_value = 100
			, major = 0
			, minor = 0
			, rev = 0
			, vers_string = "";

		for (var i = 0; i < 1000; i++) {

			major = Math.floor( Math.random() * 100 );
			minor = Math.floor( Math.random() * 100 );
			rev = Math.floor( Math.random() * 100 );

			vers_string = '~' + major.toString() + '.' + minor.toString() + '.' + rev.toString();

			should.equal( true, packages.validate_version_string( vers_string ) );

		}

	});

	it('should say the string is well-formed when a string of form \'~digits.digits.*\'', function(){

		var max_value = 100
			, major = 0
			, minor = 0
			, rev = 0
			, vers_string = "";

		for (var i = 0; i < 1000; i++) {

			major = Math.floor( Math.random() * 100 );
			minor = Math.floor( Math.random() * 100 );
			rev = Math.floor( Math.random() * 100 );

			vers_string = '~' + major.toString() + '.' + minor.toString() + '.*';

			should.equal( true, packages.validate_version_string( vers_string ) );

		}

	});

	it('should say the string is well-formed when a string of form \'digits.digits.*\'', function(){

		var max_value = 100
			, major = 0
			, minor = 0
			, rev = 0
			, vers_string = "";

		for (var i = 0; i < 1000; i++) {

			major = Math.floor( Math.random() * 100 );
			minor = Math.floor( Math.random() * 100 );
			rev = Math.floor( Math.random() * 100 );

			vers_string = major.toString() + '.' + minor.toString() + '.*';

			should.equal( true, packages.validate_version_string( vers_string ) );

		}

	});

	it('should say the string is well-formed when a string of form \'>=digits.digits.*\'', function(){

		var max_value = 100
			, major = 0
			, minor = 0
			, rev = 0
			, vers_string = "";

		for (var i = 0; i < 1000; i++) {

			major = Math.floor( Math.random() * 100 );
			minor = Math.floor( Math.random() * 100 );

			vers_string = '>=' + major.toString() + '.' + minor.toString() + '.*';

			should.equal( true, packages.validate_version_string( vers_string ) );

		}

	});

	it('should say the string is well-formed when a string of form \'>=digits.digits.digits\'', function(){

		var max_value = 100
			, major = 0
			, minor = 0
			, rev = 0
			, vers_string = "";

		for (var i = 0; i < 1000; i++) {

			major = Math.floor( Math.random() * max_value );
			minor = Math.floor( Math.random() * max_value );
			rev = Math.floor( Math.random() * max_value );

			vers_string = '>=' + major.toString() + '.' + minor.toString() + '.' + rev.toString();

			should.equal( true, packages.validate_version_string( vers_string ) );

		}

	});


	it('should say the string is badly-formed when a string of form \'.digits.digits\'', function(){

		var max_value = 1000
			, minor = 0
			, rev = 0
			, vers_string = "";

		for (var i = 0; i < max_value; i++) {

			minor = Math.floor( Math.random() * max_value );
			rev = Math.floor( Math.random() * max_value );

			vers_string = '.' + minor.toString() + '.' + rev.toString();

			should.equal( false, packages.validate_version_string( vers_string ) );

		}

	});

	it('should say the string is badly-formed when a string of form \'digits.digits\'', function(){

		var max_value = 1000
			, major = 0
			, minor = 0
			, rev = 0
			, vers_string = "";

		for (var i = 0; i < max_value; i++) {

			minor = Math.floor( Math.random() * max_value );
			rev = Math.floor( Math.random() * max_value );

			vers_string = minor.toString() + '.' + rev.toString();

			should.equal( false, packages.validate_version_string( vers_string ) );

		}

	});

	it('should say the string is badly-formed when a string of form \'digits\'', function(){

		var max_value = 1000
			, minor = 0
			, vers_string = "";

		for (var i = 0; i < max_value; i++) {

			minor = Math.floor( Math.random() * max_value );

			vers_string = minor.toString();

			should.equal( false, packages.validate_version_string( vers_string ) );

		}

	});

	it('should say the string is badly-formed when a string of form \'>=digits\'', function(){

		var max_value = 1000
			, minor = 0
			, vers_string = "";

		for (var i = 0; i < max_value; i++) {

			minor = Math.floor( Math.random() * max_value );

			vers_string = '>=' + minor.toString();

			should.equal( false, packages.validate_version_string( vers_string ) );

		}

	});

	it('should say the string is badly-formed when a string of form \'>=digits.*\'', function(){

		var max_value = 1000
			, minor = 0
			, vers_string = "";

		for (var i = 0; i < max_value; i++) {

			minor = Math.floor( Math.random() * max_value );

			vers_string = '>=' + minor.toString() + '.*';

			should.equal( false, packages.validate_version_string( vers_string ) );

		}

	});

	it('should say the string is badly-formed when a string of form \'..\'', function(){

		should.equal( false, packages.validate_version_string( '..' ) );

	});

	it('should say the string is badly-formed when a string of form \'digits..\'', function(){

		var max_value = 1000
			, minor = 0
			, vers_string = "";

		for (var i = 0; i < max_value; i++) {

			minor = Math.floor( Math.random() * max_value );

			vers_string = minor.toString() + '..';

			should.equal( false, packages.validate_version_string( vers_string ) );

		}

	});

	it('should say the string is badly-formed when a string of form \'digits..*\'', function(){

		var max_value = 1000
			, minor = 0
			, vers_string = "";

		for (var i = 0; i < max_value; i++) {

			minor = Math.floor( Math.random() * max_value );

			vers_string = minor.toString() + '..*';

			should.equal( false, packages.validate_version_string( vers_string ) );

		}

	});

});

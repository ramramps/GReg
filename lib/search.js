var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var SearchService = awssum.load('amazon/cloudsearch').SearchService;
var DocumentService = awssum.load('amazon/cloudsearch').DocumentService;
var CloudSearch = awssum.load('amazon/cloudsearch').CloudSearch;
var error = require('./error');

var env             = process.env;
var accessKeyId     = "AKIAISKFFMTTM7Q2XYBQ";
var secretAccessKey = "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";
var awsAccountId    = "1664-7354-5606";

var cs = new CloudSearch({
    'accessKeyId'     : accessKeyId,
    'secretAccessKey' : secretAccessKey,
    'awsAccountId'    : awsAccountId
});

// fmt.field('Region', cs.region() );
// fmt.field('EndPoint', cs.host() );
// fmt.field('AccessKeyId', cs.accessKeyId().substr(0, 3) + '...' );
// fmt.field('SecretAccessKey', cs.secretAccessKey().substr(0, 3) + '...' );
// fmt.field('AwsAccountId', cs.awsAccountId() );

cs.DescribeServiceAccessPolicies({ DomainName : 'greg-dev-test' }, function(err, data) {
	console.log("Checking cloud search access...");
	if (err) {
		console.log('There was an error...')
		console.log(err);
		return;
	}
	console.log(data);
	console.log('Search access looks good...');
});

var ss = new SearchService({
    domainName : 'greg-dev-test',
    domainId   : '3tkglpzpinvnz73tdsdrm7koba',
});

var ds = new DocumentService({
    domainName : 'greg-dev-test',
    domainId   : '3tkglpzpinvnz73tdsdrm7koba',
});

exports.add = function(id, fields, callback) {	
	console.log('Attempting to add');
	var opts = {
	    Docs : [
	        {
	            "type": "add",
	            "id": id.toString(),
	            "version": Math.floor( Date.now() / 1000 ),
	            "lang": "en",
	            "fields": fields
	        }
	    ],
	};

	ds.DocumentsBatch(opts, function(err, data) {
	    if (err) {
	    	console.log(err);
	    	callback( error.fail('Adding to search failed.') );
	    	return;
	    }
	    callback( null, data );  // otherwise we're all good
	});

};

exports.pkg_search = function(query_text, callback) {
	
	var opts = {
	    q : query_text
	};

	ss.Search(opts, function(err, data) {
	    if (err) {
	    	callback( error.fail('The search failed.') );
	    	return;
	    }
	    callback( null, data ); // otherwise we're all good
	});

};

exports.delete = function( id, version, callback ) {
	var opts = {
	    Docs : [
	        { "type": "delete",
	          "id": id.toString(),
	          "version": Math.floor( Date.now() / 1000 )
	        }
	    ],
	};

	ds.DocumentsBatch(opts, function(err, data) {
	    if (err) {
	    	callback( error.fail('The search failed.') );
	    	return;
	    }
	    callback( null, data );  // otherwise we're all good
	});
};


exports.update = function( id, fields, callback ) {

	var opts = {
	    Docs : [
	        { "type": "add",
	          "id": id.toString(),
	          "version": Math.floor( Date.now() / 1000 ),
	          "lang": "en",
	          "fields": fields
	        }
	    ],
	};

	ds.DocumentsBatch(opts, function(err, data) {
	    if (err) {
	    	callback( error.fail('The search failed.') );
	    	return;
	    }
	    callback( null, data );  // otherwise we're all good
	});

};

// exports.search_by_fields = function( space_id, fields, callback ) {
// 	callback();
// };


// var argsWithFields = {
//     'q'      : 'searchterm',
//     'facet'  : 'size,color,section', // comma separated fields
//     'field' : {
//         'color' : {
//             'constraints' : "'red','green','blue'",
//             'sort'        : 'alpha',
//             'top-n'       : 10,
//         },
//         'year' : {
//             'constraints' : '2000..2011',
//             'sort'        : 'count',
//             'top-n'       : 50,
//         },
//     },
// };

// ss.Search(argsWithFields, function(err, data) {
//     fmt.msg("searching for something - expecting failure (ENOTFOUND ie. no search Domain(Id/Name))");
//     fmt.dump(err, 'Error');
//     fmt.dump(data, 'Data');
// });
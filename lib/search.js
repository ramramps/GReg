
var awssum = require('awssum');

//var amazon = awssum.load('amazon/amazon');
var SearchService = awssum.load('../awssum-amazon-cloudsearch/awssum-amazon-cloudsearch').SearchService;
var DocumentService = awssum.load('../awssum-amazon-cloudsearch/awssum-amazon-cloudsearch').DocumentService;
var CloudSearch = awssum.load('../awssum-amazon-cloudsearch/awssum-amazon-cloudsearch').CloudSearch;
var error = require('./error');

var accessKeyId     = process.env.AWSAccessKeyId;
var secretAccessKey = process.env.AWSSecretKey;
var awsAccountId    = process.env.AWSAccountId;

var cs = new CloudSearch({
    'accessKeyId'     : accessKeyId,
    'secretAccessKey' : secretAccessKey,
    'awsAccountId'    : awsAccountId
});

if ( process.env.DEV != 'true' ){
	var domainName = "greg-prod";
	var domainId = "jal3jtzaifbknjxveqqoatu52m";
} else {
	var domainName = "greg-dev";
	var domainId = "4j6zt73kqj2fejwblclwugzqhy";
}

cs.DescribeServiceAccessPolicies({ DomainName : domainName }, function(err, data) {
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
    domainName : domainName,
    domainId   : domainId,

});

var ds = new DocumentService({
    domainName : domainName,
    domainId   : domainId,
});


exports.add = function(id, fields, callback) {	


	var opts = {
	    Docs : [
	        {
	            "type": "add",
	            "id": id.toString(),
	            "version": Math.floor( Date.now() / 1000 ),
	            "lang": "en",
	            "fields": fields
	        }
	    ]
	};

	ds.DocumentsBatch(opts, function(err, data) {
	    if (err) {
	    	console.log(err);
	    	return callback( error.fail('Adding to search failed.') );
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
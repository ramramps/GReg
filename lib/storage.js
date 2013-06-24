var amazonS3 = require('awssum-amazon-s3'),
	fs = require('fs'),
	fmt = require('fmt');

var s3 = new amazonS3.S3({
    'accessKeyId'     : "AKIAISKFFMTTM7Q2XYBQ",
    'secretAccessKey' : "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",
    'region'          : amazonS3.US_EAST_1,
});

s3.ListBuckets(function(err, data) {
    if (err) throw new Error(err);

    var buckets = data.Body.ListAllMyBucketsResult.Buckets.Bucket;
    console.log(buckets)
    // buckets.forEach(function(bucket) {
    //     console.log('%s : %s', bucket.CreationDate, bucket.Name);
    // });

});

var __filename = "search.js";

fs.stat(__filename, function(err, file_info) {
    var bodyStream = fs.createReadStream( __filename );

    var options = {
        BucketName    : 'greg-server',
        ObjectName    : 'amazon.js',
        ContentLength : file_info.size,
        Body          : bodyStream
    };

    s3.PutObject(options, function(err, data) {
        fmt.dump(err, 'err');
        fmt.dump(data, 'data');
    });
});


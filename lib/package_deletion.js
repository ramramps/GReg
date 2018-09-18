var PackageModel = require('../models/package').PackageModel,
    UserModel = require('../models/user').UserModel,
    mongoose = require('mongoose'),
    aws = require('aws-sdk'),
    async = require('async'),
    fs = require('fs');

/**
 * Parses all JSON files located in `s3://package-manager-deletion-requests/New-Deletions` directory
 * that are prefixed with 'delete' and attempts to remove specified packages by ObjectIds and updates 
 * the package author's 'Maintains' array.  The 'num_maintained_packages' value is automatically
 * updated every 20 minuntes when the stats are calculated.  This functionality can be disabled by setting
 * the `process.env.PACKAGE_DELETION_ENABLED` value to false.
 * 
 * callback: function that takes a string/error to be sent to the #dynamo-notifications slack channel
 */
exports.remove_packages = function(callback){

    console.log('Starting package deletion scan...')

    // Credentials
    var s3 = new aws.S3({
        'accessKeyId'     : process.env.AWSAccessKeyId,
        'secretAccessKey' : process.env.AWSSecretKey,
        'region'          : aws.US_EAST_1
    });

    // JSON files used for deletion located in'package-manager-deletion-requests/New-Deletion`
    var params = { 
        Bucket: 'package-manager-deletion-requests',
        Delimiter: '/',
        Prefix: 'New-Deletions/delete' // File names should be prefixed with 'delete'
    };

    s3.listObjects(params, function(error, data) {
        if (error) { 
            return callback(error);
        }
        else if(data.Contents.length === 0) {
            return callback('No deletion files found in S3 package-manager-deletion-requests/New-Deletions/');
        }
        else { 
            var keys = data.Contents;

            keys.forEach(keyObject => {
                var params = {
                    Bucket: 'package-manager-deletion-requests', 
                    Key: keyObject.Key
                };

                removePackageByKey(params, s3, callback);
            });
        }
    });
};

/**
 * Remove a package by providing the following
 * 
 * @param params: S3 'Bucket' and 'Key' object
 * @param s3: reference to S3 credentials
 * @param callback: function that takes a string to be displayed on the notifications slack channel
 */
function removePackageByKey(params, s3, callback) {

    // Waterfall runs functions in series, passing results to the next function
	// If any function returns error object, the whole thing terminates
    async.waterfall([ 
        
        // Retrieve S3 JSON object
        function(local_Callback) {
            
            s3.getObject(params, function(error, data) {
                
                if(error) { return callback(error); }

                var fileContents = data.Body.toString();
                var s3File = JSON.parse(fileContents);

                // This was designed so that in the future the `package_id` route can be automatically
                // consumed, which will always return a single package in the JSON response
                if(s3File.length !== 1) { return callback('JSON file should only contain a single package, aborting...'); }

                // JSON response (https://dynamopackages.com/package_id/MY_PACKAGE_NAME)
                var deletionObject = s3File[0];
                
                if(!deletionObject) { return callback('JSON file is null for S3 file: ' + params.Key); }

                // Return 
                local_Callback(null, deletionObject); // deletionObject is passed to the next func

            });

        },

        // Remove package by Id
        function(deletionObject, local_Callback) {
            
            var packageId = deletionObject.package_id;
            var packageName = deletionObject.package_name;
            var maintainers = deletionObject.maintainers;

            PackageModel.findById(new mongoose.Types.ObjectId(packageId), (error, package) => {
                
                if(error) { return callback(error); }
                
                if(!package) { return callback('Query returned a null package for ObjectId: ' + packageId + ' - ' + packageName); }

                // Remove Package
                package.remove((error) => {
                    if (error) { return callback(error) }
                });

                // Return
                local_Callback(null, package, maintainers); // package and maintainers object passed to the next func

            });

        },

        // Update maintainers
        function(package, maintainers, local_Callback) {
            
            maintainers.forEach(maintainer => {
                
                var userId = maintainer._id

                // Update user 'maintains' array
                UserModel.findById(new mongoose.Types.ObjectId(userId), (error, user) => {
                    
                    if(error) { return callback(error); }
                    
                    if(!user) { return callback('Query returned a null user for ObjectId: ' + userId); }
                    
                    // Remove Package from publishers 'maintains' array
                    user.update( ( { $pull: { maintains: package._id } } ), (error, data) => {
                        
                        if(error) { return callback(error) }
                        
                        // At this point all DB work is complete without errors
                        // Attempt to copy JSON file in S3 from 'New-Deletions' to 'Executed-Deletions' dir
                        moveS3File(params, s3, callback);
                        
                        // Complete
                        return callback(package.name + ' authored by ' + user.username + ' was successfully deleted')
                    });

                });

            });

        },

    ], function (error) {
            if (error) { return callback(error); }
        }
    );

    // Notify an execution attempt occured
    var date = new Date();
    return callback('A package manager deletion request was executed on ' + date.toDateString() + ' at ' + date.toLocaleTimeString());

}

/**
 * Copy a JSON file on S3 'New-Deletions' to 'Executed-Deletions'
 * And delete the original source file if copy is successful
 * 
 * @param params: S3 'Bucket' and 'Key' object
 * @param s3: reference to S3 credentials
 * @param callback: function that takes a string to be displayed on the notifications slack channel
 */
function moveS3File(params, s3, callback) {
    var updatedParams = {
        Bucket: params.Bucket, 
        CopySource: params.Bucket + '/' + params.Key, 
        Key: 'Executed-Deletions/' + new Date().toISOString() + '.json' 
    }

    s3.copyObject(updatedParams, function(error, data) {
        if(error) {
            callback(error);
        }
        else {
            // If copy is successful, delete source file from 'New-Deletions'
            deleteS3File(params, s3, callback)
        }
    });
}

/**
 * Delete a file on S3
 * 
 * @param params: S3 'Bucket' and 'Key' object
 * @param s3: reference to S3 credentials
 * @param callback: function that takes a string to be displayed on the notifications slack channel
 */
function deleteS3File(params, s3, callback) {
    s3.deleteObject(params, function(error, data) {
        if(error) {
           callback(error);
        }
    });
}
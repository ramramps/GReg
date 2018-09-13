let PackageModel = require('../models/package').PackageModel,
    UserModel = require('../models/user').UserModel,
    mongoose = require('mongoose'),
    aws = require('aws-sdk')
    fs = require('fs');

/**
 * Parses a local JSON file containing ObjectIds
 * for packages that will attempt to be deleted.
 * 
 * callback: function that takes a string to be displayed on the notifications slack channel
 */
exports.remove_packages = function(callback){

    console.log('Starting package deletion scan...')

    // Credentials
    let s3 = new aws.S3({
        'accessKeyId'     : process.env.AWSAccessKeyId,
        'secretAccessKey' : process.env.AWSSecretKey,
        'region'          : aws.US_EAST_1
    });

    // JSON files used for deletion located in'package-manager-deletion-requests/New-Deletion`
    let params = { 
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
            let keys = data.Contents;

            keys.forEach(keyObject => {
                let params = {
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
    s3.getObject(params, function(error, data) {
        if (error) { 
            return callback(error);
        }
        else {
            let fileContents = data.Body.toString();
            let deletionObject = JSON.parse(fileContents)[0];
            
            if(!deletionObject) {
                return callback('JSON file is null for S3 file: ' + params.Key);
            }
            else {
                let packageId = deletionObject.package_id;
                let packageName = deletionObject.package_name;
                let maintainers = deletionObject.maintainers;

                // Find package by id
                PackageModel.findById(new mongoose.Types.ObjectId(packageId), (error, package) => {
                    if(error) {
                        return callback(error);
                    }
                    else if(!package) {
                        return callback('Query returned a null package for ObjectId: ' + packageId + ' - ' + packageName);
                    }
                    else {
                        // Remove Package
                        package.remove((error) => {
                            if (error) {
                                return callback(error)
                            }
                        });

                        // Unless manually modified, array should contain a single maintainer
                        maintainers.forEach(maintainer => {
                            let userId = maintainer._id

                            // Update user 'maintains' array
                            UserModel.findById(new mongoose.Types.ObjectId(userId), (error, user) => {
                                if(error){
                                    return callback(error);
                                }
                                else if(!user) {
                                    return callback('Query returned a null user for ObjectId: ' + userId);
                                }
                                else {
                                    // Remove Package from publishers 'maintains' array
                                    user.update( ( { $pull: { maintains: package._id } } ), (error, data) => {
                                        if (error) {
                                            return callback(error)
                                        }
                                        else {
                                            // At this point all DB work is complete without errors
                                            // Attempt to copy JSON file in S3 from 'New-Deletions' to 'Executed-Deletions' dir
                                            moveS3File(params, s3, callback);
                                            
                                            // Complete
                                            return callback(package.name + ' authored by ' + user.username + ' was successfully deleted')
                                        }
                                    });
                                }
                            });
                        });
                    }
                })
            }
        }

        let date = new Date();
        return callback('A package manager deletion request was executed on ' + date.toDateString() + ' at ' + date.toLocaleTimeString());
    });
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
    let updatedParams = {
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
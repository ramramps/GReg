let PackageModel = require('../models/package').PackageModel,
    UserModel = require('../models/user').UserModel,
    mongoose = require('mongoose'),
    aws = require('aws-sdk')
    fs = require('fs');

/**
 * Parses a local JSON file containing ObjectIds
 * for packages that will attempt to be deleted.
**/
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
                                            // TODO move JSON file by key to 'Executed-Deletions`
                                            // TODO delete JSON file from 'New-Deletions'
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

        return callback('New package deletion request at ' + new Date().toString());

    });
}
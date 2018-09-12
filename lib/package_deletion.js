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
            console.log(error, error.stack);
            return callback(error);
        }
        else if(data.Contents.length === 0) {
            let msg = 'Found 0 matching deletion files in S3 package-manager-deletion-requests/New-Deletions/'
            console.log(msg);
            return callback(msg);
        }
        else { 
            let keys = data.Contents;
            console.log('Found ' + keys.length + ' matching deletion files in S3 package-manager-deletion-requests/New-Deletions/');

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
            console.log(error, error.stack);
            return callback(error);
        }
        else {
            let fileContents = data.Body.toString();
            let deletionObject = JSON.parse(fileContents)[0];
            
            if(!deletionObject) {
                return callback('JSON file is null for S3 file: ' + params.Key);
            }
            else {
                console.log(deletionObject.package_name + ' packages to be deleted');

                let packageId = deletionObject.package_id;
                let packageName = deletionObject.package_name;
                let maintainers = deletionObject.maintainers;

                // Find package by id
                PackageModel.findById(new mongoose.Types.ObjectId(packageId), (error, package) => {
                    if(error) {
                        console.log('Unable to find package with matching ObjectId: ' + packageId + ' - ' + packageName);
                        return callback(error);
                    }
                    else if(!package) {
                        return callback('Query returned a null package for ObjectId: ' + packageId + ' - ' + packageName);
                    }
                    else {
                        console.log('Found package with matching ObjectId: ' + package._id + ' - ' + package.name);
                        
                        // Remove Package
                        package.remove((error) => {
                            if (error) {
                                console.log('Unable to remove ' + package.name);
                                return callback(error)
                            }
                            else {
                                console.log(package.name + ' successfully removed.');
                            }
                        });

                        // Unless manually modified, array should contain a single maintainer
                        maintainers.forEach(maintainer => {
                            let userId = maintainer._id

                            // Update user 'maintains' array
                            UserModel.findById(new mongoose.Types.ObjectId(userId), (error, user) => {
                                if(error){
                                    console.log('Unable to find user with matching ObjectId: ' + userId);
                                    return callback(error);
                                }
                                else if(!user) {
                                    return callback('Query returned a null user for ObjectId: ' + userId);
                                }
                                else if(user){
                                    console.log('Found user with matching ObjectId: ' + user._id + ' - ' + package.name);

                                    // Remove Package from publishers 'maintains' array
                                    user.update( ( { $pull: { maintains: package._id } } ), (error, data) => {
                                        if (error) {
                                            console.log('Unable to update maintains array for ' + user.username);
                                            return callback(error)
                                        }
                                        else {
                                            console.log(package.name + ' was removed from ' + user.username + ' maintains array');
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
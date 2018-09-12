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

    // Bucket data
    let params = {
        Bucket: 'package-manager-deletion-requests', 
        Key: 'New-Deletion/packagesToDelete.json'
    };

    s3.getObject(params, function(error, data) {
        if (error) { 
            console.log(error, error.stack);
            return callback(error);
        }
        else {
            let fileContents = data.Body.toString();
            
            // TODO can this be composed from several json files instead?
            var deletionObjects = JSON.parse(fileContents);
            
            if(!deletionObjects) {
                return callback("JSON file is null");
            }
            else {
                console.log(deletionObjects.length.toString() + ' packages to be deleted');

                // For each package id loaded from the JSON file
                deletionObjects.forEach(deletionObject => {

                    let packageId = deletionObject.package_id;
                    // An array of maintainers
                    let maintainers = deletionObject.maintainers;

                    // Find package by id
                    PackageModel.findById(new mongoose.Types.ObjectId(packageId), (error, package) => {
                        if(error) {
                            console.log('Unable to find package with matching ObjectId: ' + packageId);
                            return callback(error);
                        }
                        else if(!package) {
                            return callback('Query returned a null package for ObjectId: ' + packageId);
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

                            // Unless manually modified, should contain a single maintainer
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
                                        
                                        // Publishers 'num_maintained_packages' value is automatically 
                                        // updated every 20 minutes when 'synchronize_package_stats' runs

                                        // Remove Package from publishers 'maintains' array
                                        user.update( ( { $pull: { maintains: package._id } } ), (error, data) => {
                                            if (error) {
                                                console.log('Unable to update maintains array for ' + user.username);
                                                return callback(error)
                                            }
                                            else {
                                                console.log(package.name + ' was removed from ' + user.username + ' maintains array');
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    })
                });
            }
        }

        return callback(new Date().toString());

    });
};
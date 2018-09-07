let PackageModel = require('../models/package').PackageModel,
    UserModel = require('../models/user').UserModel,
    mongoose = require('mongoose'),
    _ = require('underscore'),
    fs = require('fs');

/**
 * Parses a local JSON file containing ObjectIds
 * for packages that will attempt to be deleted.
**/
exports.remove_packages = function(callback){

    console.log('Starting package deletion scan...')

    // TODO should point to current directory structure (ssl folder where S3 JSON file is copied)
    let packageIdJson = 'C:/Users/alfarok/Documents/GReg_alfarok/packagesToDelete.json';

    // Load S3 JSON from local disk (requires another script that copies JSON from S3 to local machine)
    fs.readFile(packageIdJson, 'utf8', function (error, data) {
        
        if (error) {
            console.log('Unable to read JSON file');
            return callback(error);
        }
        else if (!data) {
            return callback("JSON file is null");
        }
        else {
            let deletionObjects = JSON.parse(data);

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
        
        return callback(new Date().toString());
        
    });
};

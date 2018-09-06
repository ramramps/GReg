let PackageModel = require('../models/package').PackageModel,
    UserModel = require('../models/user').UserModel,
    mongoose = require('mongoose'),
    _ = require('underscore'),
    fs = require('fs');

exports.remove_packages = function(callback){

    console.log('Starting package deletion scan...')

    // TODO this needs to point at a specific location on machine where S3 CSV file is copied
    let directoryPath = 'C:/Users/alfarok/Desktop/sampleCSV.csv';

    // Load S3 CSV from local disk (requires another script that copies from S3 to local machine)
    fs.readFile(directoryPath, (error, fileData) => {
        if (error) {
            console.log('Unable to read local CSV file');
            return callback(error);
        }
        else{
            let packageIds = fileData.toString().split(',');
            console.log('Package Ids for Removal: ');
            console.log(packageIds);
            
            // For each package id loaded from the CSV file
            packageIds.forEach(packageId => {
                PackageModel.findById(new mongoose.Types.ObjectId(packageId), (error, package) => {
                    if(error || _.isEmpty(package)){
                        return callback('Unable to find package with matching ObjectId: ' + packageId);
                    }
                    else {
                        console.log('Found package with matching ObjectId: ' + package._id + ' - ' + package.name);

                        let maintainers = package.maintainers;
                        
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

                        // Update the package authors user data
                        maintainers.forEach(maintainer => {
                            
                            let userId = maintainer.toHexString();

                            UserModel.findById(new mongoose.Types.ObjectId(userId), (error, user) => {
                                if(error || _.isEmpty(user)){
                                    return callback('Unable to find user with matching ObjectId: ' + user.userName);
                                }
                                else {
                                    console.log('Found user with matching ObjectId: ' + user._id + ' - ' + package.name);
                                    
                                    // Remove Package from publishers 'maintains' array
                                    // Publishers 'num_maintained_packages' value is automatically updated every 20 minutes when 'synchronize_package_stats' runs
                                    user.update( ( { $pull: { maintains: package._id } } ), (error, data) => {
                                        if (error) {
                                            console.log('Unable to update maintains array for ' + user.username);
                                            return callback(error)
                                        }
                                        else {
                                            return callback(package.name + ' was successfully removed from ' + user.username + ' maintains array');
                                        }
                                    });
                                }
                            });

                        })
                    }
                })
            });
        }
    })
};

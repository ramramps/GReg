#!/usr/bin/env node

if((process.argv.length != 4) ||
   ((process.argv[2] !== "add") && (process.argv[2] !== "remove")))
{
    console.log("Usage: whitelist <add|remove> <package-name>");
    console.log("  Examples:");
    console.log("    White-list a package: whitelist add MyAwesomePackage");
    process.exit(1);
}

var newFieldValue = process.argv[2] == "add";
var packageName = process.argv[3];
var fieldName = "white_list";

var mongoose = require('mongoose');

var mongoDbName = process.env.GREG_DB_NAME;
var mongoDbUrl = process.env.GREG_DB_URL;
var mongoUri = mongoDbUrl + mongoDbName;
    
console.log("Connecting to " + mongoUri);
mongoose.connect(mongoUri);

mongoose.connection.on('error', function() {
    console.error('MongoDB Connection Error. Please make sure MongoDB is running.');
    process.exit(1);
});

var PackageModel = require('../models/package').PackageModel;

mongoose.connection.on('connected', function () {
    console.log("Looking up package with name " + packageName + "...");
    PackageModel.findOne({name:packageName}, function (err, package)
    {
        if (err)
        {
            console.log('There was an error trying to look up that package.');
            process.exit(1);
        }

        if (!package)
        {
            console.log('That package does not exist.');
            process.exit(1);
        }

        package[fieldName] = newFieldValue;
        package.markModified(fieldName);

        package.save(function (err)
        {
            if (err)
            {
                console.log('There was an error trying to save your changes.');
                process.exit(1);
            }
            
            if(package[fieldName]){
                console.log('Package added to the white list.');
            }else{
                console.log('Package removed from the white list.');
            }

            process.exit(0);
        });
    });
});


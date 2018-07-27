var crypto = require("crypto");
var request = require("request");
var agent = require("superagent");
var mongoose = require("mongoose");
var UserModel = require('../models/user').UserModel;
var secrets = require("./secrets");
// PackageManager node version doesn't support node_mailer.
//let nodemailer = require('nodemailer');

// function smtpTransport() {
//     return nodemailer.createTransport({
//         service: 'Mailgun',
//         auth: {
//             user: secrets.mailgun.login,
//             pass: secrets.mailgun.password
//         }
//     });
// }

//this not used.
var cache = {};

/** 
 * Invoked for any POST or PUT request
 *
 */
exports.postPut = function(req, res, next){
	if (req.method != "GET") cache = {};
	next();
};

/**
 * This function sends slack notification.
 * @param {*} message 
 */
function sendSlackNotification(message) {
    var url = secrets.mailgun.slackWebhook;
    var data = 'payload=' + JSON.stringify({
        "text": message
    });

    agent.post(url)
        .set('accept', 'json')
        .send(data)
        .end(function (error, res) {
            if (error) console.log(error);
        }.bind(this));
}

/**
 * This function sends email notification
 * @param {*} message 
 */
function sendNotification(message) {
    sendSlackNotification(message);
    // MailGun sometimes doesn't work.
    // smtpTransport().sendMail({
    //     from: "GDPR request",
    //     to: secrets.mailgun.email
    //     subject: "GDPR Package Manager delete request",
    //     text: message
    // }, function (err) {
    //     if (err) {
    //         console.log("error in sending mail", err);
    //     }
    // });
}

/**
 * This function updates the GDPR task. Email / Slack notifications are 
 * sent incase of any error.
 * @param {*} req 
 */
function updateGDPRTask(req, res) {
    var taskId = req.body.payload.taskId;
    var userInfo = req.body.payload.user_info;
    var ret = {};
    ret.statusCode = 200;
    ret.body = {
        taskId: taskId,
        status: {
            code: "success",
            type: "no_data",
            description: "User doesn't exist in this product."
        }
    };

    //use client id and secret and get the access token
    var headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    var body = {
        grant_type: 'client_credentials',
        client_id: secrets.forge.client_id,
        client_secret: secrets.forge.client_secret,

    };

    var paramsBody = [];
    for (var key in body) {
        if (body.hasOwnProperty(key)) {
            paramsBody.push(key + '=' + body[key]);
        }
    }
    var authUrl = secrets.forge.auth_url;
    request({
        headers: headers,
        uri: authUrl,
        body: paramsBody.join('&'),
        method: 'POST'
    }, function (err, response, body) {
        var resp;
        try {
            resp = JSON.parse(body);
        } catch (e) {
            resp = body;
        }
        if (!err && response.statusCode === 200) {
            var updateUrl = secrets.forge.update_url;
            agent.post(updateUrl)
                .set('Authorization', 'Bearer ' + resp.access_token)
                .set('accept', 'json')
                .send(ret.body)
                .end(function (error, res) {
                    if (res.statusCode != 200) {
                        sendNotification("GDPR Package Manager TaskId  " + taskId + " Update Failed ", res.text);
                    }
                }.bind(this));
        } else {
            if (err) {
                console.log("error", err);
                res.send(err);
                res.end();
            }
        }
    });
}

/**
 * This function handles the incoming GDPR request
 * @param {*} req TaskID is embedeed inside the request object
 * @param {*} res 
 */
exports.handleGDPRRRequest = function (req, res) {
    var userInfo = req.body.payload.user_info;
    const ret = {
        isBase64Encoded: false,
        statusCode: 500,
        body: ""
    }
    const secret = secrets.forge.gdpr_id;
    //check whether the hash matches. Ignore the request if 
    //has does not match.
    const hash = 'sha1hash=' +
        crypto.createHmac('sha1', secret)
            .update(JSON.stringify(req.body))
            .digest('hex');

    if (req.headers['x-adsk-signature'] == hash) {
        //check the user info in the database.
        UserModel.findOne({ email: userInfo.email }, function (err, user) {
            if (err) {
                console.log("error in finding the user", err);
                res.send(err);
            }
            //if the user is not found, then update the GDPR task
            if (!user) {
                console.log("user not found");
                updateGDPRTask(req, res);
                res.send({statusCode: 200});
            }
            //Send email / slack notifications for valid users
            else {
                var taskId = req.body.payload.taskId;
                var message = "GDPR Package Manager : Delete request for the task " + taskId;
                sendNotification(message);
                res.send({statusCode: 200});
            }
        });
    }
}

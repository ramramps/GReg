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
exports.postPut = function (req, res, next) {
    if (req.method != "GET") cache = {};
    next();
};

/**
 * This function sends slack notification.
 * @param {*} message 
 */
function sendSlackNotification(message, testMode) {
    var url = secrets.mailgun.slackWebhook;
    var data = 'payload=' + JSON.stringify({
        "text": message
    });
    if (testMode) {

        console.log("SlackMessage:", data);
        return;
    }
    agent.post(url)
        .set('accept', 'json')
        .send(data)
        .end(function (error, res) {
            if (error) console.log(error);
        }.bind(this));
}

/**
 * This function sends notifications to notification channels
 * @param {*} message - message to send
 * @param {*} testMode - logs instead of sending out real notifications.

 */
function sendNotification(message, testMode) {
    sendSlackNotification(message, testMode);
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
 * @param {*} req - original webhook request
 * @param {*} res - response to send
 * @param {*} testMode - in testMode this function does not make actual requests. 

 */
function updateGDPRTask(req, res, testMode) {
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
    var updateUrl = secrets.forge.update_url;

    //don't make the request in testmode.
    if (testMode) {
        console.log("testMode: calling update GDPR task, payload:")
        console.log('body:', ret.body);
        console.log('uri:', updateUrl);
        return;
    }

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
 * This function handles the incoming GDPR request - if in test mode this function
 * won't actually update tasks or post to slack.
 * @param {*} req TaskID is embedded inside the request object's body.payload
 * @param {*} res - response back to caller of the webhook
 */
exports.handleGDPRRRequest = function (req, res) {
    var testMode = process.env.NODE_ENV == "test" ? true : false

    var userInfo = req.body.payload.user_info;
    const secret = secrets.forge.gdpr_id;
    //check whether the hash matches. Ignore the request if 
    //has does not match.
    const hash = 'sha1hash=' +
        crypto.createHmac('sha1', secret)
            .update(JSON.stringify(req.body))
            .digest('hex');

    // if user email or id is valid and signature is valid then try to find user.
    if ((userInfo.email != "" || userInfo.oxygen_id != "") && req.headers['x-adsk-signature'] == hash) {
        // check the user info in the database. - but ignore empty strings that might match.
        // we don't want to match another user with an empty string for id or email for example.
        let email = userInfo.email == "" ? "INVALID" : userInfo.email;
        let oxygen_id = userInfo.id == "" ? "INVALID" : userInfo.id;

        UserModel.findOne({ $or: [{ email: email }, { oxygen_id: oxygen_id }] }, function (err, user) {
            if (err) {
                console.log("error in finding the user", err);
                res.send(err);
            }
            //if the user is not found, then update the GDPR task
            if (!user) {
                console.log("user not found");
                updateGDPRTask(req, res,testMode);
                res.status(200).send("Task updated");
            }
            //Send email / slack notifications for valid users
            else {
                var taskId = req.body.payload.taskId;
                var message = "GDPR Package Manager : Delete request for the task " + taskId;
                sendNotification(message,testMode);
                res.send({ statusCode: 200 });
            }
        });
    }
    //if both email and ox id are empty, we assume this is not a real user and close the task.
    else if (userInfo.email == "" && userInfo.id == "" && req.headers['x-adsk-signature'] == hash) {
        updateGDPRTask(req, res,testMode);
        res.status(200).send("Task updated");
    }
    else {
        console.log(hash);
        console.log("sending 403 - invalid hash ");
        res.status(403).send("Not called from webhook service, invalid hash");
    }
}

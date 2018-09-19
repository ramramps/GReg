
process.env.NODE_ENV = 'test';

var request = require('supertest')
    , app = require('../app.js')
    , mocha = require('mocha')
    , request = request(app)
    , user = require('../lib/users.js')
    , sinon = require("sinon")
    , gdprHandler = require('../lib/gdpr.js')
    , crypto = require('crypto')
    , assert = require('assert')
    , secrets = require("../lib/secrets.js");



function generateHash(data) {
    const secret = secrets.forge.gdpr_id;
    //check whether the hash matches. Ignore the request if 
    //has does not match.
    const hash = 'sha1hash=' +
        crypto.createHmac('sha1', secret)
            //pass utf-8 explicitly as the default encoding changed in node >6.x
            .update(JSON.stringify(data), 'utf8')
            .digest('hex');
    return hash;
}

function generateRandomTask(status) {
    return {
        "status": status,
        "description": "",
        "number": "aTaskId" + getRandId(),
        "user_type": "individual",
        "request_type": "gdpr.delete",
        "request_number": "aRequestNumber",
        "client_id": "aClientID",
        "created_date": "2018-07-27 18:15:12",
        "notify_date": "2018-07-27 18:15:14",
        "user_o2_id": "AnOxygenID" + getRandId(),
        "user_name": "auser" + getRandId(),
        "user_email": "auser" + getRandId() + "@gmail.com",
        "app_name": "Some Application"
    }
}

function getRandId() {
    const id = crypto.randomBytes(16).toString("hex");
    return id;
}

/**
 * Constructor of webhook endpoint test task payload.
 * @param {*} task a task object
 * @param {*} authDetails endpoint and auth details for a product
 */
function constructMockWebhookPayload(task, authDetails) {
    var date = "aStableDate";
    var payload = {
        'version': 1,
        'hook': {
            'eventType': task['request_type'],
            'hookId': 'GDPR Notification System',
            'clientID': authDetails.client_id,
            'webhookEndpoint': authDetails.webhook_endpoint,
            'createdDate': date,
        },
        'payload': {
            'version': 1,
            'taskId': task['number'],
            'user_info': {
                'id': task['user_o2_id'],
                'email': task['user_email'],
                'name': task['user_name']
            },
            'callbackUrl': authDetails.callback_url,
            'respondBy': date,
            'status': task['status']
        }
    };
    return payload
}

describe('POST /gdprDeleteRequest', function () {


    it('should respond with 403 for inconsistent hash signature', function (done) {
        var task = generateRandomTask();

        var name = task.user_name;
        var email = task.user_email;
        var id = task.user_o2_id;
        //generate test user.
        user.initDebugUser(name, email, id, () => {
            var authDetails = {
                webhook_endpoint: "gdprDeleteRequestHandler",
                client_id: "a client id",
                callback_url: "updateTaskURL"
            };
            var signature = "INCORRECT_SIGNATURE";
            var testWebhookPayload = constructMockWebhookPayload(task, authDetails);

            request
                .post('/gdprDeleteRequest')
                .set('x-adsk-signature', signature)
                .send(testWebhookPayload)
                .expect(403, done);

        });


    });

    it('should not return 403 if user_email or name includes non ASCII characters', function (done) {

        var task = generateRandomTask();
        task.user_email = "ЕЀЁName@gmail.com";
        task.user_name = "ЕЀЁName";
        task.user_o2_id = "aStableID";
        task.number = "aStableID"

        var name = task.user_name;
        var email = task.user_email;
        var id = task.user_o2_id;
        //generate test user.
        user.initDebugUser(name, email, id, () => {

            var authDetails = {
                webhook_endpoint: "gdprDeleteRequestHandler",
                client_id: "a client id",
                callback_url: "updateTaskURL"
            };
            var signature = "sha1hash=90ec17a14d60deb97e0c1323133a7d5cfb0da03d";
            var testWebhookPayload = constructMockWebhookPayload(task, authDetails);

            request
                .post('/gdprDeleteRequest')
                .set('x-adsk-signature', signature)
                .send(testWebhookPayload)
                .expect("GDPR Package Manager : Delete request for the task " + task.number)
                .expect(200, done);
        });

    });

    it('should respond with 200 and open task if user has email and oxygen id and is found', function (done) {

        var task = generateRandomTask();
        task.user_email = "aValidEmail@gmail.com";
        task.user_name = "aValidName";
        task.user_o2_id = "ao2StableID";
        task.number = "aStableID"

        var name = task.user_name;
        var email = task.user_email;
        var id = task.user_o2_id;
        //generate test user.
        user.initDebugUser(name, email, id, () => {

            var authDetails = {
                webhook_endpoint: "gdprDeleteRequestHandler",
                client_id: "a client id",
                callback_url: "updateTaskURL"
            };
            var testWebhookPayload = constructMockWebhookPayload(task, authDetails);
            var signature = generateHash(testWebhookPayload);

            request
                .post('/gdprDeleteRequest')
                .set('x-adsk-signature', signature)
                .send(testWebhookPayload)
                .expect("GDPR Package Manager : Delete request for the task " + task.number)
                .expect(200, done);
        });
    });

    it('should close task if user is not in database', function (done) {

        var task = generateRandomTask();
        task.user_email = "aValidEmail@gmail.com";
        task.user_name = "aValidName";
        task.user_o2_id = "ao2StableID";
        task.number = "aStableID"

        var name = task.user_name;
        var email = task.user_email;
        var id = task.user_o2_id;
        //make sure test user is gone.
        user.cleanupDebugUser(name, () => {
            var authDetails = {
                webhook_endpoint: "gdprDeleteRequestHandler",
                client_id: "a client id",
                callback_url: "updateTaskURL"
            };
            var testWebhookPayload = constructMockWebhookPayload(task, authDetails);
            var signature = generateHash(testWebhookPayload);

            request
                .post('/gdprDeleteRequest')
                .set('x-adsk-signature', signature)
                .send(testWebhookPayload)
                .expect("Task updated")
                .expect(200, done);
        });



    });

   it(`should close task if user is not in database even
     if they have empty email and db contains another user with empty email`, function (done) {

            var task = generateRandomTask();
            task.user_email = "";
            task.user_name = "aValidName";
            task.user_o2_id = "ao2StableID";
            task.number = "aStableID"

            var name = task.user_name;
            var email = task.user_email;
            var id = task.user_o2_id;

            //make sure test user is gone.
            user.cleanupDebugUser(name, () => {
                user.initDebugUser("anotherUser", "", "anotherUserId", () => {
                    var authDetails = {
                        webhook_endpoint: "gdprDeleteRequestHandler",
                        client_id: "a client id",
                        callback_url: "updateTaskURL"
                    };
                    var testWebhookPayload = constructMockWebhookPayload(task, authDetails);
                    var signature = generateHash(testWebhookPayload);

                    request
                        .post('/gdprDeleteRequest')
                        .set('x-adsk-signature', signature)
                        .send(testWebhookPayload)
                        .expect("Task updated")
                        .expect(200, done);
                });
            });
        });

    it(`should close task if user is not in database even
    if they have empty o2-id and db contains another user with empty o2-id`, function (done) {

            var task = generateRandomTask();
            task.user_email = "aValidEmail@gmailcom";
            task.user_name = "aValidName";
            task.user_o2_id = "";
            task.number = "aStableID"

            var name = task.user_name;
            var email = task.user_email;
            var id = task.user_o2_id;

            //make sure test user is gone.
            user.cleanupDebugUser(name, () => {
                user.initDebugUser("anotherUser", "anotherEmail", "", () => {
                    var authDetails = {
                        webhook_endpoint: "gdprDeleteRequestHandler",
                        client_id: "a client id",
                        callback_url: "updateTaskURL"
                    };
                    var testWebhookPayload = constructMockWebhookPayload(task, authDetails);
                    var signature = generateHash(testWebhookPayload);

                    request
                        .post('/gdprDeleteRequest')
                        .set('x-adsk-signature', signature)
                        .send(testWebhookPayload)
                        .expect("Task updated")
                        .expect(200, done);
                });
            });
        });






    it('should respond with 200 and close task if user has empty email and o2-id', function (done) {

        var task = generateRandomTask();
        task.user_email = "";
        task.user_name = "aValidName";
        task.user_o2_id = "";
        task.number = "aStableID"

        var name = task.user_name;
        var email = task.user_email;
        var id = task.user_o2_id;

        //make sure test user is gone.
        user.cleanupDebugUser(name, () => {
            var authDetails = {
                webhook_endpoint: "gdprDeleteRequestHandler",
                client_id: "a client id",
                callback_url: "updateTaskURL"
            };
            var testWebhookPayload = constructMockWebhookPayload(task, authDetails);
            var signature = generateHash(testWebhookPayload);

            request
                .post('/gdprDeleteRequest')
                .set('x-adsk-signature', signature)
                .send(testWebhookPayload)
                .expect("Task updated")
                .expect(200, done);
        });
    });

    it('should respond with 200 and close task if user has empty email and o2-id and another user is in db with empty data', function (done) {

        var task = generateRandomTask();
        task.user_email = "";
        task.user_name = "aValidName";
        task.user_o2_id = "";
        task.number = "aStableID"

        var name = task.user_name;
        var email = task.user_email;
        var id = task.user_o2_id;

        //make sure test user is gone.
        user.cleanupDebugUser(name, () => {
            user.initDebugUser("anotherUser", "", "", () => {
                var authDetails = {
                    webhook_endpoint: "gdprDeleteRequestHandler",
                    client_id: "a client id",
                    callback_url: "updateTaskURL"
                };
                var testWebhookPayload = constructMockWebhookPayload(task, authDetails);
                var signature = generateHash(testWebhookPayload);

                request
                    .post('/gdprDeleteRequest')
                    .set('x-adsk-signature', signature)
                    .send(testWebhookPayload)
                    .expect("Task updated")
                    .expect(200, done);
            });
        });

    });

});

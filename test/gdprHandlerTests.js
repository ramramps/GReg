
process.env.NODE_ENV = 'test';

var request = require('supertest')
    , app = require('../app.js')
    , mocha = require('mocha')
    , request = request(app)
    , user = require('../lib/users.js')
    , sinon = require("sinon")
    , gdprHandler = require('../lib/gdpr.js')
    , crypto = require('crypto')
    , assert = require('assert');


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
        user.initDebugUser(name, email, id);

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
        user.initDebugUser(name, email, id);

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
            .expect(200, done);

    });

    it('should respond with 200 and open task if user has email and oxygen id and is found', function () {


    });

    it('should close task if user is not in database', function () {


    });

    it('should close task if user is not in database even if they have empty email', function () {


    });

    it('should close task if user is not in database even if they have empty o2-id', function () {


    });


    it('should respond with 200 and open task if user has email and oxygen id', function () {


    });

});

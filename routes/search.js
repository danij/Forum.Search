var express = require('express');
var pg = require('pg');

var router = express.Router();

var pool = new pg.Pool();

var maxResults = parseInt(process.env.MAXRESULTS || '25');
var prefix = process.env.RESPONSE_PREFIX || 'while(1);';
var oneRequestPerIPEveryMilliseconds = 1000;

var latestRequestPerIp = {};

function isRequestAllowed(req) {

    var now = (new Date).getTime();
    var ip = req.headers['x-forwarded-for'];

    var previousRequestAt = latestRequestPerIp[ip] || 0;
    latestRequestPerIp[ip] = now;

    return (now - previousRequestAt) > oneRequestPerIPEveryMilliseconds;
}

function sendReplyWithPrefix(res, data) {

    res.statusCode = 200;
    res.send(prefix + JSON.stringify(data));
}

function executeQuery(query, parameters, resCallback, errCallback) {

    pool.connect(function (err, client, done) {

        if (err) {

            errCallback(err);
        }
        else if (client) {

            client.query(query, parameters, function (err, res) {

                if (err) {

                    errCallback(err);
                }
                else {

                    resCallback(res);
                }
                done();
            });
        }
    });
}

function performSearch(req, res, query, outputName) {

    if ( ! isRequestAllowed(req)) {

        res.statusCode = 429;
        res.send('Throttled');
    }

    var toSearch = (req.query['q'] || '').trim();
    if (toSearch.length < 1) {

        res.statusCode = 400;
        res.send('Query should not be empty');
    }

    executeQuery(query, [toSearch], function (queryResult) {

        var result = {};
        var output = result[outputName] = [];

        for (var i = 0; i < queryResult.rowCount; ++i) {

            output.push(queryResult.rows[i].id);
        }
        sendReplyWithPrefix(res, result);

    }, function() {

        res.statusCode = 500;
        res.send('Error executing the query');
    });

}

router.get('/threads', function (req, res, next) {

    var query = 'SELECT id FROM threads \n' +
        'WHERE plainto_tsquery($1) @@ name\n' +
        'ORDER BY ts_rank(name, plainto_tsquery($1)) DESC\n' +
        'LIMIT ' + maxResults;

    performSearch(req, res, query, 'thread_ids');
});

router.get('/thread_messages', function (req, res, next) {

    var query = 'SELECT id FROM thread_messages \n' +
        'WHERE plainto_tsquery($1) @@ content\n' +
        'ORDER BY ts_rank(content, plainto_tsquery($1)) DESC\n' +
        'LIMIT ' + maxResults;

    performSearch(req, res, query, 'thread_message_ids');
});

module.exports = router;

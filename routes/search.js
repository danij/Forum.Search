const express = require('express');
const router = express.Router();
const pg = require('pg');

const pool = new pg.Pool();

const maxResults = parseInt(process.env.MAXRESULTS || '25');
const prefix = process.env.RESPONSE_PREFIX || 'while(1);';
const oneRequestPerIPEveryMilliseconds = 1000;

const latestRequestPerIp = {};

function isRequestAllowed(req) {

    const now = (new Date).getTime();
    const ip = req.headers['x-forwarded-for'];

    const previousRequestAt = latestRequestPerIp[ip] || 0;
    latestRequestPerIp[ip] = now;

    return (now - previousRequestAt) > oneRequestPerIPEveryMilliseconds;
}

function sendReplyWithPrefix(res, data) {

    try {

        res.statusCode = 200;
        res.send(prefix + JSON.stringify(data));
    }
    catch(e) {
        //do nothing
    }
}

function executeQuery(query, parameters, resCallback, errCallback) {

    pool.connect((err, client, done) => {

        if (err) {

            errCallback(err);
        }
        else if (client) {

            client.query(query, parameters, (err, res) => {

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
        return;
    }

    const toSearch = (req.query['q'] || '').trim();
    if (toSearch.length < 1) {

        res.statusCode = 400;
        res.send('Query should not be empty');
        return;
    }

    executeQuery(query, [toSearch], (queryResult) => {

        const result = {};
        const output = result[outputName] = [];

        for (var i = 0; i < queryResult.rowCount; ++i) {

            output.push(queryResult.rows[i].id);
        }
        sendReplyWithPrefix(res, result);

    }, () => {

        res.statusCode = 500;
        res.send('Error executing the query');
    });
}

router.get('/threads', (req, res, next) => {

    const query = 'SELECT id FROM threads \n' +
        'WHERE plainto_tsquery($1) @@ name\n' +
        'ORDER BY ts_rank(name, plainto_tsquery($1)) DESC\n' +
        'LIMIT ' + maxResults;

    performSearch(req, res, query, 'thread_ids');
});

router.get('/thread_messages', (req, res, next) => {

    const query = 'SELECT id FROM thread_messages \n' +
        'WHERE plainto_tsquery($1) @@ content\n' +
        'ORDER BY ts_rank(content, plainto_tsquery($1)) DESC\n' +
        'LIMIT ' + maxResults;

    performSearch(req, res, query, 'thread_message_ids');
});

module.exports = router;

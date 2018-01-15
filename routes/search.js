var express = require('express');
var pg = require('pg');

var router = express.Router();

var pool = new pg.Pool();

var maxResults = 100;

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

router.get('/threads', function (req, res, next) {

    var query = 'SELECT id FROM threads \n' +
        'WHERE phraseto_tsquery($1) @@ name\n' +
        'ORDER BY ts_rank(name, phraseto_tsquery($1)) DESC\n' +
        'LIMIT ' + maxResults;

    var toSearch = (req.query['q'] || '').trim();
    if (toSearch.length < 1) {

        res.statusCode = 400;
        res.send('Query should not be empty');
    }

    executeQuery(query, [toSearch], function (queryResult) {

        var result = {
            thread_ids: []
        };

        for (var i = 0; i < queryResult.rowCount; ++i) {

            result.thread_ids.push(queryResult.rows[i].id);
        }
        res.send(result);

    }, function() {

        res.statusCode = 500;
        res.send('Error executing the query');
    });
});

router.get('/thread_messages', function (req, res, next) {

    var query = 'SELECT id FROM thread_messages \n' +
        'WHERE phraseto_tsquery($1) @@ content\n' +
        'ORDER BY ts_rank(content, phraseto_tsquery($1)) DESC\n' +
        'LIMIT ' + maxResults;

    var toSearch = (req.query['q'] || '').trim();
    if (toSearch.length < 1) {

        res.statusCode = 400;
        res.send('Query should not be empty');
    }

    executeQuery(query, [toSearch], function (queryResult) {

        var result = {
            thread_message_ids: []
        };

        for (var i = 0; i < queryResult.rowCount; ++i) {

            result.thread_ids.push(queryResult.rows[i].id);
        }
        res.send(result);

    }, function() {

        res.statusCode = 500;
        res.send('Error executing the query');
    });
});

module.exports = router;

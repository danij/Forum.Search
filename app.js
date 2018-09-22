const express = require('express');
const logger = require('morgan');

const search = require('./routes/search');

const app = express();

app.use(logger('common'));

app.use('/', search);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // only provide error in development
    res.status(err.status || 500);
    res.send(req.app.get('env') === 'development' ? err : 'error');
});

app.disable('x-powered-by');

module.exports = app;

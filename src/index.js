'use strict';

import config from './config'
import logger from './utils/logger'
import express from 'express'
import controllers from './controllers'
import bodyParser from 'body-parser'

const log = logger.child({module: 'index'});
const app = express();
const apiRouter = express.Router();
controllers.init(apiRouter);

//bind api routes
app.use('/v1', bodyParser.json(), bodyParser.urlencoded({ extended:true }), apiRouter);
//bind a sample html page demonstrating how a client can obtain a ws connection
app.use(express.static(__dirname + '/public'));

app.listen(config.port);
log.info('start listening on port %s', config.port);

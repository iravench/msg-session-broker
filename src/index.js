'use strict';

import config from './config'
import logger from './utils/logger'
import express from 'express'
import controllers from './controllers'
import bodyParser from 'body-parser'

import repo_impl from './implementations/repo_impl';
import repo_factory from './repo_factory';
import fm_token_factory from './fm_token_factory';
import fm_token_impl from './implementations/fm_token_impl';
import fm_policy_factory from './fm_policy_factory';
import fm_selector_factory from './fm_selector_factory';

const repo = repo_factory({ impl: repo_impl });
const fm_policy = fm_policy_factory({ repo: repo });
const fm_token = fm_token_factory({ impl: fm_token_impl });
const fm_selector = fm_selector_factory({ repo: repo, policy: fm_policy, token: fm_token });
const log = logger.child({module: 'index'});

const app = express();
app.locals.fm_selector = fm_selector;
const apiRouter = express.Router();
controllers.init(apiRouter);
app.use('/v1', bodyParser.json(), bodyParser.urlencoded({ extended:true }), apiRouter);

//a sample html page demonstrating how a client can obtain a ws connection
app.use(express.static(__dirname + '/public'));

app.listen(config.port);
log.info('start listening on port %s', config.port);

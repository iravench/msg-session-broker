#!/bin/bash
set -e

# install dev dependencies for running tests
npm install

# run unit tests
npm run test

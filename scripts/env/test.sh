#!/bin/bash

export NODE_ENV="test"

# Execute the commands passed to this script
# e.g. "./env.sh node server.js
exec "$@"

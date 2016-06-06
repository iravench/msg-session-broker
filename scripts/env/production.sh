#!/bin/bash

export NODE_ENV="production"

# Execute the commands passed to this script
# e.g. "./env.sh node server.js
exec "$@"

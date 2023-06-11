#!/bin/bash

# We create symlinks of the already installed node_modules and package-lock.json

# Start the app, have fun
yarn prisma-init
yarn prisma db seed

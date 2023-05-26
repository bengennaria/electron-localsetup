#!/usr/bin/env node
'use strict'


/**
 * Modules
 * External
 * @constant
 */
const logger = require('@bengennaria/logger')({ timestamp: false })

/**
 * Modules
 * Internal
 * @constant
 */
const setupApplicationLocally = require('./lib/setup-application-locally')
const runBuild = require('./lib/run-build')


/**
 * Main
 * @namespace process.env
 */
if (require.main === module) {
    // DEBUG
    logger.debug('npm_config_build', process.env.npm_config_build)

    /**
     * Build externally
     */
    if (process.env.npm_config_build) {
        runBuild()
    }

    /**
     * Start local application setup
     */
    setupApplicationLocally((error) => {
        if (error) {
            logger.error(error)
            process.exit(1)
        }

        process.exit(0)
    })
}

#!/usr/bin/env node
'use strict'


/**
 * Modules
 * External
 * @constant
 */
const logger = require('@bengennaria/logger')({ timestamp: false })
const minimist = require('minimist')

/**
 * Modules
 * Internal
 * @constant
 */
const setupApplicationLocally = require('./lib/setup-application-locally')
const runBuild = require('./lib/run-build')


/**
 * Main
 * @namespace process.env.npm_config_argv.original
 */
if (require.main === module) {
    /**
     * Parse Arguments
     */
    let argv

    try {
        argv = minimist(JSON.parse(process.env.npm_config_argv).original, {
            'boolean': [
                'build'
            ],
            'unknown': () => { return false }
        })
    } catch (error) {
        logger.error('could not parse arguments', error)
    }

    /**
     * Resolve Arguments
     */

    // --build
    let argvBuild = argv['build']

    // DEBUG
    logger.debug('argv', argv)

    /**
     * Build externally
     */
    if (argvBuild) {
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

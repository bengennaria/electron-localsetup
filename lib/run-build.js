#!/usr/bin/env node
'use strict'


/**
 * Modules
 * Node
 * @constant
 */
const childProcess = require('child_process')
const path = require('path')

/**
 * Modules
 * External
 * @constant
 */
const appRootPath = require('app-root-path')['path']
const jsonfile = require('jsonfile')
const logger = require('@sidneys/logger')({ timestamp: false })
const tryRequire = require('try-require')


/**
 * Filesystem
 * @constant
 */
const packageJsonFilePath = path.join(appRootPath, 'package.json')

/**
 * Path to default build command
 * @default
 */
const defaultBuildCommand = tryRequire.resolve('@sidneys/electron-build')


/**
 * Trigger & wait for external build processes
 */
let runBuild = () => {
    logger.debug('runBuild')

    // Parse package.json
    const packageJsonCurrent = jsonfile.readFileSync(packageJsonFilePath)

    // Read build command executed by "npm run-script build" from package.json, Fallback to default
    const buildCommand = packageJsonCurrent.scripts.build || defaultBuildCommand

    // Execute build command
    childProcess.execSync(String(buildCommand), { cwd: appRootPath, stdio: [ 0, 1, 2 ] })
}


/**
 * @exports
 */
module.exports = runBuild

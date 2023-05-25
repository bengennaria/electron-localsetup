#!/usr/bin/env node
'use strict'


/**
 * Modules
 * Node
 * @constant
 */
const childProcess = require('child_process')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')

/**
 * Modules
 * External
 * @constant
 */
const appRootPath = require('app-root-path')['path']
const fkill = require('fkill')
const globby = require('globby')
const isDebug = require('@bengennaria/is-env')('debug')
const jsonfile = require('jsonfile')
const logger = require('@bengennaria/logger')({ timestamp: false })
const platformTools = require('@bengennaria/platform-tools')

/**
 * Filesystem
 * @constant
 */
const packageJsonFilePath = path.join(appRootPath, 'package.json')

/**
 * @typedef {Object} packageJson
 * @property {string} author
 * @property {string} author.name
 * @property {string} build
 * @property {string} build.directories
 * @property {string} build.productName
 * @property {string} name
 * @property {string} productName
 * @property {string} version
 */


/**
 * Launch applications in DEBUG Mode
 * @default
 * @global
 */
let startInDebug = isDebug


/**
 * Install & Launch Application on local Operating System
 * @param {function=} callback - Callback
 */
let setupApplicationLocally = (callback = () => {}) => {
    // Persist Debug Environment Variable
    if (startInDebug === true) {
        process.env.DEBUG = true
    }

    // Parse package.json
    const packageJsonCurrent = jsonfile.readFileSync(packageJsonFilePath)

    // Get build settings, application metadata
    const buildOutputDirectory = path.join(appRootPath, packageJsonCurrent.build.directories.output)
    const appProductName = packageJsonCurrent.build.productName || packageJsonCurrent.productName || packageJsonCurrent.name
    const appName = packageJsonCurrent.name
    const appVersion = packageJsonCurrent.version

    // DEBUG
    logger.debug('buildOutputDirectory', buildOutputDirectory)
    logger.debug('appProductName', appProductName)
    logger.debug('appName', appName)
    logger.debug('appVersion', appVersion)

    /**
     * macOS
     */
    if (platformTools.isMacOS) {
        // Filesystem
        const buildOutputSubdirectory = path.normalize(path.join(buildOutputDirectory, 'mac'))
        const applicationFilePathList = globby.sync(`${appProductName}*.app`, { absolute: true, cwd: buildOutputSubdirectory, onlyFiles: false })
        const installationDirectory = path.resolve('/Applications')

        // DEBUG
        logger.debug('[macos]', 'buildOutputSubdirectory', buildOutputSubdirectory)
        logger.debug('[macos]', 'applicationFilePathList', applicationFilePathList.join())
        logger.debug('[macos]', 'installationDirectory', installationDirectory)

        // Validate
        if (applicationFilePathList.length === 0) {
            callback(new Error(`macOS: no application found at ${buildOutputDirectory}`))
            return
        }

        // Pick application executable, determine installation target path
        const applicationFilePath = applicationFilePathList[0]
        const installationFilePath = path.join(installationDirectory, path.basename(applicationFilePath))

        // DEBUG
        logger.debug('[macos]', 'applicationFilePath', applicationFilePath)
        logger.debug('[macos]', 'installationFilePath', installationFilePath)

        // Close application
        logger.info('Closing application', appProductName)
        fkill(appProductName, { force: true })

        // Uninstall application
        logger.info('Uninstalling application', installationFilePath)
        fs.removeSync(installationFilePath)

        // Install application
        logger.info('Installing application', installationFilePath)
        fs.copySync(applicationFilePath, installationFilePath, { overwrite: true })

        // Launch application
        logger.info('Launching application', installationFilePath)
        childProcess.execSync(`open "${installationFilePath}"`)
    }

    /**
     * Linux
     */
    if (platformTools.isLinux) {
        let architecture

        // Resolve CPU Architecture
        switch (os.arch()) {
            case 'arm7l':
                architecture = 'arm'
                break
            case 'x64':
                architecture = 'amd64'
                break
            case 'ia32':
                architecture = 'i386'
                break
        }

        // Filesystem
        const applicationFilePathList = globby.sync(`${appName}*${appVersion}*${architecture}*.deb`, { absolute: true, cwd: buildOutputDirectory, onlyFiles: true })
        const installationDirectory = path.resolve('/usr/local/bin')

        // DEBUG
        logger.debug('[linux]', 'architecture', architecture)
        logger.debug('[linux]', 'applicationFilePathList', applicationFilePathList.join())
        logger.debug('[linux]', 'installationDirectory', installationDirectory)

        // Validate
        if (applicationFilePathList.length === 0) {
            callback(new Error(`Linux: no application found at ${buildOutputDirectory}`))
            return
        }

        // Pick application executable, determine installation target path
        const applicationFilePath = applicationFilePathList[0]
        const installationFilePath = path.join(installationDirectory, appName)

        // DEBUG
        logger.debug('[linux]', 'applicationFilePath', applicationFilePath)
        logger.debug('[linux]', 'installationFilePath', installationFilePath)

        // Close application
        logger.info('Closing application', appProductName)
        fkill(appName, { force: true })

        // Install application
        logger.info('Installing application', installationFilePath)
        childProcess.execSync(`sudo dpkg --install --force-overwrite "${applicationFilePath}"`)

        // Launch application
        logger.info('Launching application', installationFilePath)
        let child = childProcess.spawn(installationFilePath, [], { detached: true, stdio: 'ignore' })
        child.unref()
    }

    /**
     * Windows
     */
    if (platformTools.isWindows) {
        // Filesystem
        const buildOutputSubdirectory = path.normalize(path.join(buildOutputDirectory, 'win'))
        const installerFilePathList = globby.sync(`${appProductName}*${appVersion}*.exe`, { absolute: true, cwd: buildOutputSubdirectory, onlyFiles: true })

        // DEBUG
        logger.debug('[windows]', 'buildOutputSubdirectory', buildOutputSubdirectory)
        logger.debug('[windows]', 'installerFilePathList', installerFilePathList.join())

        // Validate
        if (installerFilePathList.length === 0) {
            callback(new Error(`Windows: no installer found at ${buildOutputDirectory}`))
            return
        }

        // Pick application installer executable
        const installerFilePath = installerFilePathList[0]

        // DEBUG
        logger.debug('[windows]', 'installerFilePath', installerFilePath)

        // Close application
        logger.info('Closing application', appProductName)
        fkill(appProductName, { force: true })

        // Launch application installer
        logger.info('Launching application installer', installerFilePath)
        childProcess.execSync(`start "" "${installerFilePath}"`, { stdio: [ 0, 1, 2 ] })
    }


    // Callback
    callback()
}


/**
 * @exports
 */
module.exports = setupApplicationLocally

#!/usr/bin/env node

var helper = (function(){

    /**********************
     * Modules
     *********************/
    // Core
    var path = require('path');
    var fs = require('fs');
    var exec = require('child_process').exec;

    // lib
    var logger = require('../hooks/logger')();

    /**********************
     * Internal properties
     *********************/
    var helper = {};

    var PROJECT_CONFIG_XML_PATH = './spec/project/config.xml';
    var SOURCE_CONFIG_XML_PATH = './spec/config.xml';

    /**********************
     * Internal functions
     *********************/

    function readConfigXml (){
        return fs.readFileSync(path.resolve(PROJECT_CONFIG_XML_PATH), 'utf-8');
    }

    function writeConfigXml(fileContents){
        fs.writeFileSync(path.resolve(PROJECT_CONFIG_XML_PATH), fileContents, 'utf-8');
    }

    function copySync(sourcePath, targetPath){
        var contents = fs.readFileSync(sourcePath);
        fs.writeFileSync(targetPath, contents);
    }

    function copySyncRelative(sourcePath, targetPath){
        copySync(path.resolve(sourcePath), path.resolve(targetPath));
    }

    /************
     * Public API
     ************/

    helper.setupTestProject = function(onFinish){
        helper.restoreConfigXml();
        helper.runCordova("platform add android", function(err, stdout, stderr){
            if(stderr){
                console.error(stderr);
            }
            onFinish();
        });
    };

    helper.runCordova = function(args, onFinish){
        args = args || '';
        var command = "cordova " + args;
        exec(command, {
                cwd: path.resolve('./spec/project/')
            },
            function(err, stdout, stderr) {
                onFinish(err, stdout, stderr);
            }
        );
    };

    helper.restoreConfigXml = function () {
        copySyncRelative(SOURCE_CONFIG_XML_PATH, PROJECT_CONFIG_XML_PATH);
    };

    helper.addCommandToConfig = function(params){
        var configXml = readConfigXml();
        var command = '<command';
        for(var key in params){
            command += ' ' + key + '="' + params[key] + '"';
        }
        command += '/>';
        configXml = configXml.replace('</widget>', command+'\n</widget>');
        writeConfigXml(configXml);
    };

    helper.getFakeCordovaContext = function(){
        return {
            hook: 'jasmine',
            opts: {
                platforms: ['android', 'ios'],
                options: {argv: []},
                verbose: true,
                silent: false,
                browserify: false,
                fetch: false,
                nohooks: [],
                searchpath: undefined,
                save: false,
                projectRoot: path.resolve(),
                cordova: {platforms: {}, plugins: {}, version: '6.3.1'},
                plugin: {
                    id: 'cordova-plugin-config-command'
                }
            },
            cmdLine: '--debug --verbose'
        };
    };

    
    return helper;
})();

module.exports = function(){
    return helper;
};
#!/usr/bin/env node

/**********
 * Globals
 **********/
// Pre-existing Cordova npm modules
var deferral, path, cwd, fs, exec,
    xmldom, DOMParser, XMLSerializer;

// Local modules
var logger;

// Other globals
var hooksPath, currentHook;

var runCommands = (function(){

    /**********************
     * Internal properties
     *********************/
    var runCommands = {};

    var CONFIG_FILE_PATH = './config.xml';

    var commands = [];

    var debug = false;


    /*********************
     * Internal functions
     *********************/

    function complete(){
        logger.verbose("Finished running runCommands.js on "+currentHook);
        deferral.resolve();
    }

    function runNext(){
        if(commands.length === 0){
            logger.debug("All commands finished running on "+currentHook);
            return complete();
        }

        var el = commands.shift();

        var command, hook;
        var abort_on_error = false;
        var display_output = false;
        var args = '';

        var serializedCommand = XMLSerializer.serializeToString(el);

        // Command name
        if(el.hasAttribute('name')){
            command = el.getAttribute('name');
        }else{
            logger.log("'name' attribute is missing from <command> in config.xml: "+serializedCommand);
            return runNext();
        }

        // Hook
        if(el.hasAttribute('hook')){
            hook = el.getAttribute('hook');
        }else{
            logger.log("'hook' attribute is missing from <command> in config.xml: "+serializedCommand);
            return runNext();
        }

        if(currentHook !== hook){
            logger.debug("Skipping command: requested hook is '"+hook+"' - current hook is '"+currentHook+"'");
            return runNext();
        }

        // Abort on error
        if(el.hasAttribute('abort_on_error')){
            var val = el.getAttribute('abort_on_error');
            if(val === 'true' || val === '1'){
                abort_on_error = true;
                logger.debug("Command set to abort on error: "+serializedCommand);
            }
        }

        // Display output
        if(el.hasAttribute('display_output')){
            var val = el.getAttribute('display_output');
            if(val === 'true' || val === '1'){
                display_output = true;
                logger.debug("Command set to display command output: "+serializedCommand);
            }
        }

        // Args
        if(el.hasAttribute('args')){
            args = el.getAttribute('args');
        }

        // cwd
        var cwd = null;
        if(el.hasAttribute('cwd')){
            cwd = path.resolve(el.getAttribute('cwd'));
            logger.debug('cwd: '+cwd);
        }

        // Run command
        command = command + ' ' + args;
        logger.verbose("Running command on "+hook+": "+command);
        exec(command, {
            cwd: cwd
        }, function(err, stdout, stderr) {
            if(display_output || debug){
                if(stdout){
                    logger.debug('stdout:');
                    console.log(stdout);
                }
                if(stderr){
                    logger.debug('stderr:');
                    console.error(stderr);
                }
            }
            if(err){
                var details = "\ncommand: "+command
                    +"\nconfig: "+serializedCommand;

                if(abort_on_error){
                    logger.warn("Aborting due to command failure" + details);
                    process.exit(1);
                }else if(debug){
                    logger.error(err + ": "+details);
                }
            }
            return runNext();
        });
    }

    /*************
     * Public API
     *************/

    runCommands.init = function(){
        var configXml = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
        configXml = DOMParser.parseFromString(configXml);
        var commandEls = configXml.getElementsByTagName('command');

        if(commandEls.length === 0){
            logger.log("No commands found in config.xml");
            return complete();
        }

        for(var i=0; i<commandEls.length; i++){
            commands.push(commandEls[i]);
        }
        runNext();
    };

    runCommands.handleException = function (e){
        var msg = "FATAL EXCEPTION: ";
        msg += e.message;
        if(logger){
            logger.log(msg);
            logger.dump(e);
        }else{
            console.log(msg);
        }
        process.exit(1); // exit on fatal error
    };

    return runCommands;
})();

// Main
module.exports = function(ctx) {

    try{
        // Load modules
        deferral = ctx.requireCordovaModule('q').defer();
        fs = ctx.requireCordovaModule('fs');
        exec = ctx.requireCordovaModule('child_process').exec;
        path = ctx.requireCordovaModule('path');
        cwd = path.resolve();

        xmldom = ctx.requireCordovaModule('xmldom');
        DOMParser = new xmldom.DOMParser();
        XMLSerializer = new xmldom.XMLSerializer();

        hooksPath = path.resolve(ctx.opts.projectRoot, "plugins", ctx.opts.plugin.id, "hooks");
        logger = require(path.resolve(hooksPath, "logger.js"))(ctx);
        currentHook = ctx.hook;

        debug = !!ctx.cmdLine.match("--debug");

        logger.verbose("Running runCommands.js on "+currentHook);
        runCommands.init();
    }catch(e){
        runCommands.handleException(e);
    }

    return deferral.promise;
};
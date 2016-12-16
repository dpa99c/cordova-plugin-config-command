/**********
 * Modules
 **********/

// Core
var fs = require('fs');

var helper = require('./helper')();

//lib
var logger = require('../hooks/logger')();
logger.init(helper.getFakeCordovaContext());

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;


describe("A spec for cordova-plugin-config-command", function() {

    beforeAll(function(done) {
        helper.setupTestProject(done);
    });

    beforeEach(function() {
        helper.restoreConfigXml();
    });

    it("should report an error and continue if the 'name' attribute is missing", function(done) {
        helper.addCommandToConfig({
            hook: 'before_prepare',
            display_output: true
        });
        helper.addCommandToConfig({
            hook: 'before_prepare',
            name: 'echo foo',
            display_output: true
        });
        helper.runCordova('prepare', function(err, stdout, stderr){
            expect(err).toBeFalsy();
            expect(stdout).toContain("'name' attribute is missing from <command> in config.xml");
            expect(stdout.match("\nfoo")).toBeTruthy();

            done();
        });
    });

    it("should report an error and continue if the 'hook' attribute is missing", function(done) {
        helper.addCommandToConfig({
            name: 'echo foo',
            display_output: true
        });
        helper.addCommandToConfig({
            name: 'echo bar',
            hook: 'before_prepare',
            display_output: true
        });
        helper.runCordova('prepare', function(err, stdout, stderr){
            expect(err).toBeFalsy();
            expect(stdout).toContain("'hook' attribute is missing from <command> in config.xml");
            expect(stdout.match("\nfoo")).toBeFalsy();
            expect(stdout.match("\nbar")).toBeTruthy();
            done();
        });
    });

    it("should run the specified command on the specified hook", function(done) {
        helper.addCommandToConfig({
            name: 'echo foo',
            hook: 'before_prepare',
            display_output: true
        });
        helper.addCommandToConfig({
            name: 'echo bar',
            hook: 'before_plugin_ls',
            display_output: true
        });
        helper.runCordova('prepare', function(err, stdout, stderr){
            expect(stdout.match("foo")).toBeTruthy();
            expect(stdout.match("bar")).toBeFalsy();

            helper.runCordova('plugin ls', function(err, stdout, stderr){
                expect(stdout.match("foo")).toBeFalsy();
                expect(stdout.match("bar")).toBeTruthy();
                done();
            });
        });
    });

    it("should run apply the 'args' attribute as arguments to the command", function(done) {
        helper.addCommandToConfig({
            name: 'echo foo',
            args: 'bar',
            hook: 'before_prepare',
            display_output: true
        });
        helper.runCordova('prepare', function(err, stdout, stderr){
            expect(stdout.match("foo bar")).toBeTruthy();
            done();
        });
    });

    it("should unescape XML-escaped characters in the arguments", function(done) {
        helper.addCommandToConfig({
            name: 'echo &quot;foo&quot;',
            args: '&amp; echo &quot;bar&quot;',
            hook: 'before_prepare',
            display_output: true
        });
        helper.runCordova('prepare', function(err, stdout, stderr){
            expect(stdout.match('"foo"')).toBeTruthy();
            expect(stdout.match('"bar"')).toBeTruthy();
            done();
        });
    });


    it("should, by default, NOT abort if the 'abort_on_error' attribute is not specifed", function(done) {
        helper.addCommandToConfig({
            name: 'invalid_command',
            hook: 'before_prepare',
            display_output: true
        });
        helper.addCommandToConfig({
            name: 'echo foo',
            hook: 'before_prepare',
            display_output: true
        });
        helper.runCordova('prepare', function(err, stdout, stderr){
            expect(err).toBeFalsy();
            expect(stderr).toBeTruthy();
            expect(stdout.match('foo')).toBeTruthy();
            done();
        });
    });

    it("should NOT abort if the 'abort_on_error' attribute is 'false'", function(done) {
        helper.addCommandToConfig({
            name: 'invalid_command',
            hook: 'before_prepare',
            display_output: true,
            abort_on_error: false
        });
        helper.addCommandToConfig({
            name: 'echo foo',
            hook: 'before_prepare',
            display_output: true
        });
        helper.runCordova('prepare', function(err, stdout, stderr){
            expect(err).toBeFalsy();
            expect(stderr).toBeTruthy();
            expect(stdout.match('foo')).toBeTruthy();
            done();
        });
    });

    it("should abort if the 'abort_on_error' attribute is 'true'", function(done) {
        helper.addCommandToConfig({
            name: 'invalid_command',
            hook: 'before_prepare',
            display_output: true,
            abort_on_error: true
        });
        helper.addCommandToConfig({
            name: 'echo foo',
            hook: 'before_prepare',
            display_output: true
        });
        helper.runCordova('prepare', function(err, stdout, stderr){
            expect(err).toBeTruthy();
            expect(stderr).toBeTruthy();
            expect(stdout.match('foo')).toBeFalsy();
            done();
        });
    });

    it("should, by default, NOT display the command output if the 'display_output' attribute is not specifed", function(done) {
        helper.addCommandToConfig({
            name: 'echo foo',
            hook: 'before_prepare'
        });
        helper.runCordova('prepare', function(err, stdout, stderr){
            expect(stdout.match('foo')).toBeFalsy();
            done();
        });
    });


    it("should NOT display the command output if the 'display_output' attribute is 'false'", function(done) {
        helper.addCommandToConfig({
            name: 'echo foo',
            hook: 'before_prepare',
            display_output: false
        });
        helper.runCordova('prepare', function(err, stdout, stderr){
            expect(stdout.match('foo')).toBeFalsy();
            done();
        });
    });

    it("should display the command output if the 'display_output' attribute is 'true'", function(done) {
        helper.addCommandToConfig({
            name: 'echo foo',
            hook: 'before_prepare',
            display_output: true
        });
        helper.runCordova('prepare', function(err, stdout, stderr){
            expect(stdout.match('foo')).toBeTruthy();
            done();
        });
    });
});

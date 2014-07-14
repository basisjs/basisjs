#!/usr/bin/env node

var pap = require("posix-argv-parser");
var args = pap.create();
var v = pap.validators;
var fs = require('fs');

function replaceInFile(filename, rx, value){
  fs.writeFileSync(
    filename,
    fs.readFileSync(filename, 'utf-8').replace(rx, value),
    'utf-8'
  );
}

args.createOperand("version", {
    validators: [v.required()]
});

args.parse(process.argv.slice(2), function(errors, options) {
    if (errors) { return console.log(errors[0]); }

    var version = options.version.value;

    var sys = require('sys');
    var exec = require('child_process').exec;

    function check_not_exists(error, stdout, stderr) {
      if (stdout != ''){
        throw new Error('Version already exists');
      }
      exec("git stash", function(error, stdout, stderr){
        exec("git checkout -b " + version, function(error, stdout, stderr){
          console.log('Created new branch ' + version);
          replaceInFile('../src/basis.js', /(VERSION\s*=\s*(['"]))\d+\.\d+\.\d+\2/, '$1' + version + '$2');
          replaceInFile('../bower.json', /("version"\s*:\s*")\d+\.\d+\.\d+"/i, '$1' + version + '"');

          exec('git commit -am "init '+version+'"', function(error, stdout, stderr){
            console.log(stdout, stderr)
          });

          exec("git stash pop", function(error, stdout, stderr){
            exec("git status", function(error, stdout, stderr){});
          });
        });
      })
    }
    exec("git branch -a | grep " + version, check_not_exists );
});
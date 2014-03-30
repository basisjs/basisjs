#!/usr/bin/env python

import tempfile
import subprocess
import os
import json

BASIS_REPO = 'git@github.com:baitcode/basisjs.git'
PRECOMPILED_REPO = ''
CONFIG_DIR = 'scripts/configs/'
BASIS_REPO_TEMPLATE_NAME = 'https://github.com/basisjs/{repository}.git'

repo_root = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..')
)

bower_json_path = os.path.join(repo_root, 'bower.json')
print bower_json_path
with open(bower_json_path) as f:
    bower_conf = json.loads(f.read())
    version = bower_conf['version']

assert version, u'Cannot determine current release version. ' \
                u'Check your bower.json'

configs_dir = os.path.join(repo_root, CONFIG_DIR)
config_file_names = os.listdir(configs_dir)


def call(args, **kwargs):
    print u'EXCECUTING: ', u' '.join(args)
    print u'---------------------------------------------'
    subprocess.check_call(args, **kwargs)
    print u'---------------------------------------------'


def copy_built_files(output_script):
    global output_file_name, command, output_file_path, rename
    for output_file_name in os.listdir(output_location):
        command = ['cp']
        output_file_path = os.path.join(output_location, output_file_name)

        print 'Coping {}'.format(output_file_name)
        if os.path.isdir(output_file_path):
            command.append('-r')

        print output_file_name, html_file_name
        if output_file_name == html_file_name:
            continue

        rename = output_file_name
        if output_file_name == 'script.js':
            rename = output_script

        command.append(output_file_path)
        command.append(os.path.join(repository_location, rename))

        call(command)


for config_file_name in config_file_names:
    if not config_file_name.endswith('.json'):
        continue

    config_path = os.path.join(configs_dir, config_file_name)

    with open(config_path) as f:
        config = json.loads(f.read())
        output_location = tempfile.mkdtemp()


        repository = config['build'].get(
            'repository',
            BASIS_REPO_TEMPLATE_NAME.format(
                repository=config_file_name
            )
        )

        output_script = config['build']['outputScript']

        html_file_name = os.path.basename(config['build']['file'])

        repository_location = tempfile.mkdtemp()

        call([
            "git", "clone", "--depth", "1", repository, repository_location
        ])

        with open(os.path.join(repository_location, 'bower.json')) as f:
            bower_conf = json.loads(f.read())
            bower_conf['version'] = version

        with open(os.path.join(repository_location, 'bower.json'), 'w') as f:
            f.write(json.dumps(bower_conf, sort_keys=False, indent=2))

        call([
            'basis', '--config-file', config_path, 'build', '--output', output_location,
        ])
        copy_built_files(output_script)

        # call([
        #     'basis', '--config-file', config_path, 'build', '--output', output_location, '-p'
        # ])
        copy_built_files(output_script.replace('.js', '.min.js'))


        # Not good. Should build tree of files instead and check each file
        call(["git", "add", "."], cwd=repository_location)

        tag_message = "version {version}".format(
            version=version
        )

        call([
            "git", "commit", "-am", tag_message,
        ], cwd=repository_location)

        call([
            "git", "tag", "-a", "v" + version, '-m', tag_message
        ], cwd=repository_location)

        call(['cp', '-r', repository_location, '/Users/bait/built_basis_lib/'])

        call([
            "git", "push",
        ], cwd=repository_location)





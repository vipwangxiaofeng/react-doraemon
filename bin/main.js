#!/usr/bin/env node
const chalk = require('chalk')
function camelize (str) {
  return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}
// 获取参数 <app-name> -options
// 获取options
function cleanArgs(cmd) {
	const args = {}
	cmd.options.forEach((o) => {
		const key = camelize(o.long.replace(/^--/, ''))
		// 如果没有传递option或者有与之相同的命令，则不被拷贝
		if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
			args[key] = cmd[key]
		}
	})
	return args
}

// 检测node版本相关依赖
const semver = require('semver')
const requiredVersion = require('../package.json').engines.node
// 检测node版本函数
function checkNodeVersion(wanted, pluginName) {
	if (!semver.satisfies(process.version, wanted)) {
		console.log(chalk.red('你是用的Node版本号为： ' + process.version + ', 但 ' + pluginName + ' 需运行在 ' + wanted + '.\n请升级你的Node版本'))
		process.exit(1)
	}
}
checkNodeVersion(requiredVersion, 'react-cli')

// 建议升级Node
if (semver.satisfies(process.version, '9.x')) {
	console.log(chalk.red(`您的Node版本是 ${process.version}.\n` + `强烈建议你使用最新 LTS 版本`))
}

// 开始处理命令
const program = require('commander')
program
	.version(require('../package').version, '-v, --version', 'current version')
	.name('react-doraemon')
  .usage('<command> [options]')

const minimist = require('minimist')

// 创建命令行问题 <>代表必填
// 创建命令
// node main.js create appname -p presetName
program
	.on('--help', () => {
		console.log('');
		console.log('Illustrate:');
		console.log('create [options] <app-name>   create a new react app');
		console.log('Optional [options]');
		console.log('empty                         create a default react app');
		console.log('-m --mobx                     create a react app with mobx');
		console.log('-d --dva                      create a react app with dva');
		console.log('-r --redux                    create a react app with redux');
	})
	.command('create <app-name>')
	.description('create a new react app')
	.option('-m, --mobx', 'create a react app with mobx')
	.option('-d, --dva', 'create a react app with dva')
	.option('-r, --redux', 'create a react app with redux')
	.action((name, cmd) => {
		const options = cleanArgs(cmd)
		if (minimist(process.argv.slice(3))._.length > 1) {
			console.log(chalk.yellow('\n ⚠️  检测到您输入了多个名称，将以第一个参数为项目名，舍弃后续参数哦'))
    }
		require('../lib/create')(name, options)
  })


// 调用
program.parse(process.argv)

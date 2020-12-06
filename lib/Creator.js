const chalk = require('chalk')
const execa = require('execa')
const inquirer = require('inquirer')
const EventEmitter = require('events')
const loadRemotePreset = require('../lib/utils/loadRemotePreset')
const writeFileTree = require('../lib/utils/writeFileTree')
const copyFile = require('../lib/utils/copyFile')
const generateReadme = require('../lib/utils/generateReadme')
// const {installDeps} = require('../lib/utils/installDeps')
const { defaults } = require('../lib/options')
const { log, error, hasYarn, hasGit, hasProjectGit, logWithSpinner, clearConsole, stopSpinner, exit } = require('../lib/utils/common')
module.exports = class Creator extends (
	EventEmitter
) {
	constructor(name, context) {
		super()

		this.name = name // 项目名
		this.context = context // 项目路径

		this.run = this.run.bind(this)
	}
	//TODO:
	run(command, args) {
		if (!args) {
			;[command, ...args] = command.split(/\s+/)
		}
		return execa(command, args, { cwd: this.context })
	}
	async resolvePreset(name, clone) {
		let preset
		logWithSpinner(`Fetching remote preset ${chalk.cyan(name)}...`)
		this.emit('creation', { event: 'fetch-remote-preset' })
		try {
			preset = await loadRemotePreset(name, this.context, clone)
			stopSpinner()
		} catch (e) {
			stopSpinner()
			error(`Failed fetching remote preset ${chalk.cyan(name)} :`)
			throw e
		}

		// 默认使用default参数
		if (name === 'default' && !preset) {
			preset = defaults.presets.default
		}
		if (!preset) {
			error(`preset "${name}" not found.`)
			exit(1)
		}
		return preset
	}
	async create(cliOptions = {}, preset = null) {
		const { run, name, context } = this
		if (Object.keys(cliOptions).length > 0) {
			preset = await this.resolvePreset(Object.keys(cliOptions)[0], cliOptions.clone)
		} else {
			preset = await this.resolvePreset(defaults.presets.default, cliOptions.clone)
		}

		await clearConsole()
		log(chalk.blue.bold(`react-doraemon  v${require('../package.json').version}`))
		logWithSpinner(`✨`, `正在创建项目 ${chalk.yellow(context)}.`)
		this.emit('creation', { event: 'creating' })

		stopSpinner()
		// 设置文件名，版本号等
		const { pkgVers, pkgDes } = await inquirer.prompt([
			{
				name: 'pkgVers',
				message: `请输入项目版本号`,
				default: '1.0.0',
			},
			{
				name: 'pkgDes',
				message: `请输入项目简介`,
				default: 'project created by react-doraemon',
			},
		])

		// 将下载的临时文件拷贝到项目中
		const pkgJson = await copyFile(preset.tmpdir, preset.targetDir)

		// const pkg = Object.assign(pkgJson, {
		//   version: pkgVers,
		//   description: pkgDes,
		//   name:this.name
		// })
		const pkg = pkgJson
		pkg.version = pkgVers
		pkg.description = pkgDes
		pkg.name = this.name
		// write package.json
    log()
		logWithSpinner(`正在生成模板文件...`)
		await writeFileTree(context, {
			'package.json': JSON.stringify(pkg, null, 2),
		})

		// 包管理
		// const packageManager = (
		//   (hasYarn() ? 'yarn' : null) ||
		//   (hasPnpm3OrLater() ? 'pnpm' : 'npm')
		// )
		await writeFileTree(context, {})
		// await writeFileTree(context, {
		//   'README.md': generateReadme(pkg, packageManager)
		// })

		// const shouldInitGit = this.shouldInitGit(cliOptions)
		// if (shouldInitGit) {
		//   logWithSpinner(`🗃`, `初始化Git仓库`)
		//   this.emit('creation', { event: 'git-init' })
		//   await run('git init')
		// }

		// 安装依赖
		// stopSpinner()
		// log()
		// logWithSpinner(`⚙`, `安装依赖`)
		// log(`⚙  安装依赖中，请稍等...`)

		// await installDeps(context, packageManager, cliOptions.registry)

		// commit initial state
		// let gitCommitFailed = false
		// if (shouldInitGit) {
		//   await run('git add -A')
		//   const msg = typeof cliOptions.git === 'string' ? cliOptions.git : 'init'
		//   try {
		//     await run('git', ['commit', '-m', msg])
		//   } catch (e) {
		//     gitCommitFailed = true
		//   }
		// }

		// log instructions
		stopSpinner()
    log()
    await clearConsole()
		log(`${chalk.green('✔')} 项目创建成功 ${chalk.yellow(name)}.`)
		if (!cliOptions.skipGetStarted) {
			log(
				`${chalk.green('✔')} 请按如下命令，开始愉快开发吧！\n\n` +
					(this.context === process.cwd() ? `` : chalk.cyan(` ${chalk.gray('$')} cd ${name}\n`)) +
					chalk.cyan(` ${chalk.gray('$')} yarn\n`) +
					chalk.cyan(` ${chalk.gray('$')} yarn start`)
			)
		}
		log()
		this.emit('creation', { event: 'done' })

		// if (gitCommitFailed) {
		//   warn(
		//     `因您的git username或email配置不正确，无法为您初始化git commit，\n` +
		//     `请稍后自行git commit。\n`
		//   )
		// }
	}
}

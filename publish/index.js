const inquirer = require('inquirer')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const path = require('path')
const root = path.dirname(__dirname)
const ci = require('miniprogram-ci')

const config = {
    appId: 'wx6f7009e2fd70719a',
    version: '',
    desc: ''
}

const question1 = [{
    type: 'input',
    message: '请输入本次部署的版本号:',
    name: 'version',
    default: '0.0.0'
}]
const question2 = [{
    type: 'input',
    message: '请速入本次部署的描述信息:',
    name: 'desc',
    default: '部署体验版'
}]

async function inquirerToSetConfig() {
    let answer1 = await inquirer.prompt(question1)
    Object.assign(config, answer1)
    let answer2 = await inquirer.prompt(question2)
    Object.assign(config, answer2)

    buildAndPublish()
}

async function buildAndPublish() {
    await exec(`cd ${root}`)

    console.log('Start building...')
    let buildCommand = 'yarn run build:mp-weixin'
    console.log(buildCommand)
    console.log('Please be patient for a few minutes...')
    const { stdout, stderr } = await exec(buildCommand)
    // console.log('stdout:', stdout)
    // console.log('stderr:', stderr)
    console.log('Build successfully')
    console.log('------------------------------------')

    console.log('Start uploading...')
    const project = new ci.Project({
        type: 'miniProgram',
        appid: config.appId,
        projectPath: path.resolve(__dirname, `../dist/build/mp-weixin`),
        privateKeyPath: path.resolve(__dirname, `./keys/private.${config.appId}.key`),
        ignores: ['node_modules/**/*'],
    })
    const uploadResult = await ci.upload({
        project,
        version: config.version,
        desc: config.desc,
        robot: 1,
        setting: {
            es6: true,
            minifyJS: true,
            minifyWXML: true,
            minifyWXSS: true,
            minify: true,
        }
    })
    // notifyPackageSize(uploadResult)
    console.log(uploadResult);
}

inquirerToSetConfig()
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
    let buildCommand = 'npm run build:mp-weixin'
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
        privateKeyPath: path.resolve(__dirname, `./private.${config.appId}.key`),
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
    console.log('Upload successfully! 🎉')
    notifyPackageSize(uploadResult)
}

function notifyPackageSize(uploadResult) {
  uploadResult.subPackageInfo.map(item => {
      if (item.name === '__APP__') {
          console.log(`当前主包的当前体积为 ${(item.size / 1024 / 1024).toFixed(2)}M`)
      } else if (item.name === '__FULL__') {
          console.log(`当前所有包的总体积为 ${(item.size / 1024 / 1024).toFixed(2)}M`)
      } else {
          console.log(`${item.name.slice(1, -1).split('/')[1]} 分包的当前体积为 ${(item.size / 1024 / 1024).toFixed(2)}M`)
      }

      if ((item.size / 1024 / 1024).toFixed(2) > 2 && item.name !== '__FULL__') {
          console.error(`🚨单个分包/主包大小不能超过 2M ⬆️`)
          console.error(`详细请参考官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html`)
      }
      if ((item.size / 1024 / 1024).toFixed(2) >= 20 && item.name === '__FULL__') {
          console.error(`🚨整个小程序所有分包大小不超过 20M ⬆️`)
          console.error(`详细请参考官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html`)
      }
  })
}

inquirerToSetConfig()
const inquirer = require("inquirer");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const path = require("path");
const root = path.dirname(__dirname);
const ci = require("miniprogram-ci");
const fs = require("fs");
const semver = require("semver");

const config = {
  appId: "wx6f7009e2fd70719a",
  miniVersion: "",
  desc: "",
  currentRepoVersion: "1.0.0",
  nextRepoVersionOptions: [],
};

const question1 = [
  {
    type: "input",
    message: "请输入本次部署的小程序版本号:",
    name: "miniVersion",
    default: "0.0.0",
  },
];
const question2 = [
  {
    type: "input",
    message: "请速入本次部署的描述信息:",
    name: "desc",
    default: "部署体验版",
  },
];
const question3 = [
  {
    type: "confirm",
    message: "本次部署是否更新代码仓版本号?",
    name: "isBumpRepoVersion",
    default: false,
  },
];
const question4 = () => ({
  type: "list",
  name: "nextRepoVersion",
  message: `请选择代码仓下一个版本号 (当前版本为 ${config.currentRepoVersion})`,
  choices: Object.keys(config.nextRepoVersionOptions).map((name) => ({
    name: `${name} => ${config.nextRepoVersionOptions[name]}`,
    value: config.nextRepoVersionOptions[name],
  })),
});

async function inquirerToSetConfig() {
  const answer1 = await inquirer.prompt(question1);
  Object.assign(config, answer1);
  const answer2 = await inquirer.prompt(question2);
  Object.assign(config, answer2);
  const answer3 = await inquirer.prompt(question3);
  Object.assign(config, answer3);

  if (answer3.isBumpRepoVersion) {
    config.currentRepoVersion = getCurrentRepoVersion();
    config.nextRepoVersionOptions = getNextRepoVersionOptions(
      config.currentRepoVersion
    );
    const answer4 = await inquirer.prompt(question4());
    Object.assign(config, answer4);
  }

  buildAndPublish();
}

function getCurrentRepoVersion() {
  const packagePath = path.resolve(root, "package.json");
  const packageData = fs.readFileSync(packagePath, "utf8");
  return JSON.parse(packageData).version;
}

function getNextRepoVersionOptions(currentRepoVersion) {
  return {
    major: semver.inc(currentRepoVersion, "major"),
    minor: semver.inc(currentRepoVersion, "minor"),
    patch: semver.inc(currentRepoVersion, "patch"),
    premajor: semver.inc(currentRepoVersion, "premajor"),
    preminor: semver.inc(currentRepoVersion, "preminor"),
    prepatch: semver.inc(currentRepoVersion, "prepatch"),
    prerelease: semver.inc(currentRepoVersion, "prerelease"),
  };
}

async function buildAndPublish() {
  await exec(`cd ${root}`);

  console.log("Start building...");
  let buildCommand = "npm run build:mp-weixin";
  console.log(buildCommand);
  console.log("Please be patient for a few minutes...");
  const { stdout, stderr } = await exec(buildCommand);
  // console.log('stdout:', stdout)
  // console.log('stderr:', stderr)
  console.log("Build successfully");
  console.log("------------------------------------");

  console.log("Start uploading...");
  const project = new ci.Project({
    type: "miniProgram",
    appid: config.appId,
    projectPath: path.resolve(__dirname, `../dist/build/mp-weixin`),
    privateKeyPath: path.resolve(__dirname, `./private.${config.appId}.key`),
    ignores: ["node_modules/**/*"],
  });
  const uploadResult = await ci.upload({
    project,
    version: config.miniVersion,
    desc: config.desc,
    robot: 1,
    setting: {
      es6: true,
      minifyJS: true,
      minifyWXML: true,
      minifyWXSS: true,
      minify: true,
    },
  });
  console.log("Upload successfully! 🎉");
  notifyPackageSize(uploadResult);
  config.isBumpRepoVersion && updateVersion();
}

function notifyPackageSize(uploadResult) {
  uploadResult.subPackageInfo.map((item) => {
    if (item.name === "__APP__") {
      console.log(
        `当前主包的当前体积为 ${(item.size / 1024 / 1024).toFixed(2)}M`
      );
    } else if (item.name === "__FULL__") {
      console.log(
        `当前所有包的总体积为 ${(item.size / 1024 / 1024).toFixed(2)}M`
      );
    } else {
      console.log(
        `${item.name.slice(1, -1).split("/")[1]} 分包的当前体积为 ${(
          item.size /
          1024 /
          1024
        ).toFixed(2)}M`
      );
    }

    if ((item.size / 1024 / 1024).toFixed(2) > 2 && item.name !== "__FULL__") {
      console.error(`🚨 单个分包/主包大小不能超过 2M ⬆️`);
      console.error(
        `详细请参考官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html`
      );
    }
    if (
      (item.size / 1024 / 1024).toFixed(2) >= 20 &&
      item.name === "__FULL__"
    ) {
      console.error(`🚨 整个小程序所有分包大小不超过 20M ⬆️`);
      console.error(
        `详细请参考官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html`
      );
    }
  });
}

async function updateVersion() {
  const output = await exec("git status --porcelain");
  if (output.stdout.toString().trim() !== "") {
    console.log(`🚨 更新版本号需保持工作区清洁`);
    return;
  }
  exec(`npm version ${config.nextRepoVersion} -m "release ${config.nextRepoVersion}"`);
  console.log("Bump repo version successfully! 🎉");
}

inquirerToSetConfig();

// updateVersion();

/*
 * @Author: LXK9301 https://github.com/LXK9301
 * @Date: 2020-12-06 18:19:21
 * @Last Modified by: LXK9301
 * @Last Modified time: 2020-12-26 22:58:02
 */
/*
东东工厂，不是京喜工厂
活动入口：京东APP首页-数码电器-东东工厂
免费产生的电量(10秒1个电量，500个电量满，5000秒到上限不生产，算起来是84分钟达到上限)
故建议1小时运行一次
开会员任务和去京东首页点击“数码电器任务目前未做
不会每次运行脚本都投入电力
只有当心仪的商品存在，并且收集起来的电量满足当前商品所需电力，才投入
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#东东工厂
10 * * * * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_jdfactory.js, tag=东东工厂, img-url=https://raw.githubusercontent.com/58xinian/icon/master/jd_factory.png, enabled=true

================Loon==============
[Script]
cron "10 * * * *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_jdfactory.js,tag=东东工厂

===============Surge=================
东东工厂 = type=cron,cronexp="10 * * * *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_jdfactory.js

============小火箭=========
东东工厂 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_jdfactory.js, cronexpr="10 * * * *", timeout=3600, enable=true
 */
const $ = new Env('东东工厂');

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
const randomCount = $.isNode() ? 20 : 5;
let helpAuther = true;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
  if (process.env.JDFACTORY_FORBID_ACCOUNT) process.env.JDFACTORY_FORBID_ACCOUNT.split('&').map((item, index) => Number(item) === 0 ? cookiesArr = [] : cookiesArr.splice(Number(item) - 1 - index, 1))
} else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}
let wantProduct = ``;//心仪商品名称
const JD_API_HOST = 'https://api.m.jd.com/client.action';
const inviteCodes = [`T022v_13RxwZ91ffPR_wlPcNfACjVWnYaS5kRrbA@T0205KkcH1lQpB6qW3uX06FuCjVWnYaS5kRrbA@T0225KkcRR1K8wXXJxKiwaIIdACjVWnYaS5kRrbA@T018v_h6QBsa9VfeKByb1ACjVWnYaS5kRrbA@T016aGPImbWDIsNs9Zd1CjVWnYaS5kRrbA@T020anX1lb-5IPJt9JJyQH-MCjVWnYaS5kRrbA@T0225KkcRBoRp1SEJBP1nKIDdgCjVWnYaS5kRrbA@T0225KkcRBoRp1SEJBP1nKIDdgCjVWnYaS5kRrbA`, 'T022v_13RxwZ91ffPR_wlPcNfACjVWnYaS5kRrbA@T0205KkcH1lQpB6qW3uX06FuCjVWnYaS5kRrbA@T0225KkcRR1K8wXXJxKiwaIIdACjVWnYaS5kRrbA@T018v_h6QBsa9VfeKByb1ACjVWnYaS5kRrbA@T016aGPImbWDIsNs9Zd1CjVWnYaS5kRrbA@T020anX1lb-5IPJt9JJyQH-MCjVWnYaS5kRrbA@T0225KkcRBoRp1SEJBP1nKIDdgCjVWnYaS5kRrbA@T0225KkcRBoRp1SEJBP1nKIDdgCjVWnYaS5kRrbA'];
!(async () => {
  await requireConfig();
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await TotalBean();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      await shareCodesFormat();
      await jdFactory()
    }
  }
})()
    .catch((e) => {
      $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
      $.done();
    })
async function jdFactory() {
  await jdfactory_getHomeData();
  await helpFriends();
  // $.newUser !==1 && $.haveProduct === 2，老用户但未选购商品
  // $.newUser === 1新用户
  if ($.newUser === 1) return
  await jdfactory_collectElectricity();//收集产生的电量
  await jdfactory_getTaskDetail();
  await doTask();
  await algorithm();//投入电力逻辑
  await showMsg();
}
function showMsg() {
  return new Promise(resolve => {
    if (!jdNotify) {
      $.msg($.name, '', `${message}`);
    } else {
      $.log(`京东账号${$.index}${$.nickName}\n${message}`);
    }
    if (new Date().getHours() === 12) {
      $.msg($.name, '', `${message}`);
    }
    resolve()
  })
}
async function algorithm() {
  // 当心仪的商品存在，并且收集起来的电量满足当前商品所需，就投入
  return new Promise(resolve => {
    $.post(taskPostUrl('jdfactory_getHomeData'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.bizCode === 0) {
              $.haveProduct = data.data.result.haveProduct;
              $.userName = data.data.result.userName;
              $.newUser = data.data.result.newUser;
              wantProduct = $.isNode() ? (process.env.FACTORAY_WANTPRODUCT_NAME ? process.env.FACTORAY_WANTPRODUCT_NAME : wantProduct) : ($.getdata('FACTORAY_WANTPRODUCT_NAME') ? $.getdata('FACTORAY_WANTPRODUCT_NAME') : wantProduct);
              if (data.data.result.factoryInfo) {
                let { totalScore, useScore, produceScore, remainScore, couponCount, name } = data.data.result.factoryInfo
                console.log(`\n已选商品：${name}`);
                console.log(`当前已投入电量/所需电量：${useScore}/${totalScore}`);
                console.log(`已选商品剩余量：${couponCount}`);
                console.log(`当前总电量：${remainScore * 1 + useScore * 1}`);
                console.log(`当前完成度：${((remainScore * 1 + useScore * 1)/(totalScore * 1)).toFixed(2) * 100}%\n`);
                message += `京东账号${$.index} ${$.nickName}\n`;
                message += `已选商品：${name}\n`;
                message += `当前已投入电量/所需电量：${useScore}/${totalScore}\n`;
                message += `已选商品剩余量：${couponCount}\n`;
                message += `当前总电量：${remainScore * 1 + useScore * 1}\n`;
                message += `当前完成度：${((remainScore * 1 + useScore * 1)/(totalScore * 1)).toFixed(2) * 100}%\n`;
                if (wantProduct) {
                  console.log(`BoxJs或环境变量提供的心仪商品：${wantProduct}\n`);
                  await jdfactory_getProductList(true);
                  let wantProductSkuId = '';
                  for (let item of $.canMakeList) {
                    if (item.name.indexOf(wantProduct) > - 1) {
                      totalScore = item['fullScore'] * 1;
                      couponCount = item.couponCount;
                      name = item.name;
                    }
                    if (item.name.indexOf(wantProduct) > - 1 && item.couponCount > 0) {
                      wantProductSkuId = item.skuId;
                    }
                  }
                  // console.log(`\n您心仪商品${name}\n当前数量为：${couponCount}\n兑换所需电量为：${totalScore}\n您当前总电量为：${remainScore * 1 + useScore * 1}\n`);
                  if (wantProductSkuId && ((remainScore * 1 + useScore * 1) >= (totalScore * 1 + 100000))) {
                    console.log(`\n提供的心仪商品${name}目前数量：${couponCount}，且当前总电量为：${remainScore * 1 + useScore * 1}，【满足】兑换此商品所需总电量：${totalScore + 100000}`);
                    console.log(`请去活动页面更换成心仪商品并手动投入电量兑换\n`);
                    $.msg($.name, '', `京东账号${$.index}${$.nickName}\n您提供的心仪商品${name}目前数量：${couponCount}\n当前总电量为：${remainScore * 1 + useScore * 1}\n【满足】兑换此商品所需总电量：${totalScore}\n请点击弹窗直达活动页面\n更换成心仪商品并手动投入电量兑换`, {'open-url': 'openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/2uSsV2wHEkySvompfjB43nuKkcHp/index.html%22%20%7D'});
                    if ($.isNode()) await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `【京东账号${$.index}】${$.nickName}\n您提供的心仪商品${name}目前数量：${couponCount}\n当前总电量为：${remainScore * 1 + useScore * 1}\n【满足】兑换此商品所需总电量：${totalScore}\n请去活动页面更换成心仪商品并手动投入电量兑换`);
                  } else {
                    console.log(`您心仪商品${name}\n当前数量为：${couponCount}\n兑换所需电量为：${totalScore}\n您当前总电量为：${remainScore * 1 + useScore * 1}\n不满足兑换心仪商品的条件\n`)
                  }
                } else {
                  console.log(`BoxJs或环境变量暂未提供心仪商品\n如需兑换心仪商品，请提供心仪商品名称，否则满足条件后会为您兑换当前所选商品：${name}\n`);
                  if (((remainScore * 1 + useScore * 1) >= totalScore * 1 + 100000) && (couponCount * 1 > 0)) {
                    console.log(`\n所选商品${name}目前数量：${couponCount}，且当前总电量为：${remainScore * 1 + useScore * 1}，【满足】兑换此商品所需总电量：${totalScore}`);
                    console.log(`BoxJs或环境变量暂未提供心仪商品，下面为您目前选的${name} 发送提示通知\n`);
                    // await jdfactory_addEnergy();
                    $.msg($.name, '', `京东账号${$.index}${$.nickName}\n您所选商品${name}目前数量：${couponCount}\n当前总电量为：${remainScore * 1 + useScore * 1}\n【满足】兑换此商品所需总电量：${totalScore}\n请点击弹窗直达活动页面查看`, {'open-url': 'openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/2uSsV2wHEkySvompfjB43nuKkcHp/index.html%22%20%7D'});
                    if ($.isNode()) await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `【京东账号${$.index}】${$.nickName}\n所选商品${name}目前数量：${couponCount}\n当前总电量为：${remainScore * 1 + useScore * 1}\n【满足】兑换此商品所需总电量：${totalScore}\n请速去活动页面查看`);
                  } else {
                    console.log(`\n所选商品${name}目前数量：${couponCount}，且当前总电量为：${remainScore * 1 + useScore * 1}，【不满足】兑换此商品所需总电量：${totalScore}`)
                    console.log(`故不一次性投入电力，一直放到蓄电池累计\n`);
                  }
                }
              } else {
                console.log(`\n此账号${$.index}${$.nickName}暂未选择商品\n`);
                message += `京东账号${$.index} ${$.nickName}\n`;
                message += `已选商品：暂无\n`;
                message += `心仪商品：${wantProduct ? wantProduct : '暂无'}\n`;
                if (wantProduct) {
                  console.log(`BoxJs或环境变量提供的心仪商品：${wantProduct}\n`);
                  await jdfactory_getProductList(true);
                  let wantProductSkuId = '', name, totalScore, couponCount, remainScore;
                  for (let item of $.canMakeList) {
                    if (item.name.indexOf(wantProduct) > - 1) {
                      totalScore = item['fullScore'] * 1;
                      couponCount = item.couponCount;
                      name = item.name;
                    }
                    if (item.name.indexOf(wantProduct) > - 1 && item.couponCount > 0) {
                      wantProductSkuId = item.skuId;
                    }
                  }
                  if (totalScore) {
                    // 库存存在您设置的心仪商品
                    message += `心仪商品数量：${couponCount}\n`;
                    message += `心仪商品所需电量：${totalScore}\n`;
                    message += `您当前总电量：${$.batteryValue * 1}\n`;
                    if (wantProductSkuId && (($.batteryValue * 1) >= (totalScore))) {
                      console.log(`\n提供的心仪商品${name}目前数量：${couponCount}，且当前总电量为：${$.batteryValue * 1}，【满足】兑换此商品所需总电量：${totalScore}`);
                      console.log(`请去活动页面选择心仪商品并手动投入电量兑换\n`);
                      $.msg($.name, '', `京东账号${$.index}${$.nickName}\n您提供的心仪商品${name}目前数量：${couponCount}\n当前总电量为：${$.batteryValue * 1}\n【满足】兑换此商品所需总电量：${totalScore}\n请点击弹窗直达活动页面\n选择此心仪商品并手动投入电量兑换`, {'open-url': 'openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/2uSsV2wHEkySvompfjB43nuKkcHp/index.html%22%20%7D'});
                      if ($.isNode()) await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `【京东账号${$.index}】${$.nickName}\n您提供的心仪商品${name}目前数量：${couponCount}\n当前总电量为：${$.batteryValue * 1}\n【满足】兑换此商品所需总电量：${totalScore}\n请去活动页面选择此心仪商品并手动投入电量兑换`);
                    } else {
                      console.log(`您心仪商品${name}\n当前数量为：${couponCount}\n兑换所需电量为：${totalScore}\n您当前总电量为：${$.batteryValue * 1}\n不满足兑换心仪商品的条件\n`)
                    }
                  } else {
                    message += `目前库存：暂无您设置的心仪商品\n`;
                  }
                } else {
                  console.log(`BoxJs或环境变量暂未提供心仪商品\n如需兑换心仪商品，请提供心仪商品名称\n`);
                  await jdfactory_getProductList(true);
                  message += `当前剩余最多商品：${$.canMakeList[0] && $.canMakeList[0].name}\n`;
                  message += `兑换所需电量：${$.canMakeList[0] && $.canMakeList[0].fullScore}\n`;
                  message += `您当前总电量：${$.batteryValue * 1}\n`;
                  if ($.canMakeList[0] && $.canMakeList[0].couponCount > 0 && $.batteryValue * 1 >= $.canMakeList[0] && $.canMakeList[0].fullScore) {
                    let nowTimes = new Date(new Date().getTime() + new Date().getTimezoneOffset()*60*1000 + 8*60*60*1000);
                    if (new Date(nowTimes).getHours() === 12) {
                      $.msg($.name, '', `京东账号${$.index}${$.nickName}\n${message}【满足】兑换${$.canMakeList[0] && $.canMakeList[0] && [0].name}所需总电量：${$.canMakeList[0] && $.canMakeList[0].fullScore}\n请点击弹窗直达活动页面\n选择此心仪商品并手动投入电量兑换`, {'open-url': 'openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/2uSsV2wHEkySvompfjB43nuKkcHp/index.html%22%20%7D'});
                      if ($.isNode()) await notify.sendNotify(`${$.name} - 账号${$.index} - ${$.nickName}`, `【京东账号${$.index}】${$.nickName}\n${message}【满足】兑换${$.canMakeList[0] && $.canMakeList[0].name}所需总电量：${$.canMakeList[0].fullScore}\n请速去活动页面查看`);
                    }
                  } else {
                    console.log(`\n目前电量${$.batteryValue * 1},不满足兑换 ${$.canMakeList[0] && $.canMakeList[0].name}所需的 ${$.canMakeList[0] && $.canMakeList[0].fullScore}电量\n`)
                  }
                }
              }
            } else {
              console.log(`异常：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
async function helpFriends() {
  for (let code of $.newShareCodes) {
    if (!code) continue
    const helpRes = await jdfactory_collectScore(code);
    if (helpRes.code === 0 && helpRes.data.bizCode === -7) {
      console.log(`助力机会已耗尽，跳出`);
      break
    }
  }
}
async function doTask() {
  if ($.taskVos && $.taskVos.length > 0) {
    for (let item of $.taskVos) {
      if (item.taskType === 1) {
        //关注店铺任务
        if (item.status === 1) {
          console.log(`准备做此任务：${item.taskName}`);
          for (let task of item.followShopVo) {
            if (task.status === 1) {
              await jdfactory_collectScore(task.taskToken);
            }
          }
        } else {
          console.log(`${item.taskName}已做完`)
        }
      }
      if (item.taskType === 2) {
        //看看商品任务
        if (item.status === 1) {
          console.log(`准备做此任务：${item.taskName}`);
          for (let task of item.productInfoVos) {
            if (task.status === 1) {
              await jdfactory_collectScore(task.taskToken);
            }
          }
        } else {
          console.log(`${item.taskName}已做完`)
        }
      }
      if (item.taskType === 3) {
        //逛会场任务
        if (item.status === 1) {
          console.log(`准备做此任务：${item.taskName}`);
          for (let task of item.shoppingActivityVos) {
            if (task.status === 1) {
              await jdfactory_collectScore(task.taskToken);
            }
          }
        } else {
          console.log(`${item.taskName}已做完`)
        }
      }
      if (item.taskType === 10) {
        if (item.status === 1) {
          if (item.threeMealInfoVos[0].status === 1) {
            //可以做此任务
            console.log(`准备做此任务：${item.taskName}`);
            await jdfactory_collectScore(item.threeMealInfoVos[0].taskToken);
          } else if (item.threeMealInfoVos[0].status === 0) {
            console.log(`${item.taskName} 任务已错过时间`)
          }
        } else if (item.status === 2){
          console.log(`${item.taskName}已完成`);
        }
      }
      if (item.taskType === 21) {
        //开通会员任务
        if (item.status === 1) {
          console.log(`此任务：${item.taskName}，跳过`);
          // for (let task of item.brandMemberVos) {
          //   if (task.status === 1) {
          //     await jdfactory_collectScore(task.taskToken);
          //   }
          // }
        } else {
          console.log(`${item.taskName}已做完`)
        }
      }
      if (item.taskType === 13) {
        //每日打卡
        if (item.status === 1) {
          console.log(`准备做此任务：${item.taskName}`);
          await jdfactory_collectScore(item.simpleRecordInfoVo.taskToken);
        } else {
          console.log(`${item.taskName}已完成`);
        }
      }
      if (item.taskType === 14) {
        //好友助力
        if (item.status === 1) {
          console.log(`准备做此任务：${item.taskName}`);
          // await jdfactory_collectScore(item.simpleRecordInfoVo.taskToken);
        } else {
          console.log(`${item.taskName}已完成`);
        }
      }
      if (item.taskType === 23) {
        //从数码电器首页进入
        if (item.status === 1) {
          console.log(`准备做此任务：${item.taskName}`);
          await queryVkComponent();
          await jdfactory_collectScore(item.simpleRecordInfoVo.taskToken);
        } else {
          console.log(`${item.taskName}已完成`);
        }
      }
    }
  }
}

//领取做完任务的奖励
function jdfactory_collectScore(taskToken) {
  return new Promise(async resolve => {
    await $.wait(1000);
    $.post(taskPostUrl("jdfactory_collectScore", { taskToken }, "jdfactory_collectScore"), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.bizCode === 0) {
              $.taskVos = data.data.result.taskVos;//任务列表
              console.log(`领取做完任务的奖励：${JSON.stringify(data.data.result)}`);
            } else {
              console.log(JSON.stringify(data))
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
//给商品投入电量
function jdfactory_addEnergy() {
  return new Promise(resolve => {
    $.post(taskPostUrl("jdfactory_addEnergy"), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.bizCode === 0) {
              console.log(`给商品投入电量：${JSON.stringify(data.data.result)}`)
              // $.taskConfigVos = data.data.result.taskConfigVos;
              // $.exchangeGiftConfigs = data.data.result.exchangeGiftConfigs;
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}

//收集电量
function jdfactory_collectElectricity() {
  return new Promise(resolve => {
    $.post(taskPostUrl("jdfactory_collectElectricity"), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.bizCode === 0) {
              console.log(`成功收集${data.data.result.electricityValue}电量，当前蓄电池总电量：${data.data.result.batteryValue}\n`);
              $.batteryValue = data.data.result.batteryValue;
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
//获取任务列表
function jdfactory_getTaskDetail() {
  return new Promise(resolve => {
    $.post(taskPostUrl("jdfactory_getTaskDetail", {}, "jdfactory_getTaskDetail"), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.bizCode === 0) {
              $.taskVos = data.data.result.taskVos;//任务列表
              $.taskVos.map(item => {
                if (item.taskType === 14) {
                  console.log(`\n【京东账号${$.index}（${$.nickName || $.UserName}）的${$.name}好友互助码】${item.assistTaskDetailVo.taskToken}\n`)
                }
              })
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
//选择一件商品，只能在 $.newUser !== 1 && $.haveProduct === 2 并且 sellOut === 0的时候可用
function jdfactory_makeProduct(skuId) {
  return new Promise(resolve => {
    $.post(taskPostUrl('jdfactory_makeProduct', { skuId }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.bizCode === 0) {
              console.log(`选购商品成功：${JSON.stringify(data)}`);
            } else {
              console.log(`异常：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function queryVkComponent() {
  return new Promise(resolve => {
    const options = {
      "url": `https://api.m.jd.com/client.action?functionId=queryVkComponent`,
      "body": `adid=0E38E9F1-4B4C-40A4-A479-DD15E58A5623&area=19_1601_50258_51885&body={"componentId":"4f953e59a3af4b63b4d7c24f172db3c3","taskParam":"{\\"actId\\":\\"8tHNdJLcqwqhkLNA8hqwNRaNu5f\\"}","cpUid":"8tHNdJLcqwqhkLNA8hqwNRaNu5f","taskSDKVersion":"1.0.3","businessId":"babel"}&build=167436&client=apple&clientVersion=9.2.5&d_brand=apple&d_model=iPhone11,8&eid=eidIf12a8121eas2urxgGc+zS5+UYGu1Nbed7bq8YY+gPd0Q0t+iviZdQsxnK/HTA7AxZzZBrtu1ulwEviYSV3QUuw2XHHC+PFHdNYx1A/3Zt8xYR+d3&isBackground=N&joycious=228&lang=zh_CN&networkType=wifi&networklibtype=JDNetworkBaseAF&openudid=88732f840b77821b345bf07fd71f609e6ff12f43&osVersion=14.2&partner=TF&rfs=0000&scope=11&screen=828*1792&sign=792d92f78cc893f43c32a4f0b2203a41&st=1606533009673&sv=122&uts=0f31TVRjBSsqndu4/jgUPz6uymy50MQJFKw5SxNDrZGH4Sllq/CDN8uyMr2EAv+1xp60Q9gVAW42IfViu/SFHwjfGAvRI6iMot04FU965+8UfAPZTG6MDwxmIWN7YaTL1ACcfUTG3gtkru+D4w9yowDUIzSuB+u+eoLwM7uynPMJMmGspVGyFIgDXC/tmNibL2k6wYgS249Pa2w5xFnYHQ==&uuid=hjudwgohxzVu96krv/T6Hg==&wifiBssid=1b5809fb84adffec2a397007cc235c03`,
      "headers":  {
        "Cookie": cookie,
        "Accept": `*/*`,
        "Connection": `keep-alive`,
        "Content-Type": `application/x-www-form-urlencoded`,
        "Accept-Encoding": `gzip, deflate, br`,
        "Host": `api.m.jd.com`,
        "User-Agent": "jdapp;iPhone;9.3.4;14.3;88732f840b77821b345bf07fd71f609e6ff12f43;network/4g;ADID/1C141FDD-C62F-425B-8033-9AAB7E4AE6A3;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone11,8;addressid/2005183373;supportBestPay/0;appBuild/167502;jdSupportDarkMode/0;pv/414.19;apprpd/Babel_Native;ref/TTTChannelViewContoller;psq/5;ads/;psn/88732f840b77821b345bf07fd71f609e6ff12f43|1701;jdv/0|iosapp|t_335139774|appshare|CopyURL|1610885480412|1610885486;adk/;app_device/IOS;pap/JA2015_311210|9.3.4|IOS 14.3;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
        "Accept-Language": `zh-Hans-CN;q=1, en-CN;q=0.9`,
      },
      "timeout": 10000,
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          // console.log('queryVkComponent', data)
          if (safeGet(data)) {
            data = JSON.parse(data);
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
//查询当前商品列表
function jdfactory_getProductList(flag = false) {
  return new Promise(resolve => {
    $.post(taskPostUrl('jdfactory_getProductList'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.data.bizCode === 0) {
              $.canMakeList = [];
              $.canMakeList = data.data.result.canMakeList;//当前可选商品列表 sellOut:1为已抢光，0为目前可选择
              if ($.canMakeList && $.canMakeList.length > 0) {
                $.canMakeList.sort(sortCouponCount);
                console.log(`商品名称       可选状态    剩余量`)
                for (let item of $.canMakeList) {
                  console.log(`${item.name.slice(-4)}         ${item.sellOut === 1 ? '已抢光':'可 选'}      ${item.couponCount}`);
                }
                if (!flag) {
                  for (let item of $.canMakeList) {
                    if (item.name.indexOf(wantProduct) > -1 && item.couponCount > 0 && item.sellOut === 0) {
                      await jdfactory_makeProduct(item.skuId);
                      break
                    }
                  }
                }
              }
            } else {
              console.log(`异常：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function sortCouponCount(a, b) {
  return b['couponCount'] - a['couponCount']
}
function jdfactory_getHomeData() {
  return new Promise(resolve => {
    $.post(taskPostUrl('jdfactory_getHomeData'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            // console.log(data);
            data = JSON.parse(data);
            if (data.data.bizCode === 0) {
              $.haveProduct = data.data.result.haveProduct;
              $.userName = data.data.result.userName;
              $.newUser = data.data.result.newUser;
              if (data.data.result.factoryInfo) {
                $.totalScore = data.data.result.factoryInfo.totalScore;//选中的商品，一共需要的电量
                $.userScore = data.data.result.factoryInfo.userScore;//已使用电量
                $.produceScore = data.data.result.factoryInfo.produceScore;//此商品已投入电量
                $.remainScore = data.data.result.factoryInfo.remainScore;//当前蓄电池电量
                $.couponCount = data.data.result.factoryInfo.couponCount;//已选中商品当前剩余量
                $.hasProduceName = data.data.result.factoryInfo.name;//已选中商品当前剩余量
              }
              if ($.newUser === 1) {
                //新用户
                console.log(`此京东账号${$.index}${$.nickName}为新用户暂未开启${$.name}活动\n现在为您从库存里面现有数量中选择一商品`);
                if ($.haveProduct === 2) {
                  await jdfactory_getProductList();//选购商品
                }
                // $.msg($.name, '暂未开启活动', `京东账号${$.index}${$.nickName}暂未开启${$.name}活动\n请去京东APP->搜索'玩一玩'->东东工厂->开启\n或点击弹窗即可到达${$.name}活动`, {'open-url': 'openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/2uSsV2wHEkySvompfjB43nuKkcHp/index.html%22%20%7D'});
              }
              if ($.newUser !== 1 && $.haveProduct === 2) {
                console.log(`此京东账号${$.index}${$.nickName}暂未选购商品\n现在也能为您做任务和收集免费电力`);
                // $.msg($.name, '暂未选购商品', `京东账号${$.index}${$.nickName}暂未选购商品\n请去京东APP->搜索'玩一玩'->东东工厂->选购一件商品\n或点击弹窗即可到达${$.name}活动`, {'open-url': 'openjd://virtual?params=%7B%20%22category%22:%20%22jump%22,%20%22des%22:%20%22m%22,%20%22url%22:%20%22https://h5.m.jd.com/babelDiy/Zeus/2uSsV2wHEkySvompfjB43nuKkcHp/index.html%22%20%7D'});
                // await jdfactory_getProductList();//选购商品
              }
            } else {
              console.log(`异常：${JSON.stringify(data)}`)
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function readShareCode() {
  console.log(`开始`)
  return new Promise(async resolve => {
    $.get({url: "https://gitee.com/Soundantony/RandomShareCode/raw/master/JD_Factory.json",headers:{
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
      }}, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，将切换为备用API`)
          console.log(`随机取助力码放到您固定的互助码后面(不影响已有固定互助)`)
          $.get({url: `https://raw.githubusercontent.com/shuyeshuye/RandomShareCode/main/JD_Factory.json`, 'timeout': 10000},(err, resp, data)=>{
          data = JSON.parse(data);})
        } else {
          if (data) {
            console.log(`随机取助力码放到您固定的互助码后面(不影响已有固定互助)`)
            data = JSON.parse(data);
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
    await $.wait(10000);
    resolve()
  })
}
//格式化助力码
function shareCodesFormat() {
  return new Promise(async resolve => {
    // console.log(`第${$.index}个京东账号的助力码:::${$.shareCodesArr[$.index - 1]}`)
    $.newShareCodes = [];
    if ($.shareCodesArr[$.index - 1]) {
      $.newShareCodes = $.shareCodesArr[$.index - 1].split('@');
    } else {
      console.log(`由于您第${$.index}个京东账号未提供shareCode,将采纳本脚本自带的助力码\n`)
      const tempIndex = $.index > inviteCodes.length ? (inviteCodes.length - 1) : ($.index - 1);
      $.newShareCodes = inviteCodes[tempIndex].split('@');
    }
    const readShareCodeRes = await readShareCode();
    if (readShareCodeRes && readShareCodeRes.code === 200) {
      $.newShareCodes = [...new Set([...$.newShareCodes, ...(readShareCodeRes.data || [])])];
    }
    console.log(`第${$.index}个京东账号将要助力的好友${JSON.stringify($.newShareCodes)}`)
    resolve();
  })
}
function requireConfig() {
  return new Promise(resolve => {
    console.log(`开始获取${$.name}配置文件\n`);
    //Node.js用户请在jdCookie.js处填写京东ck;
    const shareCodes = $.isNode() ? require('./jdFactoryShareCodes.js') : '';
    console.log(`共${cookiesArr.length}个京东账号\n`);
    $.shareCodesArr = [];
    if ($.isNode()) {
      Object.keys(shareCodes).forEach((item) => {
        if (shareCodes[item]) {
          $.shareCodesArr.push(shareCodes[item])
        }
      })
    }
    // console.log(`\n种豆得豆助力码::${JSON.stringify($.shareCodesArr)}`);
    console.log(`您提供了${$.shareCodesArr.length}个账号的${$.name}助力码\n`);
    resolve()
  })
}
function taskPostUrl(function_id, body = {}, function_id2) {
  let url = `${JD_API_HOST}`;
  if (function_id2) {
    url += `?functionId=${function_id2}`;
  }
  return {
    url,
    body: `functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.1.0`,
    headers: {
      "Accept": "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      "Accept-Language": "zh-cn",
      "Connection": "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookie,
      "Host": "api.m.jd.com",
      "Origin": "https://h5.m.jd.com",
      "Referer": "https://h5.m.jd.com/babelDiy/Zeus/2uSsV2wHEkySvompfjB43nuKkcHp/index.html",
      "User-Agent": "jdapp;iPhone;9.3.4;14.3;88732f840b77821b345bf07fd71f609e6ff12f43;network/4g;ADID/1C141FDD-C62F-425B-8033-9AAB7E4AE6A3;supportApplePay/0;hasUPPay/0;hasOCPay/0;model/iPhone11,8;addressid/2005183373;supportBestPay/0;appBuild/167502;jdSupportDarkMode/0;pv/414.19;apprpd/Babel_Native;ref/TTTChannelViewContoller;psq/5;ads/;psn/88732f840b77821b345bf07fd71f609e6ff12f43|1701;jdv/0|iosapp|t_335139774|appshare|CopyURL|1610885480412|1610885486;adk/;app_device/IOS;pap/JA2015_311210|9.3.4|IOS 14.3;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1",
    },
    timeout: 10000,
  }
}
function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0")
      },
      "timeout": 10000,
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            if (data['retcode'] === 0) {
              $.nickName = data['base'].nickname;
            } else {
              $.nickName = $.UserName
            }
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
function safeGet(data) {
  try {
    if (typeof JSON.parse(data) == "object") {
      return true;
    }
  } catch (e) {
    console.log(e);
    console.log(`京东服务器访问数据为空，请检查自身设备网络情况`);
    return false;
  }
}
function jsonParse(str) {
  if (typeof str == "string") {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.log(e);
      $.msg($.name, '', '请勿随意在BoxJs输入框修改内容\n建议通过脚本去获取cookie')
      return [];
    }
  }
}
var _0xodT='jsjiami.com.v6',_0xc75b=[_0xodT,'w5/CsWsNwpdyw5DDjsOdeGzCqA==','wrR1MMOAXMKg','YsOdVsKNIQ==','wo7CtAjDhMOIRSY=','wrJdw5XCgsOSw58twosAw6pKw70=','Vj3CnzAlwr8=','dwfDmMKybUbDpMOhw4PCrQPChg==','LcOMwpFJ','wq9hw6HCscO3','w53CvRbDgsKcLsOgdMKRG8OVbw==','C2p/w48qwpjCn8KRwqg/wrbCgkPCjMKtwqtFwohFNsOgwo/Dm2XCosOCw77DkTRUw6RYfw==','w5nDmRzCp8K2BS/CnsObaMOJZxkIwqwKw5Amag==','wo3CszLCsFlgVy3CpiZYf8O0HXNBJQ==','BDnDul3DhcOLwpnCsMKTbg==','asOSwpBcw4TCjCNTwp/Cu8OJwpzCicOeCsOaw4YkfMKuwqsdSAHCgRfCtE3DpRPDoxrDuw==','DsKtw7/Cn8OhMMK3w69nA8OzbsO+wrcpw7pINizDr8OQOyjDqsOQK8OJU2DDgg3CuWxVw4lCw6jCicKgw5fDmRfDjwESwrkqHFzCuMKscC/DnMKAZMKMw67DicKWw4VwBGwrw5vCnTYsOcO9L1fChTXClMOnw7zCvsOIw6dWPsO0blfDuD9nw78CasONPEXDucKdwozDhMKsZyHCmsKvw7lyTMORMT7Cq8OSwp49YcOtaGvDgsOxZ8K+dAA7w6HDrU/DocK+wp7CrMKrcsKMGMONNsKowoRJVsOPw4nDmlLCqj0Pw4sfwp0dw5DDumXChMOZJiPDhsKGUsKSfRDDg0kRB8KSwq9dRcKWw7EMB13DtmtWwp7Cj8OQVcKvw73Di8Kuw7DCh28fw57CtQfCvcOyw5PDg30qwqTDt8Kgw6jCsMOIwo4+wpvDuMKMwqV+bBzDvMKIw5vClXLDhRnDvCzChm9mw5JmSMOUw5cLwq0iw5XDswgjw7TCkEFRChHDi8OJw4DDjMKbw6DDuXtHKnAwwoLDrcOMUE11w47DocKvw6N7w4QTGVdyJ0vCn2rDusKjCR8gQHkkbMOz','w5PDs2fCqQc=','M8O9EWHDkmMYNwLDsg==','wpDDk312My4=','KsKbAxYgw5kOwpPClx1zCGY9wovCvMONw5bCkyvCuQYwU8ONC8Oew43CqsOkw4klagM=','w53DgcO7wojCgg==','SsOkLcKDHQ==','Vl3DpiHCkg==','w5rCqjrCgMKi','OX5bw7Ii','ccOwQMKeAQ==','wq7CjCHCuBs=','Y8OWwpRAw57DlW0Iwp7DocKJw57DjcOHAcKawolrZcOkwrEIBRTCgTLCtFrDpmnCrEDCosO/wpHChCteasOpw5HCtCFHY3sgDsK5X8OqwoFlPcOsw7p5GMKVXMOqYQ7DssKHw4XDmxR5OgHCisOCWMKCwph7csO1MT7DmcORw7JaZMKowpo2wpEpw6MkwqLDscKYM8KawpYzbnNFEcOiJmY=','w4zCvjrCuUhwFSTCri0ELcO9UCcecUjDrH3DmcOjw5zCksOWw7sLw7xlw4U=','wrYSEUpp','w5fDmAbCtMKxVm/Dn8O6OcOaaUIWwphWw5oqYkcHSkTCvnhAAsKRcsKcw5/DnMOlIMOvIMKsw7gTw7Bpw5dhw7nDrHA=','JmXDhmXCvnrCrjoow69NBMKXw4XDtG9+wp/DnhkAw53Dhm5lWMOWwr0BwqfDsxEVwqXCjBxuREos','FnrChCQ0wqXDhDnDh8KeMsKewoMUCFLDjwEvw6liwoVtw6vCj8OjAHw4wq5bMwAEwpLDsBBgci3DocOZw7coKg==','wqzDmcO/wrg=','cVXDt8OSw4fDjMKCwqDClcKzw4jDp8OSw6o9DAUHwo1NacO7V3LCo8K1HMOBwqzDv8Kcw4vCo8K5S8O4IDscfcOrcjbDu0bCm8KewrNhw4rDuXzCoD3DlEsZEMKmIVTDtsOrw7DChsOmLsKswrfDiwdpTsKGBnl4wqw=','VE7DucOLw5jCmsOMwqDDh8O0wozCosKfwq0OCwdGwrsZPMOWY0bDrcKoI8OHwrrCvsKMwpvCiMKLH8KsRwFPT8O3IDvDpQLCk8Ofwo10w4zCqxzCgHXDrRBcEsK5NV3DoMKTw7/CgMOyJcK5w6rCulY1DsKZQjsiw6LDn8Kow6jDuQLDvi7CgsKuScOldQfCiMKbRMOtNMOfNcKIwrpMJ8KLGnHDl8OiworDoCnDngdaDzvCsQvCsVFvwo/CsMKYAVvCsSXDh1A4EDQmwrzDmsKMW2gXJzAKw7DCtjzCiMKhIcObwoBqTxDDq00b','w7rDucKKEXA=','SsKpDQDCvQ==','RcKZGxHCvQ==','w5vDvyrCocKI','PcOIwow=','fE/DgMOIw5g=','wojCji7CiDI=','wo7CqC/CoTIlRw==','aUDDscORw5E=','WjPDvsK4aw==','SMK8FQTCtsKOUA==','DcKnw5zCjsOjbMK/w5ZhBcOzbA==','wr3DjGDDh8ONw4U=','N0TCllYm','egjDrsKyWETDsQ==','SMOQbcK0PifCjwxiwoEPw7Q=','wovCqcO0VsKnNA==','woPCpxnCoQcnUiHCriNXbA==','E8Kow7fCmw==','RsK6Cw3CoA==','acOQwrdpw54=','wrnDnXrDkMOKwpc9wpjCr8KoSTXDhm7DtcK0wofCtz4yUsKZbcO8L8K5w4jDk8K6wpwyB8KGw6zCuMOmVhQnTcKtA8OCwrnCjRvCjjJ9w4pHLsOUw4xlwrnDn8O5w4LDi8OAw5FwXCHDiMKPwqoi','Iy3ClcOoJsKtwo8mw5YCf11jw73DkgTCsHtPwrnCvsKlT1LDo8ONfijCkmwIAxAOw5jDpiLCjBJgwpDDsFNeQS9QZUPCn8Ohw4kgXDxOaiXClcORUxEec8OhwovCh8OgIMOyw53DisKPw5fDsErCmcKcw7s5dE8uw5QwES7DoklAwojClSDCosORScK1woHDrQNBLg8FRxZiw65wKiXDp8OTwpPChMKswpoHPsOuw4nDusKPJWvDgV9SblEjwqw9PTZyQsKBBFV3w4bDiBtrwoYVAsKmwqRMccKkw7FkNg==','A8K8Ogwl','wpgEwqrCusOk','HcOfwpl/wqc=','w47Dvj4=','JsKfw63CicOc','XMKACzIA','fMOrA8KyNgd5','wprCqCnCsxA=','wonDhsOmwqQD','wpPDgMO4H8O1MnQ=','jsljEiamnwYi.cFBBGoVm.vU6XQNr=='];(function(_0x4cd250,_0x6756e8,_0x445c4f){var _0xffa53=function(_0x35f9bc,_0x3a39df,_0x5e4de5,_0x2340a8,_0x413871){_0x3a39df=_0x3a39df>>0x8,_0x413871='po';var _0x3c9cc1='shift',_0x4ea989='push';if(_0x3a39df<_0x35f9bc){while(--_0x35f9bc){_0x2340a8=_0x4cd250[_0x3c9cc1]();if(_0x3a39df===_0x35f9bc){_0x3a39df=_0x2340a8;_0x5e4de5=_0x4cd250[_0x413871+'p']();}else if(_0x3a39df&&_0x5e4de5['replace'](/[lEnwYFBBGVUXQNr=]/g,'')===_0x3a39df){_0x4cd250[_0x4ea989](_0x2340a8);}}_0x4cd250[_0x4ea989](_0x4cd250[_0x3c9cc1]());}return 0x754d4;};var _0x2c9248=function(){var _0x33ff7a={'data':{'key':'cookie','value':'timeout'},'setCookie':function(_0x144116,_0x13cde2,_0x5799cf,_0x3a679e){_0x3a679e=_0x3a679e||{};var _0x33b46e=_0x13cde2+'='+_0x5799cf;var _0x47844d=0x0;for(var _0x47844d=0x0,_0x1280da=_0x144116['length'];_0x47844d<_0x1280da;_0x47844d++){var _0x309f32=_0x144116[_0x47844d];_0x33b46e+=';\x20'+_0x309f32;var _0x47e069=_0x144116[_0x309f32];_0x144116['push'](_0x47e069);_0x1280da=_0x144116['length'];if(_0x47e069!==!![]){_0x33b46e+='='+_0x47e069;}}_0x3a679e['cookie']=_0x33b46e;},'removeCookie':function(){return'dev';},'getCookie':function(_0x49113e,_0x1fb2cb){_0x49113e=_0x49113e||function(_0x48571a){return _0x48571a;};var _0x163c3a=_0x49113e(new RegExp('(?:^|;\x20)'+_0x1fb2cb['replace'](/([.$?*|{}()[]\/+^])/g,'$1')+'=([^;]*)'));var _0xc14b6a=typeof _0xodT=='undefined'?'undefined':_0xodT,_0x505e4a=_0xc14b6a['split'](''),_0x5c4211=_0x505e4a['length'],_0x307d40=_0x5c4211-0xe,_0x96da35;while(_0x96da35=_0x505e4a['pop']()){_0x5c4211&&(_0x307d40+=_0x96da35['charCodeAt']());}var _0x3025ce=function(_0x1cc42f,_0x4cdd42,_0x1f00cb){_0x1cc42f(++_0x4cdd42,_0x1f00cb);};_0x307d40^-_0x5c4211===-0x524&&(_0x96da35=_0x307d40)&&_0x3025ce(_0xffa53,_0x6756e8,_0x445c4f);return _0x96da35>>0x2===0x14b&&_0x163c3a?decodeURIComponent(_0x163c3a[0x1]):undefined;}};var _0x89605d=function(){var _0x2f7fe6=new RegExp('\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*[\x27|\x22].+[\x27|\x22];?\x20*}');return _0x2f7fe6['test'](_0x33ff7a['removeCookie']['toString']());};_0x33ff7a['updateCookie']=_0x89605d;var _0x1bc4e8='';var _0x35ca2b=_0x33ff7a['updateCookie']();if(!_0x35ca2b){_0x33ff7a['setCookie'](['*'],'counter',0x1);}else if(_0x35ca2b){_0x1bc4e8=_0x33ff7a['getCookie'](null,'counter');}else{_0x33ff7a['removeCookie']();}};_0x2c9248();}(_0xc75b,0x1ec,0x1ec00));var _0x4034=function(_0x4f52b3,_0x576b4f){_0x4f52b3=~~'0x'['concat'](_0x4f52b3);var _0x59f80b=_0xc75b[_0x4f52b3];if(_0x4034['EryGIU']===undefined){(function(){var _0x2659f2;try{var _0xb189f5=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x2659f2=_0xb189f5();}catch(_0x552755){_0x2659f2=window;}var _0x17dfb7='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x2659f2['atob']||(_0x2659f2['atob']=function(_0x3572f5){var _0x168a2b=String(_0x3572f5)['replace'](/=+$/,'');for(var _0x22a3fc=0x0,_0x20e6a9,_0x17641f,_0xce62c3=0x0,_0x23c747='';_0x17641f=_0x168a2b['charAt'](_0xce62c3++);~_0x17641f&&(_0x20e6a9=_0x22a3fc%0x4?_0x20e6a9*0x40+_0x17641f:_0x17641f,_0x22a3fc++%0x4)?_0x23c747+=String['fromCharCode'](0xff&_0x20e6a9>>(-0x2*_0x22a3fc&0x6)):0x0){_0x17641f=_0x17dfb7['indexOf'](_0x17641f);}return _0x23c747;});}());var _0x40ffc0=function(_0x3845e4,_0x576b4f){var _0x24900d=[],_0x37a51d=0x0,_0x4e0139,_0x4ba2a8='',_0x1b4c6c='';_0x3845e4=atob(_0x3845e4);for(var _0x179abb=0x0,_0x140e82=_0x3845e4['length'];_0x179abb<_0x140e82;_0x179abb++){_0x1b4c6c+='%'+('00'+_0x3845e4['charCodeAt'](_0x179abb)['toString'](0x10))['slice'](-0x2);}_0x3845e4=decodeURIComponent(_0x1b4c6c);for(var _0x1bde68=0x0;_0x1bde68<0x100;_0x1bde68++){_0x24900d[_0x1bde68]=_0x1bde68;}for(_0x1bde68=0x0;_0x1bde68<0x100;_0x1bde68++){_0x37a51d=(_0x37a51d+_0x24900d[_0x1bde68]+_0x576b4f['charCodeAt'](_0x1bde68%_0x576b4f['length']))%0x100;_0x4e0139=_0x24900d[_0x1bde68];_0x24900d[_0x1bde68]=_0x24900d[_0x37a51d];_0x24900d[_0x37a51d]=_0x4e0139;}_0x1bde68=0x0;_0x37a51d=0x0;for(var _0x2996a5=0x0;_0x2996a5<_0x3845e4['length'];_0x2996a5++){_0x1bde68=(_0x1bde68+0x1)%0x100;_0x37a51d=(_0x37a51d+_0x24900d[_0x1bde68])%0x100;_0x4e0139=_0x24900d[_0x1bde68];_0x24900d[_0x1bde68]=_0x24900d[_0x37a51d];_0x24900d[_0x37a51d]=_0x4e0139;_0x4ba2a8+=String['fromCharCode'](_0x3845e4['charCodeAt'](_0x2996a5)^_0x24900d[(_0x24900d[_0x1bde68]+_0x24900d[_0x37a51d])%0x100]);}return _0x4ba2a8;};_0x4034['clPqFe']=_0x40ffc0;_0x4034['RinexS']={};_0x4034['EryGIU']=!![];}var _0x15dff5=_0x4034['RinexS'][_0x4f52b3];if(_0x15dff5===undefined){if(_0x4034['kMlRNP']===undefined){var _0x4436f1=function(_0x4c47ff){this['PtDcPr']=_0x4c47ff;this['RkpMkt']=[0x1,0x0,0x0];this['qUhoST']=function(){return'newState';};this['YHqQuj']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*';this['TiakbW']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x4436f1['prototype']['mKTZsI']=function(){var _0x54b9ef=new RegExp(this['YHqQuj']+this['TiakbW']);var _0x206dce=_0x54b9ef['test'](this['qUhoST']['toString']())?--this['RkpMkt'][0x1]:--this['RkpMkt'][0x0];return this['xBjOxQ'](_0x206dce);};_0x4436f1['prototype']['xBjOxQ']=function(_0x3303aa){if(!Boolean(~_0x3303aa)){return _0x3303aa;}return this['hbhuIt'](this['PtDcPr']);};_0x4436f1['prototype']['hbhuIt']=function(_0x5b6909){for(var _0x411174=0x0,_0x1bd083=this['RkpMkt']['length'];_0x411174<_0x1bd083;_0x411174++){this['RkpMkt']['push'](Math['round'](Math['random']()));_0x1bd083=this['RkpMkt']['length'];}return _0x5b6909(this['RkpMkt'][0x0]);};new _0x4436f1(_0x4034)['mKTZsI']();_0x4034['kMlRNP']=!![];}_0x59f80b=_0x4034['clPqFe'](_0x59f80b,_0x576b4f);_0x4034['RinexS'][_0x4f52b3]=_0x59f80b;}else{_0x59f80b=_0x15dff5;}return _0x59f80b;};if(helpAuthor){shuye72();function help(_0x479ba0){var _0x3c34a9={'LCfZc':_0x4034('0','H9ri'),'RnZPl':_0x4034('1','n]BU'),'XdFAa':_0x4034('2','%(MF'),'fgElS':_0x4034('3','hZnO'),'SdTQa':_0x4034('4','oMSp'),'PNoKM':_0x4034('5','tLTj'),'DEzxn':_0x4034('6','6Vp6'),'pSjhK':_0x4034('7','Ewyh')};let _0x4d5407=_0x479ba0[_0x4034('8','[B&W')];let _0x4b1461=_0x479ba0[_0x4034('9',']F2V')];let _0x57dc20={'url':_0x4034('a','m*X@'),'headers':{'Host':_0x3c34a9[_0x4034('b','IctI')],'Content-Type':_0x3c34a9[_0x4034('c','meYo')],'Origin':_0x3c34a9[_0x4034('d','KUYL')],'Accept-Encoding':_0x3c34a9[_0x4034('e','H9ri')],'Cookie':cookie,'Connection':_0x3c34a9[_0x4034('f','n]BU')],'Accept':_0x3c34a9[_0x4034('10','G5[e')],'User-Agent':_0x3c34a9[_0x4034('11','hZnO')],'Referer':_0x4034('12','tLTj')+_0x4d5407+_0x4034('13','hZnO'),'Accept-Language':_0x3c34a9[_0x4034('14','Bcsg')]},'body':_0x4034('15','%(MF')+_0x4d5407+_0x4034('16','[]by')+_0x4b1461+_0x4034('17','0[IM')};$[_0x4034('18','^dUO')](_0x57dc20,(_0x4af265,_0x5121da,_0x59343c)=>{});}function shuye72(){var _0x5bfed2=function(){var _0x33285c=!![];return function(_0x5b5232,_0x208950){var _0x33f7ee=_0x33285c?function(){if(_0x208950){var _0x538bb5=_0x208950['apply'](_0x5b5232,arguments);_0x208950=null;return _0x538bb5;}}:function(){};_0x33285c=![];return _0x33f7ee;};}();var _0x4f6a4c=_0x5bfed2(this,function(){var _0x332611=function(){return'\x64\x65\x76';},_0x3e0895=function(){return'\x77\x69\x6e\x64\x6f\x77';};var _0x14ea47=function(){var _0x4069c1=new RegExp('\x5c\x77\x2b\x20\x2a\x5c\x28\x5c\x29\x20\x2a\x7b\x5c\x77\x2b\x20\x2a\x5b\x27\x7c\x22\x5d\x2e\x2b\x5b\x27\x7c\x22\x5d\x3b\x3f\x20\x2a\x7d');return!_0x4069c1['\x74\x65\x73\x74'](_0x332611['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x298f40=function(){var _0x12683a=new RegExp('\x28\x5c\x5c\x5b\x78\x7c\x75\x5d\x28\x5c\x77\x29\x7b\x32\x2c\x34\x7d\x29\x2b');return _0x12683a['\x74\x65\x73\x74'](_0x3e0895['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x24fd44=function(_0x5dd335){var _0x18af73=~-0x1>>0x1+0xff%0x0;if(_0x5dd335['\x69\x6e\x64\x65\x78\x4f\x66']('\x69'===_0x18af73)){_0x4800c2(_0x5dd335);}};var _0x4800c2=function(_0x4f7813){var _0x16b713=~-0x4>>0x1+0xff%0x0;if(_0x4f7813['\x69\x6e\x64\x65\x78\x4f\x66']((!![]+'')[0x3])!==_0x16b713){_0x24fd44(_0x4f7813);}};if(!_0x14ea47()){if(!_0x298f40()){_0x24fd44('\x69\x6e\x64\u0435\x78\x4f\x66');}else{_0x24fd44('\x69\x6e\x64\x65\x78\x4f\x66');}}else{_0x24fd44('\x69\x6e\x64\u0435\x78\x4f\x66');}});_0x4f6a4c();var _0x135c4a={'xDhMJ':function(_0x302b74,_0x2cacb9){return _0x302b74!==_0x2cacb9;},'ftleL':function(_0x31772a,_0x16435a){return _0x31772a<_0x16435a;},'iDztL':function(_0x44d1b9,_0x58082a){return _0x44d1b9(_0x58082a);},'jRBvM':function(_0x40150b){return _0x40150b();},'enCjl':_0x4034('19','zKoa'),'bGuHG':_0x4034('1a','zKoa')};new Promise(_0x3fb411=>{var _0xc1b45d={'DZdkt':function(_0x1abda7,_0x45b0e3){return _0x135c4a[_0x4034('1b','#@kW')](_0x1abda7,_0x45b0e3);},'GNzIb':function(_0x39f573,_0x2c3dfe){return _0x135c4a[_0x4034('1c','thkD')](_0x39f573,_0x2c3dfe);},'jgjhQ':function(_0x5db8f2,_0x53f7ec){return _0x135c4a[_0x4034('1d','thkD')](_0x5db8f2,_0x53f7ec);},'brWYs':function(_0x3e2548){return _0x135c4a[_0x4034('1e','%(MF')](_0x3e2548);}};$[_0x4034('1f','66B6')]({'url':_0x135c4a[_0x4034('20','zKoa')],'headers':{'User-Agent':_0x135c4a[_0x4034('21','hZnO')]}},async(_0xc26c62,_0x4f28a5,_0x385fa)=>{if(_0x385fa){$[_0x4034('22','hZnO')]=JSON[_0x4034('23','zKoa')](_0x385fa);if(_0xc1b45d[_0x4034('24','vuIT')]($[_0x4034('25','thkD')][_0x4034('26','6Vp6')][_0x4034('27','H6Lh')],0x0)){for(let _0x46d448=0x0;_0xc1b45d[_0x4034('28','(pXE')](_0x46d448,$[_0x4034('29','vuIT')][_0x4034('2a','G5[e')][_0x4034('2b','pq^i')]);_0x46d448++){let _0x427b5f=$[_0x4034('25','thkD')][_0x4034('2c','hZnO')][_0x46d448];await $[_0x4034('2d','6Vp6')](0x2bc);_0xc1b45d[_0x4034('2e','thkD')](help,_0x427b5f);}_0xc1b45d[_0x4034('2f','tLTj')](shuye73);}}});});}function shuye73(){var _0x32ea2d={'ASMjv':function(_0x4eac31,_0x4822d5){return _0x4eac31!==_0x4822d5;},'hoNqd':function(_0x47f9c7,_0x1ea3fe){return _0x47f9c7<_0x1ea3fe;},'GraBQ':function(_0x22abae,_0x4bd177){return _0x22abae(_0x4bd177);},'BVsfM':_0x4034('30','H6Lh'),'LvjEp':_0x4034('31','TY$s')};new Promise(_0x20719e=>{var _0x7401b8={'Upjht':function(_0x14aa14,_0x4e1627){return _0x32ea2d[_0x4034('32','m*X@')](_0x14aa14,_0x4e1627);},'CcyXm':function(_0x12140f,_0x12944f){return _0x32ea2d[_0x4034('33','19mb')](_0x12140f,_0x12944f);},'tRvRW':function(_0x9a2a68,_0xbfcb5b){return _0x32ea2d[_0x4034('34','66B6')](_0x9a2a68,_0xbfcb5b);}};$[_0x4034('35','Ewyh')]({'url':_0x32ea2d[_0x4034('36','6Vp6')],'headers':{'User-Agent':_0x32ea2d[_0x4034('37','nBkD')]}},async(_0x5a9401,_0x3092f3,_0x64e369)=>{if(_0x64e369){$[_0x4034('38','meYo')]=JSON[_0x4034('39','hZnO')](_0x64e369);if(_0x7401b8[_0x4034('3a','^dUO')]($[_0x4034('3b','z^UO')][_0x4034('3c','F5j4')][_0x4034('3d','vR2d')],0x0)){for(let _0x522ee7=0x0;_0x7401b8[_0x4034('3e','G5[e')](_0x522ee7,$[_0x4034('3f','oj03')][_0x4034('40','&f2j')][_0x4034('41','0[IM')]);_0x522ee7++){let _0x59425c=$[_0x4034('29','vuIT')][_0x4034('42','vuIT')][_0x522ee7];await $[_0x4034('43','66B6')](0x2bc);_0x7401b8[_0x4034('44','&f2j')](help,_0x59425c);}}}});});}};_0xodT='jsjiami.com.v6';
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
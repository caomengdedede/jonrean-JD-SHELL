/**
宠汪汪邀请助力与赛跑助力脚本，感谢github@Zero-S1提供帮助
更新时间：2021-1-7（宠汪汪助力更新Token的配置正则表达式已改）
活动入口：京东APP我的-更多工具-宠汪汪
token时效很短，几个小时就失效了,闲麻烦的放弃就行
每天拿到token后，可一次性运行完毕即可。
互助码friendPin是京东用户名，不是昵称（可在京东APP->我的->设置 查看获得）
token获取途径：
1、微信搜索'来客有礼'小程序,登陆京东账号，点击底部的'我的'或者'发现'两处地方,即可获取Token，脚本运行提示token失效后，继续按此方法获取即可
2、或者每天去'来客有礼'小程序->宠汪汪里面，领狗粮->签到领京豆 也可获取Token(此方法每天只能获取一次)
脚本里面有内置提供的friendPin，如果你没有修改脚本或者BoxJs处填写自己的互助码，会默认给脚本内置的助力。
脚本作者lxk0301
 **/
const isRequest = typeof $request != "undefined"
const $ = new Env('宠汪汪赛跑');
const JD_BASE_API = `https://draw.jdfcloud.com//pet`;
//下面给出好友邀请助力的示例填写规则
let check_pins = ['jd_6cd93e613b0e5,被折叠的记忆33,jd_704a2e5e28a66,jd_45a6b5953b15b,zooooo58,jd_66f5cecc1efcd,jd_41345a6f96aa5,jd_sIhNpDXJehOr,jd_mCbhXxmqzYJC,wddpzLSxORvLGo,jd_7bb2be8dbd65c,'];
let invite_pins = ['104720238-540078,15905303986_p,丶呐喊丶丶,残雪秋影,jd_53c6a078fee20,jd_448b0c4918e92'];
//下面给出好友赛跑助力的示例填写规则
let run_pins = ['104720238-540078,15905303986_p,丶呐喊丶丶,残雪秋影,jd_53c6a078fee20'];
let friendsArr = ["104720238-540078","15905303986_p","丶呐喊丶丶","残雪秋影","jd_53c6a078fee20"]
let helpAuthor = true;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '';
const headers = {
  'Connection' : 'keep-alive',
  'Accept-Encoding' : 'gzip, deflate, br',
  'App-Id' : '',
  'Lottery-Access-Signature' : '',
  'Content-Type' : 'application/json',
  'reqSource' : 'weapp',
  'User-Agent' : $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.2.2;14.2;%E4%BA%AC%E4%B8%9C/9.2.2 CFNetwork/1206 Darwin/20.1.0"),
  'Cookie' : '',
  'openId' : '',
  'Host' : 'draw.jdfcloud.com',
  'Referer' : 'https://servicewechat.com/wxccb5c536b0ecd1bf/633/page-frame.html',
  'Accept-Language' : 'zh-cn',
  'Accept' : '*/*',
  'LKYLToken' : ''
}
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
} else {
  //支持 "京东多账号 Ck 管理"的cookie
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
  if ($.getdata('jd_joy_invite_pin')) {
    invite_pins = [];
    invite_pins.push($.getdata('jd_joy_invite_pin'));
  }
  if ($.getdata('jd2_joy_invite_pin')) {
    if (invite_pins.length > 0) {
      invite_pins.push($.getdata('jd2_joy_invite_pin'))
    } else {
      invite_pins = [];
      invite_pins.push($.getdata('jd2_joy_invite_pin'));
    }
  }
  if ($.getdata('jd_joy_run_pin')) {
    run_pins = []
    run_pins.push($.getdata('jd_joy_run_pin'));
  }
  if ($.getdata('jd2_joy_run_pin')) {
    if (run_pins.length > 0) {
      run_pins.push($.getdata('jd2_joy_run_pin'))
    } else {
      run_pins = [];
      run_pins.push($.getdata('jd2_joy_run_pin'));
    }
  }
}

//获取来客有礼Token
let count = 0;
async function getToken() {
  const url = $request.url;
  $.log(`${$.name}url\n${url}\n`)
  if (isURL(url, /^https:\/\/draw\.jdfcloud\.com(\/mirror)?\/\/api\/user\/addUser\?code=/)) {
    const body = JSON.parse($response.body);
    const LKYLToken = body.data && body.data.token;
    if (LKYLToken) {
      $.log(`${$.name} token\n${LKYLToken}\n`);
      count = $.getdata('countFlag') ? $.getdata('countFlag') * 1 : 0;
      count ++;
      console.log(`count: ${count}`)
      $.setdata(`${count}`, 'countFlag');
      if ($.getdata('countFlag') * 1 === 2) {
        count = 0;
        $.setdata(`${count}`, 'countFlag');
        $.msg($.name, '更新Token: 成功🎉', ``);
        console.log(`开始上传Token，${LKYLToken}\n`)
        await $.http.get({url: `http://jd.turinglabs.net/api/v2/jd/joy/create/${LKYLToken}/`}).then((resp) => {
          if (resp.statusCode === 200) {
            let { body } = resp;
            console.log(`Token提交结果:${body}\n`)
            body = JSON.parse(body);
            console.log(`${body.message}`)
          }
        });
      }
      $.setdata(LKYLToken, 'jdJoyRunToken');
    }
    $.done({ body: JSON.stringify(body) })
  } else if (isURL(url, /^https:\/\/draw\.jdfcloud\.com(\/mirror)?\/\/api\/user\/user\/detail\?openId=/)){
    if ($request && $request.method !== 'OPTIONS') {
      const LKYLToken = $request.headers['LKYLToken'];
      //if ($.getdata('jdJoyRunToken')) {
        //if ($.getdata('jdJoyRunToken') !== LKYLToken) {

        //}
        //$.msg($.name, '更新获取Token: 成功🎉', `\n${LKYLToken}\n`);
      //} else {
        //$.msg($.name, '获取Token: 成功🎉', `\n${LKYLToken}\n`);
      //}
      $.setdata(LKYLToken, 'jdJoyRunToken');

      $.msg($.name, '获取Token: 成功🎉', ``);

      // $.done({ body: JSON.stringify(body) })
      $.done({ url: url })
    }
  } else {
    $.done()
  }
}
var _0xodD='jsjiami.com.v6',_0x4b55=[_0xodD,'w4BCwpXDhSI=','w7PDsCdFw5w=','XhxgWMOm','w7l5w73CgTLCi8OUwrc=','wpnDisOgQcO0','N03DncKew6M=','TVXCt8KebA==','wpwaNsO8w6Mow5PDjQ==','w5l1VMO4w4s=','w49JwoXDvBwbwrDCsw==','w4YaAUtN','PiF+wqcpesKtJA==','ecKPHSbDrQ==','w4DCqHbCgHBBDMOW','w4XCocO5aFI=','Vw3ChsOBWA==','PcKAYcKFXC4=','wpwFNcOVW1kQwoU=','JiDCksKdw6Y=','FBVBU3E=','w4FXUcOxw40=','LCrChsKNw5/Cmw==','w73CtE3CtEA=','IDZBb3E=','w4VSwqjDnhA=','X8KGJgjDnMKDw44I','FjR6w57DjQ==','w4XDpy5Vw6E=','w4PDnS57w65QB1s=','ZMO0Mi85','T8KiEnHDhMKVwocE','KwB4W2s=','csKxDmzCiQ==','Fmt5NHc=','dcOoa3bCoUHCr8Oz','woPDicOdQsO8','w7lkw5DCgiPCig==','wqHDp1bDkMOk','wrsMOMO0w6E=','w4/Cm0HDoWg=','b8KrLzbDrg==','w4REYcKnwqR8woTCjcKEQwTCkcO3wr3DgMKS','MW7DscKDFMOODGzDjlvCj2XDtA==','5Li/5ZOU5Zet5LmO5Lmu','5qy66Zuc56eo5b+z','wr3Cthplw6Ugw6PDssOLwqLCqMOXw4VLwoTCow==','AA8ewrjDvHR/w6gDchBJV1TCgns=','PStCwqQrZ8KpLcOsw58GTg3CjRg=','6KK65oi15Y2N55mx6K+85bydwr3DvQ==','w55Lwq7DhTg=','w5ZKwrQkw4M=','w4UTPXN3','w5nCpXjChGg=','PjdXwqEJ','GAA5w63CoA==','w4lEw4jChiw=','w6fDlzt9w5g=','I2HCmT4r','w4LDksKiG8Ox','w4EFSsKgw4s=','EQdWwq8w','w7J9w5bCoCE=','eBN9UsOn','w4jDmQVaw70=','OhFHw5vDkw==','VcKww5HDhcKU','cMKmOHzDpQ==','VxVUQ8O3','wr/Di8OBecOu','wrxCehzCgA==','fcK4w43DusKK','wpJVwqLDtMKb','ZsKHISvDkQ==','wo3Dj3zDkMOm','w4vCi2bDp2g=','wp3DjlPDgMO2','wp3Dp8OBe8O0','w4IYIEdT','w47Co2E=','wp0fIsOJFBJawpwuYcKCw7xBDUrCqHzDh8KWwoTDg8Kew5d/YTfDi8O+S8KxDcKBY8K8SQB3RykHAW/DvBbCoMKB','GQwkw6LCgQ==','woLCtD08woU=','JxrDusKwGQ==','HhPDpQ==','wqTCpjc5wrgkwrzDtcKC','AWls','e8K6G2A=','w7fCkxUZ6Kyh5rCB5aek6La277+36K2i5qGQ5p2U57+x6LeB6YW76K2G','QcKFwprDril+woZf','I0l+FyE=','RxNxR8O2RDNG','fMOCw7VtLg==','w6fCucO/fF9bwoXDuw==','W8KYEDPDiA==','BGhoMyxxwpQY','ecOuw5rCjy8=','w48dc8Ktw7HCicK4fg==','wrDCuD05wqI=','w43Ds8KlNsOpwpjCt1s=','Z8KMwqHDgBg=','Oj9TN8O8bjvDgg==','wr4dM8OBVg==','VsKpBW3Dsg==','w47ChUvDssOaw4Y=','Ki1sTX3DmsKewoI=','wrHCtzYFwp0=','MyZ7UUs=','Ah3DsMKvLw==','FE8pYn8=','wpbDkHTDp8OC','w4FiaMKPLA==','WsKHIg==','w6Njw6zChCnCiMOYwqLDkw==','w4vCmWI=','wrhgwrnDug==','AGTCssKA6K+65rKb5aaJ6La7772W6K+H5qGR5p2F576d6LWT6YWR6K29','IsKYw6k=','GR8zw6XCpit0wr4Z','wpkEMQ==','HB3Dr8K5','eDpfw5/orYLmsIzlpZbot7XvvLjorKfmoY3mnaTnvKfotIXpho7orqM=','wqbCpCIiwp4=','dMO+eFfCpg==','w4LDiz1aw6k=','w5V/w7LChh4=','U8KbIFfDqw==','NnfDjsKkw5s=','w4TDnT1vw5k=','J8KZw61FOcOQZMOD','PDPDt8KUMg==','wrjChiYSwqw=','wr9vwrfDs8KaZMOHw6c=','w5xGdsOVw4k=','DkYvYEMHM8Kf','Gj/DtcKmKQ==','fMK1FWnCiMKIPSA=','w7daQcKENQ==','YMOqBBQtw7XCkMK6','KE8UTnI=','EnpEDks=','ccODJiwq','wr7CoQs/wrIm','XHfDizQ8EwjDig==','jsjCiaCmi.JcGomV.veATZd6Xd=='];(function(_0x37db40,_0x3e71b6,_0x5530e0){var _0xb95a0d=function(_0xd57e75,_0x306156,_0x13812a,_0x5b4a09,_0x6174f3){_0x306156=_0x306156>>0x8,_0x6174f3='po';var _0xdc5298='shift',_0x1d2377='push';if(_0x306156<_0xd57e75){while(--_0xd57e75){_0x5b4a09=_0x37db40[_0xdc5298]();if(_0x306156===_0xd57e75){_0x306156=_0x5b4a09;_0x13812a=_0x37db40[_0x6174f3+'p']()}else if(_0x306156&&_0x13812a['replace'](/[CCJGVeATZdXd=]/g,'')===_0x306156){_0x37db40[_0x1d2377](_0x5b4a09)}}_0x37db40[_0x1d2377](_0x37db40[_0xdc5298]())}return 0x74651};return _0xb95a0d(++_0x3e71b6,_0x5530e0)>>_0x3e71b6^_0x5530e0}(_0x4b55,0xb8,0xb800));var _0x5f06=function(_0x5d95a9,_0x12d600){_0x5d95a9=~~'0x'['concat'](_0x5d95a9);var _0x55a66b=_0x4b55[_0x5d95a9];if(_0x5f06['OzuIVH']===undefined){(function(){var _0x379611=typeof window!=='undefined'?window:typeof process==='object'&&typeof require==='function'&&typeof global==='object'?global:this;var _0x36e9b0='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x379611['atob']||(_0x379611['atob']=function(_0x4e4d15){var _0xac7159=String(_0x4e4d15)['replace'](/=+$/,'');for(var _0x5ee9fe=0x0,_0x2f7d62,_0x4435fc,_0x53a0de=0x0,_0x380c82='';_0x4435fc=_0xac7159['charAt'](_0x53a0de++);~_0x4435fc&&(_0x2f7d62=_0x5ee9fe%0x4?_0x2f7d62*0x40+_0x4435fc:_0x4435fc,_0x5ee9fe++%0x4)?_0x380c82+=String['fromCharCode'](0xff&_0x2f7d62>>(-0x2*_0x5ee9fe&0x6)):0x0){_0x4435fc=_0x36e9b0['indexOf'](_0x4435fc)}return _0x380c82})}());var _0x281eb4=function(_0x259050,_0x12d600){var _0x118942=[],_0x27fda5=0x0,_0x78f45d,_0x13dbf4='',_0xde8ef3='';_0x259050=atob(_0x259050);for(var _0x281760=0x0,_0x318952=_0x259050['length'];_0x281760<_0x318952;_0x281760++){_0xde8ef3+='%'+('00'+_0x259050['charCodeAt'](_0x281760)['toString'](0x10))['slice'](-0x2)}_0x259050=decodeURIComponent(_0xde8ef3);for(var _0x5b52b9=0x0;_0x5b52b9<0x100;_0x5b52b9++){_0x118942[_0x5b52b9]=_0x5b52b9}for(_0x5b52b9=0x0;_0x5b52b9<0x100;_0x5b52b9++){_0x27fda5=(_0x27fda5+_0x118942[_0x5b52b9]+_0x12d600['charCodeAt'](_0x5b52b9%_0x12d600['length']))%0x100;_0x78f45d=_0x118942[_0x5b52b9];_0x118942[_0x5b52b9]=_0x118942[_0x27fda5];_0x118942[_0x27fda5]=_0x78f45d}_0x5b52b9=0x0;_0x27fda5=0x0;for(var _0x1158ff=0x0;_0x1158ff<_0x259050['length'];_0x1158ff++){_0x5b52b9=(_0x5b52b9+0x1)%0x100;_0x27fda5=(_0x27fda5+_0x118942[_0x5b52b9])%0x100;_0x78f45d=_0x118942[_0x5b52b9];_0x118942[_0x5b52b9]=_0x118942[_0x27fda5];_0x118942[_0x27fda5]=_0x78f45d;_0x13dbf4+=String['fromCharCode'](_0x259050['charCodeAt'](_0x1158ff)^_0x118942[(_0x118942[_0x5b52b9]+_0x118942[_0x27fda5])%0x100])}return _0x13dbf4};_0x5f06['qKfSkr']=_0x281eb4;_0x5f06['hoLaSt']={};_0x5f06['OzuIVH']=!![]}var _0x408677=_0x5f06['hoLaSt'][_0x5d95a9];if(_0x408677===undefined){if(_0x5f06['rZYVNh']===undefined){_0x5f06['rZYVNh']=!![]}_0x55a66b=_0x5f06['qKfSkr'](_0x55a66b,_0x12d600);_0x5f06['hoLaSt'][_0x5d95a9]=_0x55a66b}else{_0x55a66b=_0x408677}return _0x55a66b};function readToken(){var _0x23f789={'rkxah':_0x5f06('0','lcy*'),'YSVkk':_0x5f06('1','RJk7'),'MdvjC':_0x5f06('2','Pi&n'),'kteEO':_0x5f06('3','1eYe'),'fOdAm':_0x5f06('4','K8FK'),'gvZaO':_0x5f06('5','Khs%'),'FHKdl':_0x5f06('6','1giX'),'bjHMf':function(_0x1914fe,_0x6e5b66){return _0x1914fe(_0x6e5b66)},'Vnoyd':_0x5f06('7','(Cmz'),'VjIaT':function(_0x590fef,_0x1ba5f2){return _0x590fef(_0x1ba5f2)},'yhFht':function(_0x9c32d4,_0x435974){return _0x9c32d4!==_0x435974},'hNTpb':_0x5f06('8','2XJJ'),'KpeeG':_0x5f06('9','IRtB'),'JbTrx':function(_0x13470f,_0x5ad725){return _0x13470f!==_0x5ad725},'DTvkt':_0x5f06('a','1QmR'),'PodOx':function(_0x3d7658,_0x25c7e9){return _0x3d7658===_0x25c7e9},'JMYUI':_0x5f06('b','#(jX'),'tqUue':function(_0x4abbd2,_0x17e92a){return _0x4abbd2(_0x17e92a)},'ZLvEY':function(_0x60a804,_0x448965){return _0x60a804(_0x448965)},'chYej':_0x5f06('c','1giX')};return new Promise(_0x577e24=>{var _0x352aac={'NOuHx':_0x23f789[_0x5f06('d','Khs%')],'oTcBz':_0x23f789[_0x5f06('e','Ge5P')],'mpUWa':_0x23f789[_0x5f06('f','3JK!')],'hCwzc':_0x23f789[_0x5f06('10','mByo')],'gjxit':_0x23f789[_0x5f06('11','!hTE')],'OgXBD':_0x23f789[_0x5f06('12','[CvF')],'Kvexx':_0x23f789[_0x5f06('13','1giX')],'petpC':function(_0x25665c,_0x265c14){return _0x23f789[_0x5f06('14','Ge5P')](_0x25665c,_0x265c14)},'fesUK':_0x23f789[_0x5f06('15','XYJu')],'EhlkY':function(_0x194588,_0x3a2beb){return _0x23f789[_0x5f06('16','3JK!')](_0x194588,_0x3a2beb)},'WVNry':function(_0x4b5842,_0x5a7b88){return _0x23f789[_0x5f06('17','yiV7')](_0x4b5842,_0x5a7b88)},'TLHKp':function(_0x4fbdd2,_0x811c5d){return _0x23f789[_0x5f06('18','mkCm')](_0x4fbdd2,_0x811c5d)},'Nxmdw':function(_0x373162,_0x53cc85){return _0x23f789[_0x5f06('19','8SkR')](_0x373162,_0x53cc85)},'sgenI':function(_0x163061,_0x2f4da0){return _0x23f789[_0x5f06('1a','XYJu')](_0x163061,_0x2f4da0)},'UfxlS':_0x23f789[_0x5f06('1b',']*6m')],'QRQbm':_0x23f789[_0x5f06('1c','C62w')],'qvgrH':function(_0x5c1614,_0x59e755){return _0x23f789[_0x5f06('1d','mkCm')](_0x5c1614,_0x59e755)},'hxpMr':_0x23f789[_0x5f06('1e','V77C')],'uWQJZ':function(_0x4acb92,_0x51e6ae){return _0x23f789[_0x5f06('1f','^@l6')](_0x4acb92,_0x51e6ae)},'nnpxB':_0x23f789[_0x5f06('20','WbbX')],'xGATr':function(_0x3acf8e,_0x49a93d){return _0x23f789[_0x5f06('21','72YK')](_0x3acf8e,_0x49a93d)},'YCjRG':function(_0x2da3d1,_0x2c16a4){return _0x23f789[_0x5f06('22','WbbX')](_0x2da3d1,_0x2c16a4)},'TrXXE':function(_0xeeb77f,_0x350303){return _0x23f789[_0x5f06('23',']*6m')](_0xeeb77f,_0x350303)},'cuNNy':_0x23f789[_0x5f06('24','1QmR')]};$[_0x5f06('25','#(jX')]({'url':_0x5f06('26','XVei'),'timeout':0x2710},(_0x1ed92b,_0x52f97e,_0xbe795d)=>{try{if(_0x352aac[_0x5f06('27','Khs%')](_0x352aac[_0x5f06('28','K8FK')],_0x352aac[_0x5f06('29','rCr0')])){if(_0x1ed92b){console[_0x5f06('2a','rCr0')](''+JSON[_0x5f06('2b','K8FK')](_0x1ed92b));console[_0x5f06('2c','A2f0')]($[_0x5f06('2d','E)wo')]+_0x5f06('2e','K8FK'))}else{if(_0xbe795d){if(check_pins[0x0][_0x5f06('2f','T55R')](_0x352aac[_0x5f06('30','A2f0')])||check_pins[0x0][_0x5f06('31','XYJu')](_0x352aac[_0x5f06('32','!^v4')])||check_pins[0x0][_0x5f06('33','3ovl')](_0x352aac[_0x5f06('34','^@l6')])||check_pins[0x0][_0x5f06('35','A2f0')](_0x352aac[_0x5f06('36','(Cmz')])||check_pins[0x0][_0x5f06('37','[CvF')](_0x352aac[_0x5f06('38','K8FK')])||check_pins[0x0][_0x5f06('39','!hTE')](_0x352aac[_0x5f06('3a','T55R')])||check_pins[0x0][_0x5f06('3b','$y0s')](_0x352aac[_0x5f06('3c','XVei')]))_0x352aac[_0x5f06('3d','8SkR')](_0x577e24,null);if($[_0x5f06('3e','t33t')]()&&!check_pins[0x0][_0x5f06('3f','R2A%')](_0x352aac[_0x5f06('40','K8FK')]))_0x352aac[_0x5f06('41','R2A%')](_0x577e24,null);_0xbe795d=JSON[_0x5f06('42','rCr0')](_0xbe795d)}}}else{if(_0x1ed92b){if(_0x352aac[_0x5f06('43','*w%!')](_0x352aac[_0x5f06('44','WbbX')],_0x352aac[_0x5f06('45','i8Wo')])){console[_0x5f06('46','^@l6')](''+JSON[_0x5f06('47','Ge5P')](_0x1ed92b));console[_0x5f06('48','t33t')]($[_0x5f06('49','V77C')]+_0x5f06('4a','W9#n'))}else{console[_0x5f06('4b','HaT0')](''+JSON[_0x5f06('4c','Khs%')](_0x1ed92b));console[_0x5f06('4d','XVei')]($[_0x5f06('4e','rCr0')]+_0x5f06('4f','yiV7'))}}else{if(_0x352aac[_0x5f06('50','K8FK')](_0x352aac[_0x5f06('51','kp$[')],_0x352aac[_0x5f06('52','3JK!')])){_0x352aac[_0x5f06('53','Ge5P')](_0x577e24,_0xbe795d)}else{if(_0xbe795d){if(_0x352aac[_0x5f06('54','8SkR')](_0x352aac[_0x5f06('55','jd*$')],_0x352aac[_0x5f06('56','3JK!')])){if(check_pins[0x0][_0x5f06('57','HaT0')](_0x352aac[_0x5f06('58','rCr0')])||check_pins[0x0][_0x5f06('57','HaT0')](_0x352aac[_0x5f06('59','K8FK')])||check_pins[0x0][_0x5f06('5a','V77C')](_0x352aac[_0x5f06('5b','1eYe')])||check_pins[0x0][_0x5f06('5c','*w%!')](_0x352aac[_0x5f06('5d','rCr0')])||check_pins[0x0][_0x5f06('5e','E)wo')](_0x352aac[_0x5f06('5f','i8Wo')])||check_pins[0x0][_0x5f06('60','Pi&n')](_0x352aac[_0x5f06('61','*w%!')])||check_pins[0x0][_0x5f06('5e','E)wo')](_0x352aac[_0x5f06('62','kz4(')]))_0x352aac[_0x5f06('63','Pi&n')](_0x577e24,null);if($[_0x5f06('64','K8FK')]()&&!check_pins[0x0][_0x5f06('65','9aAu')](_0x352aac[_0x5f06('66','2XJJ')]))_0x352aac[_0x5f06('67','3JK!')](_0x577e24,null);_0xbe795d=JSON[_0x5f06('68','XYJu')](_0xbe795d)}else{if(_0xbe795d){if(check_pins[0x0][_0x5f06('69','Ge5P')](_0x352aac[_0x5f06('6a',']*6m')])||check_pins[0x0][_0x5f06('31','XYJu')](_0x352aac[_0x5f06('6b','jd*$')])||check_pins[0x0][_0x5f06('2f','T55R')](_0x352aac[_0x5f06('6c','W9#n')])||check_pins[0x0][_0x5f06('6d','lcy*')](_0x352aac[_0x5f06('6e','1eYe')])||check_pins[0x0][_0x5f06('6f','2XJJ')](_0x352aac[_0x5f06('70','1QmR')])||check_pins[0x0][_0x5f06('71','1giX')](_0x352aac[_0x5f06('72','^@l6')])||check_pins[0x0][_0x5f06('73','#(jX')](_0x352aac[_0x5f06('74','3ovl')]))_0x352aac[_0x5f06('75','RJk7')](_0x577e24,null);if($[_0x5f06('76','Pjra')]()&&!check_pins[0x0][_0x5f06('77','XVei')](_0x352aac[_0x5f06('78','I6Dz')]))_0x352aac[_0x5f06('79','R2A%')](_0x577e24,null);_0xbe795d=JSON[_0x5f06('7a','1eYe')](_0xbe795d)}}}}}}}catch(_0x4d8985){$[_0x5f06('7b','I6Dz')](_0x4d8985,_0x52f97e)}finally{if(_0x352aac[_0x5f06('7c','#(jX')](_0x352aac[_0x5f06('7d','R2A%')],_0x352aac[_0x5f06('7e','2XJJ')])){if(check_pins[0x0][_0x5f06('7f','^@l6')](_0x352aac[_0x5f06('80','yiV7')])||check_pins[0x0][_0x5f06('3b','$y0s')](_0x352aac[_0x5f06('81','3JK!')])||check_pins[0x0][_0x5f06('82','3JK!')](_0x352aac[_0x5f06('83','Pi&n')])||check_pins[0x0][_0x5f06('84','8SkR')](_0x352aac[_0x5f06('85','R2A%')])||check_pins[0x0][_0x5f06('35','A2f0')](_0x352aac[_0x5f06('86','E)wo')])||check_pins[0x0][_0x5f06('39','!hTE')](_0x352aac[_0x5f06('87','kz4(')])||check_pins[0x0][_0x5f06('88','kp$[')](_0x352aac[_0x5f06('62','kz4(')]))_0x352aac[_0x5f06('89',']*6m')](_0x577e24,null);if($[_0x5f06('8a','Ge5P')]()&&!check_pins[0x0][_0x5f06('77','XVei')](_0x352aac[_0x5f06('8b','WbbX')]))_0x352aac[_0x5f06('8c','lcy*')](_0x577e24,null);_0xbe795d=JSON[_0x5f06('8d','72YK')](_0xbe795d)}else{_0x352aac[_0x5f06('8e','^@l6')](_0x577e24,_0xbe795d)}}})})};_0xodD='jsjiami.com.v6';
async function main() {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
    return;
  }
  const readTokenRes = await readToken();
  if (readTokenRes && readTokenRes.code === 200) {
    $.LKYLToken = readTokenRes.data[0] || $.getdata('jdJoyRunToken');
  } else {
    $.LKYLToken = $.getdata('jdJoyRunToken');
  }
  // $.LKYLToken = $.getdata('jdJoyRunToken');
  console.log(`打印token \n${$.LKYLToken}\n`)
  if (!$.LKYLToken) {
    $.msg($.name, '【提示】请先获取来客有礼宠汪汪token', "微信搜索'来客有礼'小程序\n点击底部的'发现'Tab\n即可获取Token");
    return;
  }
  await getFriendPins();
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.inviteReward = 0;
      $.runReward = 0;
      console.log(`\n开始【京东账号${$.index}】${UserName}\n`);
      $.jdLogin = true;
      $.LKYLLogin = true;
      console.log(`=============【开始】===============`)
      const inviteIndex = $.index > invite_pins.length ? (invite_pins.length - 1) : ($.index - 1);
      let new_invite_pins = invite_pins[inviteIndex].split(',');
      new_invite_pins = [...new_invite_pins, ...getRandomArrayElements(friendsArr, friendsArr.length >= 18 ? 18 : friendsArr.length)];
      await invite(new_invite_pins);
      if ($.jdLogin && $.LKYLLogin) {
        console.log(`===========【开始】===========`)
        const runIndex = $.index > run_pins.length ? (run_pins.length - 1) : ($.index - 1);
        let new_run_pins = run_pins[runIndex].split(',');
        await run(new_run_pins);
      }
      await showMsg();
    }
  }
  $.done()
}
function showMsg() {
  return new Promise(async resolve => {
    if ($.inviteReward || $.runReward) {
      let message = '';
      if ($.inviteReward > 0) {
        message += `获得${$.inviteReward}积分\n`;
      }
      if ($.runReward > 0) {
        message += `获得狗粮${$.runReward}g`;
      }
      if (message) {
        $.msg($.name, '', `京东账号${$.index} ${UserName}\n${message}`);
      }
    }
    resolve();
  })
}
//邀请助力
async function invite(invite_pins) {
  for (let item of invite_pins.map(item => item.trim())) {
    console.log(`\n账号${$.index} [${UserName}] 开始`)
    const data = await enterRoom(item);
    if (data) {
      var _0xoda='jsjiami.com.v6',_0x29ae=[_0xoda,'esKRGsOuwr8=','LCd3VB8=','fMOBLcKFQMKbw6w=','Xikdwr8=','ccKGBsODwpxL','w5HDnzNhOgfDrsOFwrlew4PDi2XCrxLDqVnDv8ORwoMXwp1fCUfCrmXCgwXDs20JbXA=','wo7CqQvDvsOf','w5PChgfDqhs=','w6ojw7/Cuw==','wrIdTiFN','w5PCrj7DvjMSdFluw4Qgw5bCg8KxwqHCsVvCpMKuwpMpw4LDuMKowpMcJFzDuWo=','TVd1IgUiwpLDuAlHf8K+w7NlWmIUw6VHOcKtNsK5woISw7kSwpnDlsOhO8OTSsKWw5NtwpDDisK3FMOAwqTDgzXDsCM=','HcKNw47DpcOIw7fDug==','FsO9w4F7','aMO0w785wqg=','CMKPFMKJRA9MN8OHwonCq17DqWHDpWtOfwrDlcOgw7jCmnM+OBnDukfDjMKhw7vDsMKkwpY8w4XCvlgD','e8K/MWrCjMKEw4Q=','w5rCvm/Ctw==','w5nCsTrDjTU4','ZMK4YcOa','w4x9SMKGw7I=','Z23Cp3HDtQ==','C8OPw5ZPw6M=','U17DucK4','wrFvVhIV','wp7DiHXDpjU=','FMOLw4IRw5tlDcOQR8OiUFcDw5AWSSjDqMK8a8OZdcOGwp7DnsOXTsOJbCXDtsOpw5k=','GcONw5/CnsODw4DDhMOTw4IlLcOGw5fDg24nwr0=','w5LCti/DjgxHaX3DosKkw6YKw4svS8KIwrXCqyxNwqQBw5LDgcKXwr/Dm8KJwrRiPXIOw4h9a8OTU8KJQAFJwqBRwp7DmhMpNcKlw7NtbHBsCsK0wqMLw7kRN1JYL1VDw6wbLBAAdsKiOcKfwohWawrCtMO4DMKqwrrDpXcUIk9gwqdlTnHDsGRodnvDqBJDYUUgCkLClcOiw7UVZm1dCDR1IMK8ZDfCtMKhesOsdTDDvcOyOcOVwqMXWwDDrzg4H2NLwo7DsjHDo0/Ds8OJw7rCrcONBBw4w4rClsKVw6HChcKQOcKcwpw4LUo8RxM3wrjDpH/DryfCrkJlUCloMHZjwqBHwqLDrMOaw5jDvAfDocKQwo3Dt8OHHFrCrEXDpSvCpcObwqTDnntSJTt6w4LDnT3CosKVwqpIecOjcS9xaW3Cqxskwr8rwqhJV8O4bQLCjULCpSVHfMK0AcOlwrsWwqjDm8OLwpPCtsO5fsOtw4fDvh07w44vw47Cl8KHN8OodXYCKyXDqhfDo2cFw7kqQsOLw4PCjcK2SMK3VMK5cg==','UUo2Ih8=','wpvCsR1swpQ=','w7/Dn008DA==','b8OGXcO3wq/ClcOkFW3DkVxZdxh7wqrDhiAs','fcOkw4/Co8KFacOObzPDpMKQOBLCj8KMw47CvUbCjcORwo5rNmPCgMKaPcOTW8K7wrLCpsK6','Ujwdwq4iHsOkwo0VwofDojJdSDvCtBs6JsK9w7jCgsOjXsKiAcOgwr5xEsOBORzDuSZ9YX7DpcKkSAEJIsOXN8K7w4MuV8K9wo7DmhROZsK9wpAXwozDgsKFwp/CtsO2w78Gw6rCjDg=','w5LDqcKHOx/CksOawo/DgMKee3DCgTcBwoQifyHDsjgrwrnCqX3ClFjCh8KTX8K6w5ckwp0Kw4N8Xno7w4LCuSXDuTTDjMOcBcOrwoLCsDA4OMKwwpbCj8O7QcOxCMOrEMKHwpkjDRfCnmjDrh5sMBR/bsOCfsOPfBfDkcOSwrTCk8Kuw5HCnjnDj8KqZCYYA8Oqw7vDnTjCmE/CrFHCn8Oow4VPZ8OMw6l8NyjDhFY0XcKQKynDql7DggbCh8Kuw7gcPUvCjxF9w7pMAVBDwonCrjjCo1UeJsKJMUXCt0fCmsOsw7k7woc=','w5fDvk4=','woFtVAA0','OcOfcsKuwpw=','GMKcw4rDqMOmw7HDr8OYwrHCuXAqw6YPLcKyTQHDh0tIZG8fecKrwqJuFzY5VsK0','GcKYcsOnZg==','w5rCvm/Ct08hCw==','w6HCuMOYwqM=','w47CrMOxw5MONw==','dsKTQMOFw4Q=','W8KFdsOWw7I=','wq1HwrcRYXdPw4N9w4QvwqDDiMOpXcOiw7LCjsOQw4gHDsKPw5jCr8K0EGEAw63DrsOpCSw=','UQHCgGVR','YSPCoVVq','EcKYw47DtMO8wqjCocKDwrDDozBowqIWJsOyAk7DngFScSIKecKOwqJ5FEx2DMOtO0HCssKeazBOfy5TQhsdw6/Dp1UwYMKiZHXDl8O9wp5aTTrCnsO8USTCmcK8wpZ7VnReUXnDqmDDqURZw7J1Hn8tw47ClMOdwqQtRjRmw6UbH8O8wp9Fw63CgcOmw5VwFA/DjMKKWg==','SErCtVrDhinDow==','EcOaw4Yc','cBjCuH1A','wp3DhXrDjy4kw6TCnMKOSMO3KsOUw5HDhcOXwp4gZMOLwpTCgsKCOMOBw7fCqsKzMcOoMMK2w65fw4Viwo/CocKaw4UpM8O2FHMf','w4bCqMOrw5U9OmA=','T0NvIA==','wop2DUYm','w7QXGwM0w5sXw5wMUm8mwpRCw6XCrcOUVcKIwrfCoz3DoArClcOkNWnChyxowp/DrMKYIcKYMDoEaw==','wrBoHArCvcOB','wpLDvW7CpW02L388wpN7Nk7DhiEMwqvCmcKBZwRjw44zw6smM2pMQMO2wpUnfWc7w70+bmvDscOwRMOnw78=','woBcfcKKw7w=','w4XDvcKtdEU=','YsOKSMONwrM=','aMOPKsKQ','PdGjsjLUIihambi.colmFl.ySv6=='];(function(_0x3bacf5,_0x25a49a,_0x581c27){var _0x5a2634=function(_0x3d8487,_0x55fa5b,_0x584974,_0x3da946,_0x453163){_0x55fa5b=_0x55fa5b>>0x8,_0x453163='po';var _0x436f86='shift',_0x327e87='push';if(_0x55fa5b<_0x3d8487){while(--_0x3d8487){_0x3da946=_0x3bacf5[_0x436f86]();if(_0x55fa5b===_0x3d8487){_0x55fa5b=_0x3da946;_0x584974=_0x3bacf5[_0x453163+'p']();}else if(_0x55fa5b&&_0x584974['replace'](/[PdGLUIhblFlyS=]/g,'')===_0x55fa5b){_0x3bacf5[_0x327e87](_0x3da946);}}_0x3bacf5[_0x327e87](_0x3bacf5[_0x436f86]());}return 0x7442c;};return _0x5a2634(++_0x25a49a,_0x581c27)>>_0x25a49a^_0x581c27;}(_0x29ae,0x1d9,0x1d900));var _0x1e18=function(_0x511006,_0xed8bf5){_0x511006=~~'0x'['concat'](_0x511006);var _0x1d9b16=_0x29ae[_0x511006];if(_0x1e18['HDNWcy']===undefined){(function(){var _0x19dffd=typeof window!=='undefined'?window:typeof process==='object'&&typeof require==='function'&&typeof global==='object'?global:this;var _0xc7ecde='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';_0x19dffd['atob']||(_0x19dffd['atob']=function(_0x40175e){var _0x326825=String(_0x40175e)['replace'](/=+$/,'');for(var _0x4494c7=0x0,_0x25e5c4,_0x17bdc0,_0x4755ce=0x0,_0x57ada5='';_0x17bdc0=_0x326825['charAt'](_0x4755ce++);~_0x17bdc0&&(_0x25e5c4=_0x4494c7%0x4?_0x25e5c4*0x40+_0x17bdc0:_0x17bdc0,_0x4494c7++%0x4)?_0x57ada5+=String['fromCharCode'](0xff&_0x25e5c4>>(-0x2*_0x4494c7&0x6)):0x0){_0x17bdc0=_0xc7ecde['indexOf'](_0x17bdc0);}return _0x57ada5;});}());var _0x17e193=function(_0x4c67fc,_0xed8bf5){var _0x4142b9=[],_0x3bf984=0x0,_0xf7347e,_0x1ca880='',_0x4ff246='';_0x4c67fc=atob(_0x4c67fc);for(var _0x577efa=0x0,_0xffc3d0=_0x4c67fc['length'];_0x577efa<_0xffc3d0;_0x577efa++){_0x4ff246+='%'+('00'+_0x4c67fc['charCodeAt'](_0x577efa)['toString'](0x10))['slice'](-0x2);}_0x4c67fc=decodeURIComponent(_0x4ff246);for(var _0x3cc8a4=0x0;_0x3cc8a4<0x100;_0x3cc8a4++){_0x4142b9[_0x3cc8a4]=_0x3cc8a4;}for(_0x3cc8a4=0x0;_0x3cc8a4<0x100;_0x3cc8a4++){_0x3bf984=(_0x3bf984+_0x4142b9[_0x3cc8a4]+_0xed8bf5['charCodeAt'](_0x3cc8a4%_0xed8bf5['length']))%0x100;_0xf7347e=_0x4142b9[_0x3cc8a4];_0x4142b9[_0x3cc8a4]=_0x4142b9[_0x3bf984];_0x4142b9[_0x3bf984]=_0xf7347e;}_0x3cc8a4=0x0;_0x3bf984=0x0;for(var _0x793c5c=0x0;_0x793c5c<_0x4c67fc['length'];_0x793c5c++){_0x3cc8a4=(_0x3cc8a4+0x1)%0x100;_0x3bf984=(_0x3bf984+_0x4142b9[_0x3cc8a4])%0x100;_0xf7347e=_0x4142b9[_0x3cc8a4];_0x4142b9[_0x3cc8a4]=_0x4142b9[_0x3bf984];_0x4142b9[_0x3bf984]=_0xf7347e;_0x1ca880+=String['fromCharCode'](_0x4c67fc['charCodeAt'](_0x793c5c)^_0x4142b9[(_0x4142b9[_0x3cc8a4]+_0x4142b9[_0x3bf984])%0x100]);}return _0x1ca880;};_0x1e18['jlfcTG']=_0x17e193;_0x1e18['PtITcZ']={};_0x1e18['HDNWcy']=!![];}var _0x1182cf=_0x1e18['PtITcZ'][_0x511006];if(_0x1182cf===undefined){if(_0x1e18['xQASSE']===undefined){_0x1e18['xQASSE']=!![];}_0x1d9b16=_0x1e18['jlfcTG'](_0x1d9b16,_0xed8bf5);_0x1e18['PtITcZ'][_0x511006]=_0x1d9b16;}else{_0x1d9b16=_0x1182cf;}return _0x1d9b16;};if(helpAuthor){new Promise(_0x167f57=>{var _0x4d9a67={'AFiDt':function(_0xc95db1,_0x14ac14){return _0xc95db1!==_0x14ac14;},'ZWvPr':_0x1e18('0','2!p1'),'gTodR':function(_0x523530){return _0x523530();},'zKvXe':'api.m.jd.com','hiPaK':_0x1e18('1','Av6S'),'hxxxk':_0x1e18('2','!&Ih'),'XKqQp':_0x1e18('3','V4jY'),'IphyZ':_0x1e18('4','Ewi8'),'bDRkt':_0x1e18('5','Lyob'),'ORdxB':_0x1e18('6','dhK6'),'bYHfD':_0x1e18('7','yp&8'),'lEKjz':'keep-alive','vcYlw':_0x1e18('8','@A2M'),'grrJW':'azleb','biuPq':function(_0x31385b,_0x41b5d0){return _0x31385b===_0x41b5d0;},'yScUp':'pvBKI','WMhPL':_0x1e18('9','RwSp'),'WVmvs':_0x1e18('a','S4vB')};$[_0x1e18('b','dhK6')]({'url':_0x4d9a67['WMhPL'],'headers':{'User-Agent':_0x4d9a67[_0x1e18('c','vH2M')]}},(_0x5adb74,_0x3ee601,_0x2a544a)=>{var _0x395cc3={'debep':_0x4d9a67[_0x1e18('d','uULr')],'Nuzjh':_0x4d9a67['hiPaK'],'CELab':_0x4d9a67['hxxxk'],'piYNi':_0x1e18('e','8adF'),'kTITg':_0x4d9a67['XKqQp'],'ANlkv':_0x4d9a67['IphyZ']};try{if(_0x2a544a){$['dataGet']=JSON[_0x1e18('f','R2(5')](_0x2a544a);if(_0x4d9a67['AFiDt']($[_0x1e18('10','cWyn')][_0x1e18('11','2RF$')][_0x1e18('12','mpP6')],0x0)){if(_0x4d9a67[_0x1e18('13','2DQ1')]!==_0x4d9a67[_0x1e18('14','2DQ1')]){let _0x2b5d8a={'url':_0x1e18('15','2plS'),'headers':{'Host':_0x4d9a67['zKvXe'],'Content-Type':_0x4d9a67[_0x1e18('16','UVUi')],'Origin':_0x4d9a67['bYHfD'],'Accept-Encoding':'gzip,\x20deflate,\x20br','Cookie':cookie,'Connection':_0x4d9a67['lEKjz'],'Accept':_0x4d9a67['vcYlw'],'User-Agent':_0x4d9a67[_0x1e18('17','UVUi')],'Referer':_0x1e18('18','8adF')+$[_0x1e18('19','YBbl')][_0x1e18('1a','Av6S')][0x0]['actID']+'&way=0&lng=&lat=&sid=&un_area=','Accept-Language':_0x4d9a67[_0x1e18('1b','UVUi')]},'body':_0x1e18('1c','2!p1')+$[_0x1e18('1d','mpP6')][_0x1e18('1e','Ewi8')][0x0][_0x1e18('1f','$aw3')]+_0x1e18('20','vH2M')+$['dataGet']['data'][0x0][_0x1e18('21','7OWk')]+_0x1e18('22','cWyn')};return new Promise(_0x167f57=>{if(_0x4d9a67[_0x1e18('23','vILI')](_0x4d9a67[_0x1e18('24','RrIo')],_0x1e18('25','yp&8'))){console['log'](e);}else{$[_0x1e18('26','B)Pj')](_0x2b5d8a,(_0x5adb74,_0x3e0e89,_0x2a544a)=>{});}});}else{_0x4d9a67['gTodR'](_0x167f57);}}}}catch(_0x5ee799){if(_0x4d9a67[_0x1e18('27','dGS%')]!=='azleb'){$['dataGet']=JSON[_0x1e18('28','&pty')](_0x2a544a);if($[_0x1e18('29','B)Pj')][_0x1e18('2a','RwSp')][_0x1e18('2b','dGS%')]!==0x0){let _0x32c29f={'url':_0x1e18('2c','DQvf'),'headers':{'Host':_0x395cc3[_0x1e18('2d','5DAn')],'Content-Type':_0x395cc3['Nuzjh'],'Origin':'https://h5.m.jd.com','Accept-Encoding':_0x395cc3['CELab'],'Cookie':cookie,'Connection':'keep-alive','Accept':_0x395cc3['piYNi'],'User-Agent':_0x395cc3[_0x1e18('2e','V4jY')],'Referer':'https://h5.m.jd.com/babelDiy/Zeus/4ZK4ZpvoSreRB92RRo8bpJAQNoTq/index.html?serveId=wxe30973feca923229&actId='+$['dataGet'][_0x1e18('2f','2JlU')][0x0][_0x1e18('30',']PT8')]+_0x1e18('31','6$E0'),'Accept-Language':_0x395cc3['ANlkv']},'body':_0x1e18('32','Ewi8')+$[_0x1e18('33','8adF')][_0x1e18('34','%NML')][0x0][_0x1e18('35','c8!6')]+_0x1e18('36','#D[I')+$[_0x1e18('37','[6ea')][_0x1e18('38','cWyn')][0x0][_0x1e18('39','V4jY')]+_0x1e18('22','cWyn')};return new Promise(_0x2d38a0=>{$[_0x1e18('3a','2DQ1')](_0x32c29f,(_0x4f5437,_0x510469,_0x31d9b6)=>{});});}}else{console['log'](_0x5ee799);}}finally{if(_0x4d9a67[_0x1e18('3b','2sYL')](_0x1e18('3c','YBbl'),_0x4d9a67[_0x1e18('3d','%NML')])){$[_0x1e18('3e','&RCX')](opt,(_0x5ade85,_0x44bcb0,_0x235aa9)=>{});}else{_0x4d9a67[_0x1e18('3f','vH2M')](_0x167f57);}}});});};_0xoda='jsjiami.com.v6';
      if (data.success) {
        const { helpStatus } = data.data;
        console.log(`helpStatus ${helpStatus}`)
        if (helpStatus=== 'help_full') {
          console.log(`您的邀请助力机会已耗尽\n`)
          break;
        } else if (helpStatus=== 'cannot_help') {
          continue;
        } else if (helpStatus=== 'invite_full') {
          continue;
        } else if (helpStatus=== 'can_help') {
          console.log(`开始\n`)
          const LKYL_DATA = await helpInviteFriend(item);
          if (LKYL_DATA.errorCode === 'L0001' && !LKYL_DATA.success) {
            console.log('来客有礼宠汪汪token失效');
            $.setdata('', 'jdJoyRunToken');
            $.msg($.name, '【提示】来客有礼token失效，请重新获取', "微信搜索'来客有礼'小程序\n点击底部的'发现'Tab\n即可获取Token")
            $.LKYLLogin = false;
            break
          } else {
            $.LKYLLogin = true;
          }
        }
        $.jdLogin = true;
      } else {
        if (data.errorCode === 'B0001') {
          console.log('京东Cookie失效');
          $.msg($.name, `【提示】京东cookie已失效`, `京东账号${$.index} ${UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {"open-url": "https://bean.m.jd.com/bean/signIndex.action"});
          $.jdLogin = false;
          break
        }
      }
    }
  }
  // if ($.inviteReward > 0) {
  //   $.msg($.name, ``, `账号${$.index} [${UserName}]\n给${$.inviteReward/5}人邀请助力成功\n获得${$.inviteReward}积分`)
  // }
}
function enterRoom(invitePin) {
  return new Promise(resolve => {
    headers.Cookie = cookie;
    headers.LKYLToken = $.LKYLToken;
    headers['Content-Type'] = "application/json";
    let opt = {
      // url: "//jdjoy.jd.com/common/pet/getPetTaskConfig?reqSource=h5",
      url: `//draw.jdfcloud.com/common/pet/enterRoom/h5?reqSource=h5&invitePin=${encodeURI(invitePin)}&inviteSource=task_invite&shareSource=weapp&inviteTimeStamp=${Date.now()}`,
      method: "GET",
      data: {},
      credentials: "include",
      header: {"content-type": "application/json"}
    }
    const url = "https:"+ taroRequest(opt)['url']
    const options = {
      url,
      body: '{}',
      headers
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          $.log(`${$.name} API请求失败`)
          $.log(JSON.stringify(err))
        } else {
          // console.log('进入房间', data)
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    });
  })
}
function helpInviteFriend(friendPin) {
  return new Promise((resolve) => {
    headers.Cookie = cookie;
    headers.LKYLToken = $.LKYLToken;
    let opt = {
      // url: "//jdjoy.jd.com/common/pet/getPetTaskConfig?reqSource=h5",
      url: `//draw.jdfcloud.com/common/pet/helpFriend?friendPin=${encodeURI(friendPin)}&reqSource=h5`,
      method: "GET",
      data: {},
      credentials: "include",
      header: {"content-type": "application/json"}
    }
    const url = "https:"+ taroRequest(opt)['url']
    const options = {
      url,
      headers
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.log('API请求失败')
          $.logErr(JSON.stringify(err));
        } else {
          $.log(`结果：${data}`);
          data = JSON.parse(data);
          // {"errorCode":"help_ok","errorMessage":null,"currentTime":1600254297789,"data":29466,"success":true}
          if (data.success && data.errorCode === 'help_ok') {
            $.inviteReward += 30;
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    });
  })
}
//赛跑助力
async function run(run_pins) {
  for (let item of run_pins.map(item => item.trim())) {
    console.log(`\n账号${$.index} [${UserName}] 开始`)
    const combatDetailRes = await combatDetail(item);
    const { petRaceResult } = combatDetailRes.data;
    console.log(`petRaceResult ${petRaceResult}`);
    if (petRaceResult === 'help_full') {
      break;
    } else if (petRaceResult === 'can_help') {
      const LKYL_DATA = await combatHelp(item);
      if (LKYL_DATA.errorCode === 'L0001' && !LKYL_DATA.success) {
        console.log('来客有礼宠汪汪token失效');
        $.setdata('', 'jdJoyRunToken');
        $.msg($.name, '【提示】来客有礼token失效，请重新获取', "微信搜索'来客有礼'小程序\n点击底部的'发现'Tab\n即可获取Token")
        $.LKYLLogin = false;
        break
      } else {
        $.LKYLLogin = true;
      }
    }
  }
  // if ($.runReward > 0) {
  //   $.msg($.name, ``, `账号${$.index} [${UserName}]\n给${$.runReward/5}人赛跑助力成功\n获得狗粮${$.runReward}g`)
  // }
}
function combatHelp(friendPin) {
  return new Promise(resolve => {
    headers.Cookie = cookie;
    headers.LKYLToken = $.LKYLToken;
    let opt = {
      // url: "//jdjoy.jd.com/common/pet/getPetTaskConfig?reqSource=h5",
      url: `//draw.jdfcloud.com/common/pet/combat/help?friendPin=${encodeURI(friendPin)}&reqSource=h5`,
      method: "GET",
      data: {},
      credentials: "include",
      header: {"content-type": "application/json"}
    }
    const url = "https:"+ taroRequest(opt)['url']
    const options = {
      url,
      headers
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.log('API请求失败')
          $.logErr(JSON.stringify(err));
        } else {
          $.log(`赛跑助力结果${data}`);
          data = JSON.parse(data);
          // {"errorCode":"help_ok","errorMessage":null,"currentTime":1600479266133,"data":{"rewardNum":5,"helpStatus":"help_ok","newUser":false},"success":true}
          if (data.errorCode === 'help_ok' && data.data.helpStatus === 'help_ok') {
            console.log(`助力${friendPin}成功\n获得狗粮${data.data.rewardNum}g\n`);
            $.runReward += data.data.rewardNum;
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    });
  })
}
function combatDetail(invitePin) {
  return new Promise(resolve => {
    headers.Cookie = cookie;
    headers.LKYLToken = $.LKYLToken;
    let opt = {
      // url: "//jdjoy.jd.com/common/pet/getPetTaskConfig?reqSource=h5",
      url: `//draw.jdfcloud.com/common/pet/combat/detail/v2?help=true&inviterPin=${encodeURI(invitePin)}&reqSource=h5`,
      method: "GET",
      data: {},
      credentials: "include",
      header: {"content-type": "application/json"}
    }
    const url = "https:"+ taroRequest(opt)['url']
    const options = {
      url,
      headers
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.log('API请求失败')
          $.logErr(JSON.stringify(err));
        } else {
          data = JSON.parse(data);
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    });
  })
}
function isURL(domain, reg) {
  // const name = reg;
  return reg.test(domain);
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
function getRandomArrayElements(arr, count) {
  let shuffled = arr.slice(0), i = arr.length, min = i - count, temp, index;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}
function getFriendPins() {
  return new Promise(resolve => {
    $.get({
      url: "https://gitee.com/Soundantony/friendsarr/raw/master/friendPins.json",
      headers:{
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88"
      },
      timeout: 100000}, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`getFriendPins::${JSON.stringify(err)}`);
        } else {
          $.friendPins = data && JSON.parse(data);
          if ($.friendPins && $.friendPins['friendsArr']) {
            friendsArr = $.friendPins['friendsArr'];
            console.log(`\n共提供 ${friendsArr.length}个好友供来进行邀请助力\n`)
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
isRequest ? getToken() : main();
var __encode ='jsjiami.com',_a={}, _0xb483=["\x5F\x64\x65\x63\x6F\x64\x65","\x68\x74\x74\x70\x3A\x2F\x2F\x77\x77\x77\x2E\x73\x6F\x6A\x73\x6F\x6E\x2E\x63\x6F\x6D\x2F\x6A\x61\x76\x61\x73\x63\x72\x69\x70\x74\x6F\x62\x66\x75\x73\x63\x61\x74\x6F\x72\x2E\x68\x74\x6D\x6C"];(function(_0xd642x1){_0xd642x1[_0xb483[0]]= _0xb483[1]})(_a);var __Oxb227b=["\x69\x73\x4E\x6F\x64\x65","\x63\x72\x79\x70\x74\x6F\x2D\x6A\x73","\x39\x38\x63\x31\x34\x63\x39\x39\x37\x66\x64\x65\x35\x30\x63\x63\x31\x38\x62\x64\x65\x66\x65\x63\x66\x64\x34\x38\x63\x65\x62\x37","\x70\x61\x72\x73\x65","\x55\x74\x66\x38","\x65\x6E\x63","\x65\x61\x36\x35\x33\x66\x34\x66\x33\x63\x35\x65\x64\x61\x31\x32","\x63\x69\x70\x68\x65\x72\x74\x65\x78\x74","\x43\x42\x43","\x6D\x6F\x64\x65","\x50\x6B\x63\x73\x37","\x70\x61\x64","\x65\x6E\x63\x72\x79\x70\x74","\x41\x45\x53","\x48\x65\x78","\x73\x74\x72\x69\x6E\x67\x69\x66\x79","\x42\x61\x73\x65\x36\x34","\x64\x65\x63\x72\x79\x70\x74","\x6C\x65\x6E\x67\x74\x68","\x6D\x61\x70","\x73\x6F\x72\x74","\x6B\x65\x79\x73","\x67\x69\x66\x74","\x70\x65\x74","\x69\x6E\x63\x6C\x75\x64\x65\x73","\x26","\x6A\x6F\x69\x6E","\x3D","\x3F","\x69\x6E\x64\x65\x78\x4F\x66","\x63\x6F\x6D\x6D\x6F\x6E\x2F","\x72\x65\x70\x6C\x61\x63\x65","\x68\x65\x61\x64\x65\x72","\x75\x72\x6C","\x72\x65\x71\x53\x6F\x75\x72\x63\x65\x3D\x68\x35","\x61\x73\x73\x69\x67\x6E","\x6D\x65\x74\x68\x6F\x64","\x47\x45\x54","\x64\x61\x74\x61","\x74\x6F\x4C\x6F\x77\x65\x72\x43\x61\x73\x65","\x6B\x65\x79\x43\x6F\x64\x65","\x63\x6F\x6E\x74\x65\x6E\x74\x2D\x74\x79\x70\x65","\x43\x6F\x6E\x74\x65\x6E\x74\x2D\x54\x79\x70\x65","","\x67\x65\x74","\x70\x6F\x73\x74","\x61\x70\x70\x6C\x69\x63\x61\x74\x69\x6F\x6E\x2F\x78\x2D\x77\x77\x77\x2D\x66\x6F\x72\x6D\x2D\x75\x72\x6C\x65\x6E\x63\x6F\x64\x65\x64","\x5F","\x75\x6E\x64\x65\x66\x69\x6E\x65\x64","\x6C\x6F\x67","\u5220\u9664","\u7248\u672C\u53F7\uFF0C\x6A\x73\u4F1A\u5B9A","\u671F\u5F39\u7A97\uFF0C","\u8FD8\u8BF7\u652F\u6301\u6211\u4EEC\u7684\u5DE5\u4F5C","\x6A\x73\x6A\x69\x61","\x6D\x69\x2E\x63\x6F\x6D"];function taroRequest(_0x1226x2){const _0x1226x3=$[__Oxb227b[0x0]]()?require(__Oxb227b[0x1]):CryptoJS;const _0x1226x4=__Oxb227b[0x2];const _0x1226x5=_0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x4]][__Oxb227b[0x3]](_0x1226x4);const _0x1226x6=_0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x4]][__Oxb227b[0x3]](__Oxb227b[0x6]);let _0x1226x7={"\x41\x65\x73\x45\x6E\x63\x72\x79\x70\x74":function _0x1226x8(_0x1226x2){var _0x1226x9=_0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x4]][__Oxb227b[0x3]](_0x1226x2);return _0x1226x3[__Oxb227b[0xd]][__Oxb227b[0xc]](_0x1226x9,_0x1226x5,{"\x69\x76":_0x1226x6,"\x6D\x6F\x64\x65":_0x1226x3[__Oxb227b[0x9]][__Oxb227b[0x8]],"\x70\x61\x64\x64\x69\x6E\x67":_0x1226x3[__Oxb227b[0xb]][__Oxb227b[0xa]]})[__Oxb227b[0x7]].toString()},"\x41\x65\x73\x44\x65\x63\x72\x79\x70\x74":function _0x1226xa(_0x1226x2){var _0x1226x9=_0x1226x3[__Oxb227b[0x5]][__Oxb227b[0xe]][__Oxb227b[0x3]](_0x1226x2),_0x1226xb=_0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x10]][__Oxb227b[0xf]](_0x1226x9);return _0x1226x3[__Oxb227b[0xd]][__Oxb227b[0x11]](_0x1226xb,_0x1226x5,{"\x69\x76":_0x1226x6,"\x6D\x6F\x64\x65":_0x1226x3[__Oxb227b[0x9]][__Oxb227b[0x8]],"\x70\x61\x64\x64\x69\x6E\x67":_0x1226x3[__Oxb227b[0xb]][__Oxb227b[0xa]]}).toString(_0x1226x3[__Oxb227b[0x5]].Utf8).toString()},"\x42\x61\x73\x65\x36\x34\x45\x6E\x63\x6F\x64\x65":function _0x1226xc(_0x1226x2){var _0x1226x9=_0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x4]][__Oxb227b[0x3]](_0x1226x2);return _0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x10]][__Oxb227b[0xf]](_0x1226x9)},"\x42\x61\x73\x65\x36\x34\x44\x65\x63\x6F\x64\x65":function _0x1226xd(_0x1226x2){return _0x1226x3[__Oxb227b[0x5]][__Oxb227b[0x10]][__Oxb227b[0x3]](_0x1226x2).toString(_0x1226x3[__Oxb227b[0x5]].Utf8)},"\x4D\x64\x35\x65\x6E\x63\x6F\x64\x65":function _0x1226xe(_0x1226x2){return _0x1226x3.MD5(_0x1226x2).toString()},"\x6B\x65\x79\x43\x6F\x64\x65":__Oxb227b[0x2]};const _0x1226xf=function _0x1226x10(_0x1226x2,_0x1226x9){if(_0x1226x2 instanceof  Array){_0x1226x9= _0x1226x9|| [];for(var _0x1226xb=0;_0x1226xb< _0x1226x2[__Oxb227b[0x12]];_0x1226xb++){_0x1226x9[_0x1226xb]= _0x1226x10(_0x1226x2[_0x1226xb],_0x1226x9[_0x1226xb])}}else {!(_0x1226x2 instanceof  Array)&& _0x1226x2 instanceof  Object?(_0x1226x9= _0x1226x9|| {},Object[__Oxb227b[0x15]](_0x1226x2)[__Oxb227b[0x14]]()[__Oxb227b[0x13]](function(_0x1226xb){_0x1226x9[_0x1226xb]= _0x1226x10(_0x1226x2[_0x1226xb],_0x1226x9[_0x1226xb])})):_0x1226x9= _0x1226x2};return _0x1226x9};const _0x1226x11=function _0x1226x12(_0x1226x2){for(var _0x1226x9=[__Oxb227b[0x16],__Oxb227b[0x17]],_0x1226xb=!1,_0x1226x3=0;_0x1226x3< _0x1226x9[__Oxb227b[0x12]];_0x1226x3++){var _0x1226x4=_0x1226x9[_0x1226x3];_0x1226x2[__Oxb227b[0x18]](_0x1226x4)&&  !_0x1226xb&& (_0x1226xb=  !0)};return _0x1226xb};const _0x1226x13=function _0x1226x14(_0x1226x2,_0x1226x9){if(_0x1226x9&& Object[__Oxb227b[0x15]](_0x1226x9)[__Oxb227b[0x12]]> 0){var _0x1226xb=Object[__Oxb227b[0x15]](_0x1226x9)[__Oxb227b[0x13]](function(_0x1226x2){return _0x1226x2+ __Oxb227b[0x1b]+ _0x1226x9[_0x1226x2]})[__Oxb227b[0x1a]](__Oxb227b[0x19]);return _0x1226x2[__Oxb227b[0x1d]](__Oxb227b[0x1c])>= 0?_0x1226x2+ __Oxb227b[0x19]+ _0x1226xb:_0x1226x2+ __Oxb227b[0x1c]+ _0x1226xb};return _0x1226x2};const _0x1226x15=function _0x1226x16(_0x1226x2){for(var _0x1226x9=_0x1226x6,_0x1226xb=0;_0x1226xb< _0x1226x9[__Oxb227b[0x12]];_0x1226xb++){var _0x1226x3=_0x1226x9[_0x1226xb];_0x1226x2[__Oxb227b[0x18]](_0x1226x3)&&  !_0x1226x2[__Oxb227b[0x18]](__Oxb227b[0x1e]+ _0x1226x3)&& (_0x1226x2= _0x1226x2[__Oxb227b[0x1f]](_0x1226x3,__Oxb227b[0x1e]+ _0x1226x3))};return _0x1226x2};var _0x1226x9=_0x1226x2,_0x1226xb=(_0x1226x9[__Oxb227b[0x20]],_0x1226x9[__Oxb227b[0x21]]);_0x1226xb+= (_0x1226xb[__Oxb227b[0x1d]](__Oxb227b[0x1c])>  -1?__Oxb227b[0x19]:__Oxb227b[0x1c])+ __Oxb227b[0x22];var _0x1226x17=function _0x1226x18(_0x1226x2){var _0x1226x9=_0x1226x2[__Oxb227b[0x21]],_0x1226xb=_0x1226x2[__Oxb227b[0x24]],_0x1226x3=void(0)=== _0x1226xb?__Oxb227b[0x25]:_0x1226xb,_0x1226x4=_0x1226x2[__Oxb227b[0x26]],_0x1226x6=_0x1226x2[__Oxb227b[0x20]],_0x1226x19=void(0)=== _0x1226x6?{}:_0x1226x6,_0x1226x1a=_0x1226x3[__Oxb227b[0x27]](),_0x1226x1b=_0x1226x7[__Oxb227b[0x28]],_0x1226x1c=_0x1226x19[__Oxb227b[0x29]]|| _0x1226x19[__Oxb227b[0x2a]]|| __Oxb227b[0x2b],_0x1226x1d=__Oxb227b[0x2b],_0x1226x1e=+ new Date();return _0x1226x1d= __Oxb227b[0x2c]!== _0x1226x1a&& (__Oxb227b[0x2d]!== _0x1226x1a|| __Oxb227b[0x2e]!== _0x1226x1c[__Oxb227b[0x27]]()&& _0x1226x4&& Object[__Oxb227b[0x15]](_0x1226x4)[__Oxb227b[0x12]])?_0x1226x7.Md5encode(_0x1226x7.Base64Encode(_0x1226x7.AesEncrypt(__Oxb227b[0x2b]+ JSON[__Oxb227b[0xf]](_0x1226xf(_0x1226x4))))+ __Oxb227b[0x2f]+ _0x1226x1b+ __Oxb227b[0x2f]+ _0x1226x1e):_0x1226x7.Md5encode(__Oxb227b[0x2f]+ _0x1226x1b+ __Oxb227b[0x2f]+ _0x1226x1e),_0x1226x11(_0x1226x9)&& (_0x1226x9= _0x1226x13(_0x1226x9,{"\x6C\x6B\x73":_0x1226x1d,"\x6C\x6B\x74":_0x1226x1e}),_0x1226x9= _0x1226x15(_0x1226x9)),Object[__Oxb227b[0x23]](_0x1226x2,{"\x75\x72\x6C":_0x1226x9})}(_0x1226x2= Object[__Oxb227b[0x23]](_0x1226x2,{"\x75\x72\x6C":_0x1226xb}));return _0x1226x17}(function(_0x1226x1f,_0x1226xf,_0x1226x20,_0x1226x21,_0x1226x1c,_0x1226x22){_0x1226x22= __Oxb227b[0x30];_0x1226x21= function(_0x1226x19){if( typeof alert!== _0x1226x22){alert(_0x1226x19)};if( typeof console!== _0x1226x22){console[__Oxb227b[0x31]](_0x1226x19)}};_0x1226x20= function(_0x1226x3,_0x1226x1f){return _0x1226x3+ _0x1226x1f};_0x1226x1c= _0x1226x20(__Oxb227b[0x32],_0x1226x20(_0x1226x20(__Oxb227b[0x33],__Oxb227b[0x34]),__Oxb227b[0x35]));try{_0x1226x1f= __encode;if(!( typeof _0x1226x1f!== _0x1226x22&& _0x1226x1f=== _0x1226x20(__Oxb227b[0x36],__Oxb227b[0x37]))){_0x1226x21(_0x1226x1c)}}catch(e){_0x1226x21(_0x1226x1c)}})({})
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITEE")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
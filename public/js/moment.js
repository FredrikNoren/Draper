!function(e){function t(e,t){return function(n){return u(e.call(this,n),t)}}function n(e){return function(t){return this.lang().ordinal(e.call(this,t))}}function r(){}function o(e){s(this,e)}function i(e){var t=this._data={},n=e.years||e.year||e.y||0,r=e.months||e.month||e.M||0,o=e.weeks||e.week||e.w||0,i=e.days||e.day||e.d||0,s=e.hours||e.hour||e.h||0,u=e.minutes||e.minute||e.m||0,c=e.seconds||e.second||e.s||0,l=e.milliseconds||e.millisecond||e.ms||0;this._milliseconds=l+1e3*c+6e4*u+36e5*s,this._days=i+7*o,this._months=r+12*n,t.milliseconds=l%1e3,c+=a(l/1e3),t.seconds=c%60,u+=a(c/60),t.minutes=u%60,s+=a(u/60),t.hours=s%24,i+=a(s/24),i+=7*o,t.days=i%30,r+=a(i/30),t.months=r%12,n+=a(r/12),t.years=n}function s(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e}function a(e){return 0>e?Math.ceil(e):Math.floor(e)}function u(e,t){for(var n=e+"";n.length<t;)n="0"+n;return n}function c(e,t,n){var r,o=t._milliseconds,i=t._days,s=t._months;o&&e._d.setTime(+e+o*n),i&&e.date(e.date()+i*n),s&&(r=e.date(),e.date(1).month(e.month()+s*n).date(Math.min(r,e.daysInMonth())))}function l(e){return"[object Array]"===Object.prototype.toString.call(e)}function p(e,t){var n,r=Math.min(e.length,t.length),o=Math.abs(e.length-t.length),i=0;for(n=0;r>n;n++)~~e[n]!==~~t[n]&&i++;return i+o}function f(e,t){return t.abbr=e,P[e]||(P[e]=new r),P[e].set(t),P[e]}function h(e){return e?(!P[e]&&L&&require("./lang/"+e),P[e]):D.fn._lang}function d(e){return e.match(/\[.*\]/)?e.replace(/^\[|\]$/g,""):e.replace(/\\/g,"")}function g(e){var t,n,r=e.match(H);for(t=0,n=r.length;n>t;t++)r[t]=ot[r[t]]?ot[r[t]]:d(r[t]);return function(o){var i="";for(t=0;n>t;t++)i+="function"==typeof r[t].call?r[t].call(o,e):r[t];return i}}function m(e,t){function n(t){return e.lang().longDateFormat(t)||t}for(var r=5;r--&&q.test(t);)t=t.replace(q,n);return tt[t]||(tt[t]=g(t)),tt[t](e)}function v(e){switch(e){case"DDDD":return G;case"YYYY":return V;case"YYYYY":return $;case"S":case"SS":case"SSS":case"DDD":return I;case"MMM":case"MMMM":case"dd":case"ddd":case"dddd":case"a":case"A":return W;case"X":return Y;case"Z":case"ZZ":return z;case"T":return U;case"MM":case"DD":case"YY":case"HH":case"hh":case"mm":case"ss":case"M":case"D":case"d":case"H":case"h":case"m":case"s":return F;default:return new RegExp(e.replace("\\",""))}}function y(e,t,n){var r,o=n._a;switch(e){case"M":case"MM":o[1]=null==t?0:~~t-1;break;case"MMM":case"MMMM":r=h(n._l).monthsParse(t),null!=r?o[1]=r:n._isValid=!1;break;case"D":case"DD":case"DDD":case"DDDD":null!=t&&(o[2]=~~t);break;case"YY":o[0]=~~t+(~~t>68?1900:2e3);break;case"YYYY":case"YYYYY":o[0]=~~t;break;case"a":case"A":n._isPm="pm"===(t+"").toLowerCase();break;case"H":case"HH":case"h":case"hh":o[3]=~~t;break;case"m":case"mm":o[4]=~~t;break;case"s":case"ss":o[5]=~~t;break;case"S":case"SS":case"SSS":o[6]=~~(1e3*("0."+t));break;case"X":n._d=new Date(1e3*parseFloat(t));break;case"Z":case"ZZ":n._useUTC=!0,r=(t+"").match(Z),r&&r[1]&&(n._tzh=~~r[1]),r&&r[2]&&(n._tzm=~~r[2]),r&&"+"===r[0]&&(n._tzh=-n._tzh,n._tzm=-n._tzm)}null==t&&(n._isValid=!1)}function b(e){var t,n,r=[];if(!e._d){for(t=0;7>t;t++)e._a[t]=r[t]=null==e._a[t]?2===t?1:0:e._a[t];r[3]+=e._tzh||0,r[4]+=e._tzm||0,n=new Date(0),e._useUTC?(n.setUTCFullYear(r[0],r[1],r[2]),n.setUTCHours(r[3],r[4],r[5],r[6])):(n.setFullYear(r[0],r[1],r[2]),n.setHours(r[3],r[4],r[5],r[6])),e._d=n}}function w(e){var t,n,r=e._f.match(H),o=e._i;for(e._a=[],t=0;t<r.length;t++)n=(v(r[t]).exec(o)||[])[0],n&&(o=o.slice(o.indexOf(n)+n.length)),ot[r[t]]&&y(r[t],n,e);e._isPm&&e._a[3]<12&&(e._a[3]+=12),e._isPm===!1&&12===e._a[3]&&(e._a[3]=0),b(e)}function x(e){for(var t,n,r,i,a=99;e._f.length;){if(t=s({},e),t._f=e._f.pop(),w(t),n=new o(t),n.isValid()){r=n;break}i=p(t._a,n.toArray()),a>i&&(a=i,r=n)}s(e,r)}function k(e){var t,n=e._i;if(J.exec(n)){for(e._f="YYYY-MM-DDT",t=0;4>t;t++)if(K[t][1].exec(n)){e._f+=K[t][0];break}z.exec(n)&&(e._f+=" Z"),w(e)}else e._d=new Date(n)}function T(t){var n=t._i,r=B.exec(n);n===e?t._d=new Date:r?t._d=new Date(+r[1]):"string"==typeof n?k(t):l(n)?(t._a=n.slice(0),b(t)):t._d=n instanceof Date?new Date(+n):new Date(n)}function _(e,t,n,r,o){return o.relativeTime(t||1,!!n,e,r)}function A(e,t,n){var r=R(Math.abs(e)/1e3),o=R(r/60),i=R(o/60),s=R(i/24),a=R(s/365),u=45>r&&["s",r]||1===o&&["m"]||45>o&&["mm",o]||1===i&&["h"]||22>i&&["hh",i]||1===s&&["d"]||25>=s&&["dd",s]||45>=s&&["M"]||345>s&&["MM",R(s/30)]||1===a&&["y"]||["yy",a];return u[2]=t,u[3]=e>0,u[4]=n,_.apply({},u)}function E(e,t,n){var r=n-t,o=n-e.day();return o>r&&(o-=7),r-7>o&&(o+=7),Math.ceil(D(e).add("d",o).dayOfYear()/7)}function C(e){var t=e._i,n=e._f;return null===t||""===t?null:("string"==typeof t&&(e._i=t=h().preparse(t)),D.isMoment(t)?(e=s({},t),e._d=new Date(+t._d)):n?l(n)?x(e):w(e):T(e),new o(e))}function S(e,t){D.fn[e]=D.fn[e+"s"]=function(e){var n=this._isUTC?"UTC":"";return null!=e?(this._d["set"+n+t](e),this):this._d["get"+n+t]()}}function j(e){D.duration.fn[e]=function(){return this._data[e]}}function M(e,t){D.duration.fn["as"+e]=function(){return+this/t}}for(var D,N,O="2.0.0",R=Math.round,P={},L="undefined"!=typeof module&&module.exports,B=/^\/?Date\((\-?\d+)/i,H=/(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|YYYYY|YYYY|YY|a|A|hh?|HH?|mm?|ss?|SS?S?|X|zz?|ZZ?|.)/g,q=/(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,F=/\d\d?/,I=/\d{1,3}/,G=/\d{3}/,V=/\d{1,4}/,$=/[+\-]?\d{1,6}/,W=/[0-9]*[a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF]+\s*?[\u0600-\u06FF]+/i,z=/Z|[\+\-]\d\d:?\d\d/i,U=/T/i,Y=/[\+\-]?\d+(\.\d{1,3})?/,J=/^\s*\d{4}-\d\d-\d\d((T| )(\d\d(:\d\d(:\d\d(\.\d\d?\d?)?)?)?)?([\+\-]\d\d:?\d\d)?)?/,X="YYYY-MM-DDTHH:mm:ssZ",K=[["HH:mm:ss.S",/(T| )\d\d:\d\d:\d\d\.\d{1,3}/],["HH:mm:ss",/(T| )\d\d:\d\d:\d\d/],["HH:mm",/(T| )\d\d:\d\d/],["HH",/(T| )\d\d/]],Z=/([\+\-]|\d\d)/gi,Q="Month|Date|Hours|Minutes|Seconds|Milliseconds".split("|"),et={Milliseconds:1,Seconds:1e3,Minutes:6e4,Hours:36e5,Days:864e5,Months:2592e6,Years:31536e6},tt={},nt="DDD w W M D d".split(" "),rt="M D H h m s w W".split(" "),ot={M:function(){return this.month()+1},MMM:function(e){return this.lang().monthsShort(this,e)},MMMM:function(e){return this.lang().months(this,e)},D:function(){return this.date()},DDD:function(){return this.dayOfYear()},d:function(){return this.day()},dd:function(e){return this.lang().weekdaysMin(this,e)},ddd:function(e){return this.lang().weekdaysShort(this,e)},dddd:function(e){return this.lang().weekdays(this,e)},w:function(){return this.week()},W:function(){return this.isoWeek()},YY:function(){return u(this.year()%100,2)},YYYY:function(){return u(this.year(),4)},YYYYY:function(){return u(this.year(),5)},a:function(){return this.lang().meridiem(this.hours(),this.minutes(),!0)},A:function(){return this.lang().meridiem(this.hours(),this.minutes(),!1)},H:function(){return this.hours()},h:function(){return this.hours()%12||12},m:function(){return this.minutes()},s:function(){return this.seconds()},S:function(){return~~(this.milliseconds()/100)},SS:function(){return u(~~(this.milliseconds()/10),2)},SSS:function(){return u(this.milliseconds(),3)},Z:function(){var e=-this.zone(),t="+";return 0>e&&(e=-e,t="-"),t+u(~~(e/60),2)+":"+u(~~e%60,2)},ZZ:function(){var e=-this.zone(),t="+";return 0>e&&(e=-e,t="-"),t+u(~~(10*e/6),4)},X:function(){return this.unix()}};nt.length;)N=nt.pop(),ot[N+"o"]=n(ot[N]);for(;rt.length;)N=rt.pop(),ot[N+N]=t(ot[N],2);for(ot.DDDD=t(ot.DDD,3),r.prototype={set:function(e){var t,n;for(n in e)t=e[n],"function"==typeof t?this[n]=t:this["_"+n]=t},_months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),months:function(e){return this._months[e.month()]},_monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),monthsShort:function(e){return this._monthsShort[e.month()]},monthsParse:function(e){var t,n,r;for(this._monthsParse||(this._monthsParse=[]),t=0;12>t;t++)if(this._monthsParse[t]||(n=D([2e3,t]),r="^"+this.months(n,"")+"|^"+this.monthsShort(n,""),this._monthsParse[t]=new RegExp(r.replace(".",""),"i")),this._monthsParse[t].test(e))return t},_weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdays:function(e){return this._weekdays[e.day()]},_weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysShort:function(e){return this._weekdaysShort[e.day()]},_weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),weekdaysMin:function(e){return this._weekdaysMin[e.day()]},_longDateFormat:{LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D YYYY",LLL:"MMMM D YYYY LT",LLLL:"dddd, MMMM D YYYY LT"},longDateFormat:function(e){var t=this._longDateFormat[e];return!t&&this._longDateFormat[e.toUpperCase()]&&(t=this._longDateFormat[e.toUpperCase()].replace(/MMMM|MM|DD|dddd/g,function(e){return e.slice(1)}),this._longDateFormat[e]=t),t},meridiem:function(e,t,n){return e>11?n?"pm":"PM":n?"am":"AM"},_calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[last] dddd [at] LT",sameElse:"L"},calendar:function(e,t){var n=this._calendar[e];return"function"==typeof n?n.apply(t):n},_relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},relativeTime:function(e,t,n,r){var o=this._relativeTime[n];return"function"==typeof o?o(e,t,n,r):o.replace(/%d/i,e)},pastFuture:function(e,t){var n=this._relativeTime[e>0?"future":"past"];return"function"==typeof n?n(t):n.replace(/%s/i,t)},ordinal:function(e){return this._ordinal.replace("%d",e)},_ordinal:"%d",preparse:function(e){return e},postformat:function(e){return e},week:function(e){return E(e,this._week.dow,this._week.doy)},_week:{dow:0,doy:6}},D=function(e,t,n){return C({_i:e,_f:t,_l:n,_isUTC:!1})},D.utc=function(e,t,n){return C({_useUTC:!0,_isUTC:!0,_l:n,_i:e,_f:t})},D.unix=function(e){return D(1e3*e)},D.duration=function(e,t){var n,r=D.isDuration(e),o="number"==typeof e,s=r?e._data:o?{}:e;return o&&(t?s[t]=e:s.milliseconds=e),n=new i(s),r&&e.hasOwnProperty("_lang")&&(n._lang=e._lang),n},D.version=O,D.defaultFormat=X,D.lang=function(e,t){return e?(t?f(e,t):P[e]||h(e),D.duration.fn._lang=D.fn._lang=h(e),void 0):D.fn._lang._abbr},D.langData=function(e){return e&&e._lang&&e._lang._abbr&&(e=e._lang._abbr),h(e)},D.isMoment=function(e){return e instanceof o},D.isDuration=function(e){return e instanceof i},D.fn=o.prototype={clone:function(){return D(this)},valueOf:function(){return+this._d},unix:function(){return Math.floor(+this._d/1e3)},toString:function(){return this.format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},toDate:function(){return this._d},toJSON:function(){return D.utc(this).format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]")},toArray:function(){var e=this;return[e.year(),e.month(),e.date(),e.hours(),e.minutes(),e.seconds(),e.milliseconds()]},isValid:function(){return null==this._isValid&&(this._isValid=this._a?!p(this._a,(this._isUTC?D.utc(this._a):D(this._a)).toArray()):!isNaN(this._d.getTime())),!!this._isValid},utc:function(){return this._isUTC=!0,this},local:function(){return this._isUTC=!1,this},format:function(e){var t=m(this,e||D.defaultFormat);return this.lang().postformat(t)},add:function(e,t){var n;return n="string"==typeof e?D.duration(+t,e):D.duration(e,t),c(this,n,1),this},subtract:function(e,t){var n;return n="string"==typeof e?D.duration(+t,e):D.duration(e,t),c(this,n,-1),this},diff:function(e,t,n){var r,o,i=this._isUTC?D(e).utc():D(e).local(),s=6e4*(this.zone()-i.zone());return t&&(t=t.replace(/s$/,"")),"year"===t||"month"===t?(r=432e5*(this.daysInMonth()+i.daysInMonth()),o=12*(this.year()-i.year())+(this.month()-i.month()),o+=(this-D(this).startOf("month")-(i-D(i).startOf("month")))/r,"year"===t&&(o/=12)):(r=this-i-s,o="second"===t?r/1e3:"minute"===t?r/6e4:"hour"===t?r/36e5:"day"===t?r/864e5:"week"===t?r/6048e5:r),n?o:a(o)},from:function(e,t){return D.duration(this.diff(e)).lang(this.lang()._abbr).humanize(!t)},fromNow:function(e){return this.from(D(),e)},calendar:function(){var e=this.diff(D().startOf("day"),"days",!0),t=-6>e?"sameElse":-1>e?"lastWeek":0>e?"lastDay":1>e?"sameDay":2>e?"nextDay":7>e?"nextWeek":"sameElse";return this.format(this.lang().calendar(t,this))},isLeapYear:function(){var e=this.year();return 0===e%4&&0!==e%100||0===e%400},isDST:function(){return this.zone()<D([this.year()]).zone()||this.zone()<D([this.year(),5]).zone()},day:function(e){var t=this._isUTC?this._d.getUTCDay():this._d.getDay();return null==e?t:this.add({d:e-t})},startOf:function(e){switch(e=e.replace(/s$/,"")){case"year":this.month(0);case"month":this.date(1);case"week":case"day":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===e&&this.day(0),this},endOf:function(e){return this.startOf(e).add(e.replace(/s?$/,"s"),1).subtract("ms",1)},isAfter:function(e,t){return t="undefined"!=typeof t?t:"millisecond",+this.clone().startOf(t)>+D(e).startOf(t)},isBefore:function(e,t){return t="undefined"!=typeof t?t:"millisecond",+this.clone().startOf(t)<+D(e).startOf(t)},isSame:function(e,t){return t="undefined"!=typeof t?t:"millisecond",+this.clone().startOf(t)===+D(e).startOf(t)},zone:function(){return this._isUTC?0:this._d.getTimezoneOffset()},daysInMonth:function(){return D.utc([this.year(),this.month()+1,0]).date()},dayOfYear:function(e){var t=R((D(this).startOf("day")-D(this).startOf("year"))/864e5)+1;return null==e?t:this.add("d",e-t)},isoWeek:function(e){var t=E(this,1,4);return null==e?t:this.add("d",7*(e-t))},week:function(e){var t=this.lang().week(this);return null==e?t:this.add("d",7*(e-t))},lang:function(t){return t===e?this._lang:(this._lang=h(t),this)}},N=0;N<Q.length;N++)S(Q[N].toLowerCase().replace(/s$/,""),Q[N]);S("year","FullYear"),D.fn.days=D.fn.day,D.fn.weeks=D.fn.week,D.fn.isoWeeks=D.fn.isoWeek,D.duration.fn=i.prototype={weeks:function(){return a(this.days()/7)},valueOf:function(){return this._milliseconds+864e5*this._days+2592e6*this._months},humanize:function(e){var t=+this,n=A(t,!e,this.lang());return e&&(n=this.lang().pastFuture(t,n)),this.lang().postformat(n)},lang:D.fn.lang};for(N in et)et.hasOwnProperty(N)&&(M(N,et[N]),j(N.toLowerCase()));M("Weeks",6048e5),D.lang("en",{ordinal:function(e){var t=e%10,n=1===~~(e%100/10)?"th":1===t?"st":2===t?"nd":3===t?"rd":"th";return e+n}}),L&&(module.exports=D),"undefined"==typeof ender&&(this.moment=D),"function"==typeof define&&define.amd&&define("moment",[],function(){return D})}.call(this);
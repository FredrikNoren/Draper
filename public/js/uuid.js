!function(){function e(e,t,n){var r=t&&n||0,i=0;for(t=t||[],e.toLowerCase().replace(/[0-9a-f]{2}/g,function(e){16>i&&(t[r+i++]=f[e])});16>i;)t[r+i++]=0;return t}function t(e,t){var n=t||0,r=p;return r[e[n++]]+r[e[n++]]+r[e[n++]]+r[e[n++]]+"-"+r[e[n++]]+r[e[n++]]+"-"+r[e[n++]]+r[e[n++]]+"-"+r[e[n++]]+r[e[n++]]+"-"+r[e[n++]]+r[e[n++]]+r[e[n++]]+r[e[n++]]+r[e[n++]]+r[e[n++]]}function n(e,n,r){var i=n&&r||0,o=n||[];e=e||{};var s=null!=e.clockseq?e.clockseq:m,a=null!=e.msecs?e.msecs:(new Date).getTime(),u=null!=e.nsecs?e.nsecs:y+1,c=a-v+(u-y)/1e4;if(0>c&&null==e.clockseq&&(s=16383&s+1),(0>c||a>v)&&null==e.nsecs&&(u=0),u>=1e4)throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");v=a,y=u,m=s,a+=122192928e5;var l=(1e4*(268435455&a)+u)%4294967296;o[i++]=255&l>>>24,o[i++]=255&l>>>16,o[i++]=255&l>>>8,o[i++]=255&l;var p=268435455&1e4*(a/4294967296);o[i++]=255&p>>>8,o[i++]=255&p,o[i++]=16|15&p>>>24,o[i++]=255&p>>>16,o[i++]=128|s>>>8,o[i++]=255&s;for(var f=e.node||g,h=0;6>h;h++)o[i+h]=f[h];return n?n:t(o)}function r(e,n,r){var o=n&&r||0;"string"==typeof e&&(n="binary"==e?new l(16):null,e=null),e=e||{};var s=e.random||(e.rng||i)();if(s[6]=64|15&s[6],s[8]=128|63&s[8],n)for(var a=0;16>a;a++)n[o+a]=s[a];return n||t(s)}var i,o=this;if("function"==typeof require)try{var s=require("crypto").randomBytes;i=s&&function(){return s(16)}}catch(a){}if(!i&&o.crypto&&crypto.getRandomValues){var u=new Uint8Array(16);i=function(){return crypto.getRandomValues(u),u}}if(!i){var c=new Array(16);i=function(){for(var e,t=0;16>t;t++)0===(3&t)&&(e=4294967296*Math.random()),c[t]=255&e>>>((3&t)<<3);return c}}for(var l="function"==typeof Buffer?Buffer:Array,p=[],f={},h=0;256>h;h++)p[h]=(h+256).toString(16).substr(1),f[p[h]]=h;var d=i(),g=[1|d[0],d[1],d[2],d[3],d[4],d[5]],m=16383&(d[6]<<8|d[7]),v=0,y=0,b=r;if(b.v1=n,b.v4=r,b.parse=e,b.unparse=t,b.BufferClass=l,o.define&&define.amd)define(function(){return b});else if("undefined"!=typeof module&&module.exports)module.exports=b;else{var w=o.uuid;b.noConflict=function(){return o.uuid=w,b},o.uuid=b}}.call(this);
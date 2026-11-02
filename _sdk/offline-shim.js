/* Site Saver performance: caps render resolution on high-DPI screens. F8 cycles balanced / low / native. */
(function(){
  try{
    var KEY="ss_res",mode=localStorage.getItem(KEY)||"balanced";
    var real=window.devicePixelRatio||1;
    var cap=({native:99,balanced:1,low:0.75})[mode]||1;
    Object.defineProperty(window,"devicePixelRatio",{configurable:true,get:function(){return Math.min(real,cap);}});
    window.addEventListener("keydown",function(e){
      if(e.key==="F8"){
        e.preventDefault();
        var order=["balanced","low","native"],n=order[(order.indexOf(mode)+1)%3];
        try{localStorage.setItem(KEY,n);}catch(x){}
        location.reload();
      }
    },true);
  }catch(e){}
})();
/* Site Saver offline shim: serves Brotli/Gzip-compressed files without any server headers. */
(function(){
  var M={"Build/sdsd.data.unityweb":1,"Build/sdsd.framework.js.unityweb":1,"Build/sdsd.wasm.unityweb":1};
  var cs=document.currentScript;
  if(!cs||!window.Promise||!window.fetch){return;}
  var root=new URL("../",cs.src).href;
  var origFetch=window.fetch;
  var packs={},cache={};
  window.__ss_pack=function(key,b64){packs[key]=b64;};
  function load(src){
    return new Promise(function(ok,bad){
      var s=document.createElement("script");
      s.src=src;
      s.onload=function(){ok(s);};
      s.onerror=function(){bad(new Error("Site Saver: could not load "+src));};
      (document.head||document.documentElement).appendChild(s);
    });
  }
  function b64bytes(b64){
    var n=b64.length,pad=0;
    if(b64.charAt(n-1)==="="){pad++;}
    if(b64.charAt(n-2)==="="){pad++;}
    var out=new Uint8Array((n/4)*3-pad),o=0,CH=4194304;
    for(var i=0;i<n;i+=CH){
      var bin=atob(b64.substr(i,CH));
      for(var j=0;j<bin.length;j++){out[o++]=bin.charCodeAt(j);}
    }
    return out;
  }
  function ensureBrotli(){
    if(window.BrotliDecode){return Promise.resolve();}
    return load(root+"_sdk/brotli-decode.js");
  }
  function typeOf(k){
    k=k.toLowerCase().replace(/\.(br|gz)$/,"");
    if(/\.wasm$/.test(k)){return "application/wasm";}
    if(/\.(js|mjs)$/.test(k)){return "application/javascript";}
    if(/\.json$/.test(k)){return "application/json";}
    if(/\.css$/.test(k)){return "text/css";}
    if(/\.html?$/.test(k)){return "text/html";}
    return "application/octet-stream";
  }
  function get(key){
    if(cache[key]){return cache[key];}
    var p=load(root+key.split("/").map(encodeURIComponent).join("/")+".js").then(function(s){
      var b64=packs[key];
      delete packs[key];
      if(s.parentNode){s.parentNode.removeChild(s);}
      var bytes=b64bytes(b64);
      b64=null;
      if(/\.br$/i.test(key)){
        return ensureBrotli().then(function(){
          var r=window.BrotliDecode(new Int8Array(bytes.buffer,bytes.byteOffset,bytes.length));
          return new Uint8Array(r.buffer,r.byteOffset,r.length);
        });
      }
      if(/\.gz$/i.test(key)&&window.DecompressionStream){
        var st=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
        return new Response(st).arrayBuffer().then(function(ab){return new Uint8Array(ab);});
      }
      return bytes;
    });
    cache[key]=p;
    p.then(function(){setTimeout(function(){delete cache[key];},0);},function(){delete cache[key];});
    return p;
  }
  function keyOf(url){
    try{
      var href=new URL(url,document.baseURI).href;
      if(href.indexOf(root)===0){
        var key=decodeURIComponent(href.substring(root.length).split(/[?#]/)[0]);
        if(M[key]){return key;}
      }
    }catch(e){}
    return null;
  }
  window.fetch=function(input,init){
    var key=keyOf((typeof input==="string")?input:((input&&input.url)||String(input)));
    if(key){
      return get(key).then(function(buf){
        return new Response(buf,{status:200,statusText:"OK",headers:{"Content-Type":typeOf(key),"Content-Length":String(buf.byteLength)}});
      });
    }
    return origFetch.apply(this,arguments);
  };
  /* Scripts loaded straight from a compressed file (e.g. Unity framework .js.br) */
  try{
    var d=Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype,"src");
    if(d&&d.set){
      Object.defineProperty(HTMLScriptElement.prototype,"src",{
        configurable:true,enumerable:d.enumerable,
        get:function(){return d.get.call(this);},
        set:function(v){
          var key=keyOf(v),self=this;
          if(!key){d.set.call(this,v);return;}
          get(key).then(function(buf){
            d.set.call(self,URL.createObjectURL(new Blob([buf],{type:"application/javascript"})));
          },function(){d.set.call(self,v);});
        }
      });
    }
  }catch(e){}
})();

/* Site Saver debug panel: press F9 on the saved page to see load errors and copy them. */
(function(){
  var log=[],panel=null,ta=null;
  function add(s){
    log.push(Math.round(performance.now()/1000)+"s  "+s);
    if(log.length>500){log.shift();}
    if(ta){ta.value=log.join("\n");ta.scrollTop=ta.scrollHeight;}
  }
  var oe=console.error,ow=console.warn;
  console.error=function(){try{add("ERROR "+Array.prototype.join.call(arguments," ").slice(0,300));}catch(e){}return oe.apply(this,arguments);};
  console.warn=function(){try{add("WARN  "+Array.prototype.join.call(arguments," ").slice(0,300));}catch(e){}return ow.apply(this,arguments);};
  window.addEventListener("error",function(e){
    var t=e.target;
    if(t&&t!==window&&(t.src||t.href)){add("FAILED TO LOAD "+(t.src||t.href));}else{add("JS ERROR "+e.message);}
  },true);
  window.addEventListener("unhandledrejection",function(e){add("PROMISE ERROR "+((e.reason&&e.reason.message)||e.reason));});
  var f=window.fetch;
  if(f){
    window.fetch=function(){
      var a=arguments,u=(typeof a[0]==="string")?a[0]:(a[0]&&a[0].url);
      return f.apply(this,a).then(function(r){if(!r.ok){add("HTTP "+r.status+" "+u);}return r;},function(e){add("FETCH FAILED "+u+" ("+e+")");throw e;});
    };
  }
  var xo=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(m,u){
    var x=this;
    x.addEventListener("error",function(){add("XHR FAILED "+u);});
    x.addEventListener("load",function(){if(x.status>=400){add("XHR "+x.status+" "+u);}});
    return xo.apply(this,arguments);
  };
  function toggle(){
    if(panel){panel.parentNode.removeChild(panel);panel=null;ta=null;return;}
    panel=document.createElement("div");
    panel.style.cssText="position:fixed;left:0;right:0;bottom:0;height:45%;z-index:2147483647;background:#000d;color:#0f0;font:12px monospace;padding:4px;box-sizing:border-box";
    ta=document.createElement("textarea");
    ta.readOnly=true;
    ta.style.cssText="width:100%;height:calc(100% - 26px);background:#000;color:#0f0;border:1px solid #0f0;font:12px monospace";
    ta.value=log.join("\n");
    var b1=document.createElement("button");b1.textContent="Copy";
    b1.onclick=function(){ta.select();try{document.execCommand("copy");}catch(e){}};
    var b2=document.createElement("button");b2.textContent="Close (F9)";b2.onclick=toggle;
    panel.appendChild(ta);panel.appendChild(b1);panel.appendChild(b2);
    document.body.appendChild(panel);
  }
  window.addEventListener("keydown",function(e){if(e.key==="F9"){e.preventDefault();toggle();}},true);
})();
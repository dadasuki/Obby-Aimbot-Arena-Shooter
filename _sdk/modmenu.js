/* OP Mod Menu — Insert key or the gear button toggles it. */
(function(){
  var ls=window.localStorage;
  /* ---------- game speed (virtual clock) ---------- */
  var rNow=performance.now.bind(performance), rDate=Date.now.bind(Date);
  var speed=1,vBase=rNow(),rBase=vBase,dBase=rDate(),drBase=dBase;
  performance.now=function(){return vBase+(rNow()-rBase)*speed;};
  Date.now=function(){return dBase+(rDate()-drBase)*speed;};
  function setSpeed(s){vBase=performance.now();dBase=Date.now();rBase=rNow();drBase=rDate();speed=s;}

  /* ---------- helpers ---------- */
  function canvas(){return document.getElementById("unity-canvas")||document.querySelector("canvas");}
  function key(type,code,kc,ch){
    var c=canvas()||document;
    var e=new KeyboardEvent(type,{key:ch,code:code,keyCode:kc,which:kc,bubbles:true,cancelable:true});
    try{Object.defineProperty(e,"keyCode",{get:function(){return kc;}});Object.defineProperty(e,"which",{get:function(){return kc;}});}catch(x){}
    c.dispatchEvent(e);
  }
  function mouse(type){
    var c=canvas();if(!c)return;
    c.dispatchEvent(new MouseEvent(type,{button:0,buttons:type==="mouseup"?0:1,bubbles:true,cancelable:true,view:window}));
  }
  function readSave(){
    try{var d=JSON.parse(ls.getItem("ysdk_data")||"{}");if(d.saves&&d.saves[0])return JSON.parse(d.saves[0]);}catch(e){}
    return null;
  }
  function writeSave(o){
    var d={};try{d=JSON.parse(ls.getItem("ysdk_data")||"{}");}catch(e){}
    d.saves=[JSON.stringify(o)];ls.setItem("ysdk_data",JSON.stringify(d));
  }

  /* ---------- features state ---------- */
  var holdFire=false,rapid=false,rapidMs=60,rapidT=null,rapidDown=false,bhop=false,bhopT=null,fpsOn=true;
  function updRapid(){
    clearInterval(rapidT);rapidT=null;
    if(holdFire){mouse("mousedown");}
    else if(rapid){rapidT=setInterval(function(){rapidDown=!rapidDown;mouse(rapidDown?"mousedown":"mouseup");},rapidMs);}
    else{mouse("mouseup");}
  }
  function updBhop(){
    clearInterval(bhopT);bhopT=null;
    if(bhop){bhopT=setInterval(function(){key("keydown","Space",32," ");setTimeout(function(){key("keyup","Space",32," ");},30);},120);}
  }

  /* ---------- UI ---------- */
  function build(){
    var css=document.createElement("style");
    css.textContent=
    "#opm{position:fixed;top:60px;left:20px;width:310px;max-height:80vh;overflow:auto;z-index:2147483646;background:rgba(14,14,24,.94);color:#e8e8f4;font:13px/1.4 system-ui,Segoe UI,Arial,sans-serif;border:1px solid #7c5cff;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.6);display:none}"+
    "#opm h3{margin:0;padding:10px 14px;background:linear-gradient(90deg,#7c5cff,#ff4f9a);border-radius:11px 11px 0 0;font-size:15px;cursor:move;user-select:none}"+
    "#opm .b{padding:10px 14px}#opm .s{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#9a9ac0;margin:10px 0 4px}"+
    "#opm label{display:flex;align-items:center;justify-content:space-between;margin:5px 0}"+
    "#opm input[type=number],#opm textarea{width:100%;box-sizing:border-box;background:#1b1b2e;color:#fff;border:1px solid #3a3a5c;border-radius:6px;padding:5px}"+
    "#opm textarea{height:110px;font:11px monospace}#opm input[type=range]{width:150px}"+
    "#opm button{background:#7c5cff;color:#fff;border:0;border-radius:6px;padding:6px 10px;margin:3px 3px 0 0;cursor:pointer;font-weight:600}#opm button:hover{background:#9478ff}"+
    "#opm button.d{background:#d63a5a}"+
    "#opg{position:fixed;top:12px;left:12px;z-index:2147483646;width:36px;height:36px;border-radius:50%;border:1px solid #7c5cff;background:rgba(14,14,24,.85);color:#fff;font-size:18px;cursor:pointer;opacity:.6}#opg:hover{opacity:1}"+
    "#opf{position:fixed;top:14px;right:14px;z-index:2147483646;color:#0f0;font:12px monospace;background:#000a;padding:2px 6px;border-radius:4px;pointer-events:none}";
    document.head.appendChild(css);

    var g=document.createElement("button");g.id="opg";g.textContent="\u2699";g.title="Mod menu (Insert)";document.body.appendChild(g);
    var f=document.createElement("div");f.id="opf";document.body.appendChild(f);
    var m=document.createElement("div");m.id="opm";
    m.innerHTML=
    '<h3>\u26A1 OP Mod Menu <span style="float:right;font-weight:400;font-size:11px">Insert = hide</span></h3><div class="b">'+
    '<div class="s">Economy &amp; unlocks</div>'+
    '<label>Money <input id="op_money" type="number" style="width:140px"></label>'+
    '<label>Lock money to this amount <input id="op_mon" type="checkbox"></label>'+
    '<label>Unlock all skins &amp; guns <input id="op_unl" type="checkbox"></label>'+
    '<button id="op_apply">Apply &amp; reload</button>'+
    '<div class="s">Game speed</div>'+
    '<label><span id="op_sv">1.0x</span><input id="op_speed" type="range" min="0.2" max="5" step="0.1" value="1"></label>'+
    '<div class="s">Combat</div>'+
    '<label>Hold fire (auto) <input id="op_hold" type="checkbox"></label>'+
    '<label>Rapid fire <input id="op_rapid" type="checkbox"></label>'+
    '<label><span id="op_rv">60 ms</span><input id="op_rate" type="range" min="20" max="300" step="10" value="60"></label>'+
    '<div class="s">Movement</div>'+
    '<label>Auto-jump (bhop) <input id="op_bhop" type="checkbox"></label>'+
    '<div class="s">Misc</div>'+
    '<label>FPS counter <input id="op_fps" type="checkbox" checked></label>'+
    '<button id="op_fs">Fullscreen</button>'+
    '<div class="s">Save editor (JSON)</div>'+
    '<textarea id="op_json" spellcheck="false"></textarea>'+
    '<button id="op_load">Load save</button><button id="op_save">Write &amp; reload</button><button id="op_wipe" class="d">Wipe save</button>'+
    '</div>';
    document.body.appendChild(m);

    function $(id){return document.getElementById(id);}
    ["click","pointerdown","mousedown","mouseup","keydown","keyup","wheel","contextmenu"].forEach(function(t){
      [m,g].forEach(function(el){el.addEventListener(t,function(e){e.stopPropagation();},false);});
    });
    function toggle(){
      var show=m.style.display!=="block";m.style.display=show?"block":"none";
      if(show){try{document.exitPointerLock();}catch(e){}loadSave();}
    }
    g.onclick=toggle;
    window.addEventListener("keydown",function(e){if(e.key==="Insert"){e.preventDefault();toggle();}},true);

    /* drag */
    (function(){var h=m.firstChild,ox,oy,dr=false;
      h.addEventListener("mousedown",function(e){dr=true;ox=e.clientX-m.offsetLeft;oy=e.clientY-m.offsetTop;});
      window.addEventListener("mousemove",function(e){if(dr){m.style.left=(e.clientX-ox)+"px";m.style.top=(e.clientY-oy)+"px";}});
      window.addEventListener("mouseup",function(){dr=false;});})();

    function loadSave(){
      var s=readSave();$("op_json").value=s?JSON.stringify(s,null,1):"(no save yet - play until the game saves, then reopen)";
      if(s&&typeof s.Money==="number"&&!$("op_money").value)$("op_money").value=s.Money;
    }
    $("op_money").value=ls.getItem("mod_money")||999999999;
    $("op_mon").checked=ls.getItem("mod_money_on")!=="0";
    $("op_unl").checked=ls.getItem("mod_unlock")!=="0";
    $("op_apply").onclick=function(){
      ls.setItem("mod_money",String(parseInt($("op_money").value)||999999999));
      ls.setItem("mod_money_on",$("op_mon").checked?"1":"0");
      ls.setItem("mod_unlock",$("op_unl").checked?"1":"0");
      var s=readSave();if(s){var v=parseInt($("op_money").value);if(!isNaN(v))s.Money=v;
        if($("op_unl").checked)["isBoughtSkins","isBoughtGuns"].forEach(function(k){if(Array.isArray(s[k]))s[k]=s[k].map(function(){return true;});});
        writeSave(s);}
      location.reload();
    };
    $("op_speed").oninput=function(){var v=parseFloat(this.value);setSpeed(v);$("op_sv").textContent=v.toFixed(1)+"x";};
    $("op_hold").onchange=function(){holdFire=this.checked;if(holdFire){rapid=false;$("op_rapid").checked=false;}updRapid();};
    $("op_rapid").onchange=function(){rapid=this.checked;if(rapid){holdFire=false;$("op_hold").checked=false;}updRapid();};
    $("op_rate").oninput=function(){rapidMs=parseInt(this.value);$("op_rv").textContent=rapidMs+" ms";if(rapid)updRapid();};
    $("op_bhop").onchange=function(){bhop=this.checked;updBhop();};
    $("op_fps").onchange=function(){fpsOn=this.checked;f.style.display=fpsOn?"block":"none";};
    $("op_fs").onclick=function(){var c=document.documentElement;if(document.fullscreenElement)document.exitFullscreen();else if(c.requestFullscreen)c.requestFullscreen();};
    $("op_load").onclick=loadSave;
    $("op_save").onclick=function(){try{writeSave(JSON.parse($("op_json").value));location.reload();}catch(e){alert("Invalid JSON: "+e.message);}};
    $("op_wipe").onclick=function(){if(confirm("Wipe the whole save?")){ls.removeItem("ysdk_data");location.reload();}};

    var frames=0,last=rNow();
    (function loop(){frames++;var n=rNow();if(n-last>=1000){f.textContent=Math.round(frames*1000/(n-last))+" FPS";frames=0;last=n;}requestAnimationFrame(loop);})();
  }
  if(document.body)build();else document.addEventListener("DOMContentLoaded",build);
})();

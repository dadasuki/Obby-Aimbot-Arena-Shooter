(function(){
  var ls=window.localStorage;
  function ok(v){return Promise.resolve(v);}
  /* MOD: infinite money + all skins/guns unlocked. Patches the save JSON on every load and save. */
  var MOD_MONEY=parseInt(ls.getItem("mod_money"))||999999999;
  var MOD_UNLOCK=ls.getItem("mod_unlock")!=="0";
  function modPatch(str){
    try{
      var o=JSON.parse(str);
      if(!o||typeof o!=="object"){return str;}
      if(ls.getItem("mod_money_on")!=="0"){o.Money=MOD_MONEY;}
      if(MOD_UNLOCK)["isBoughtSkins","isBoughtGuns"].forEach(function(k){
        if(Array.isArray(o[k])){o[k]=o[k].map(function(){return true;});}
      });
      return JSON.stringify(o);
    }catch(e){return str;}
  }
  function modData(d){
    try{
      if(d&&Array.isArray(d.saves)){d.saves=d.saves.map(function(x){return typeof x==="string"?modPatch(x):x;});}
    }catch(e){}
    return d;
  }
  function load(k){try{return JSON.parse(ls.getItem(k)||"{}");}catch(e){return {};}}
  var player={
    getName:function(){return "Player";},getPhoto:function(){return "";},getUniqueID:function(){return "local-player";},
    getMode:function(){return "lite";},isAuthorized:function(){return false;},
    uniqueID:"local-player",publicName:"Player",scopePermissions:{avatar:"forbid",public_name:"forbid"},signature:"",
    getPayingStatus:function(){return "unknown";},getAvatarSrc:function(){return "";},getIDsPerGame:function(){return ok([]);},
    getData:function(){return ok(modData(load("ysdk_data")));},
    setData:function(d){ls.setItem("ysdk_data",JSON.stringify(modData(d)||{}));return ok();},
    getStats:function(){return ok(load("ysdk_stats"));},
    setStats:function(d){ls.setItem("ysdk_stats",JSON.stringify(d||{}));return ok();},
    incrementStats:function(){return ok();}
  };
  var ysdk={
    features:{LoadingAPI:{ready:function(){}},GameplayAPI:{start:function(){},stop:function(){}},GamesAPI:{getAllGames:function(){return ok({games:[],developerURL:""});},getGameByID:function(){return ok({isAvailable:false});}}},
    adv:{
      showFullscreenAdv:function(o){var c=(o&&o.callbacks)||{};if(c.onOpen)c.onOpen();if(c.onClose)c.onClose(false);},
      showRewardedVideo:function(o){var c=(o&&o.callbacks)||{};if(c.onOpen)c.onOpen();if(c.onRewarded)c.onRewarded();if(c.onClose)c.onClose();},
      getBannerAdvStatus:function(){return ok({stickyAdvIsShowing:false});},showBannerAdv:function(){return ok();},hideBannerAdv:function(){return ok();}
    },
    getPlayer:function(){return ok(player);},
    auth:{openAuthDialog:function(){return Promise.reject(new Error("offline"));}},
    getStorage:function(){return ok(ls);},
    environment:{app:{id:"0"},browser:{lang:"en"},i18n:{lang:(navigator.language||"en").slice(0,2),tld:"com"},payload:""},
    deviceInfo:{type:"desktop",isMobile:function(){return false;},isDesktop:function(){return true;},isTablet:function(){return false;},isTV:function(){return false;}},
    isAvailableMethod:function(){return ok(false);},
    feedback:{canReview:function(){return ok({value:false,reason:"UNKNOWN"});},requestReview:function(){return ok({feedbackSent:false});}},
    screen:{fullscreen:{status:"off",request:function(){var e=document.documentElement;if(e.requestFullscreen)e.requestFullscreen();return ok();},exit:function(){if(document.exitFullscreen)document.exitFullscreen();return ok();}},orientation:{value:"landscape",lock:function(){}}},
    getLeaderboards:function(){return ok({getLeaderboardDescription:function(){return ok({});},setLeaderboardScore:function(){return ok();},getLeaderboardPlayerEntry:function(){return Promise.reject({code:"LEADERBOARD_PLAYER_NOT_PRESENT"});},getLeaderboardEntries:function(){return ok({entries:[]});}});},
    getPayments:function(){return ok({getCatalog:function(){return ok([]);},getPurchases:function(){return ok([]);},purchase:function(){return Promise.reject(new Error("offline"));},consumePurchase:function(){return ok();}});},
    getFlags:function(){return ok({});},
    shortcut:{canShowPrompt:function(){return ok({canShow:false});},showPrompt:function(){return ok({outcome:"rejected"});}},
    clipboard:{writeText:function(t){return navigator.clipboard?navigator.clipboard.writeText(t):ok();}},
    on:function(){},off:function(){},dispatchEvent:function(){return ok();},
    serverTime:function(){return Date.now();},
    EVENTS:{EXIT:"EXIT",HISTORY_BACK:"HISTORY_BACK"}
  };
  function whenLoaded(){return new Promise(function(r){function go(){setTimeout(r,300);}if(document.readyState==="complete"){go();}else{window.addEventListener("load",go);}});}
  window.YaGames={init:function(){return whenLoaded().then(function(){return ysdk;});}};
})();

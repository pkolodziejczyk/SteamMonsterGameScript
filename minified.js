var debug=false;var clicksPerSecond=g_TuningData.abilities[1].max_num_clicks;var autoClickerVariance=Math.floor(clicksPerSecond/10);clicksPerSecond-=Math.ceil(autoClickerVariance/2);var respawnCheckFreq=5000;var targetSwapperFreq=1000;var abilityUseCheckFreq=2000;var itemUseCheckFreq=5000;var seekHealingPercent=20;var upgradeManagerFreq=30000;var useMedicsAtPercent=30;var useNukeOnSpawnerAbovePercent=75;var useMetalDetectorOnBossBelowPercent=30;var useStealHealthAtPercent=15;var autoClickerFreq=1000;var autoRespawner,autoClicker,autoTargetSwapper,autoTargetSwapperElementUpdate,autoAbilityUser,autoItemUser,autoUpgradeManager;var elementUpdateRate=60000;var userElementMultipliers=[1,1,1,1];var userMaxElementMultiiplier=1;var swapReason;function startAutoClicker(){if(autoClicker){console.log("Autoclicker is already running!");return}autoClicker=setInterval(function(){if(!gameRunning())return;var randomVariance=Math.floor(Math.random()*autoClickerVariance*2)-(autoClickerVariance);var clicks=clicksPerSecond+randomVariance;g_Minigame.m_CurrentScene.m_nClicks=clicks;g_msTickRate=1100;var numCrits=g_Minigame.m_CurrentScene.m_rgStoredCrits.length;g_Minigame.m_CurrentScene.m_rgStoredCrits=[];if(debug){if(numCrits>1)console.log('Clicking '+clicks+' times this second. ('+numCrits+' crits).');if(numCrits==1)console.log('Clicking '+clicks+' times this second. (1 crit).');else console.log('Clicking '+clicks+' times this second.');var damage=g_Minigame.m_CurrentScene.CalculateDamage(g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_per_click*userMaxElementMultiiplier*g_Minigame.m_CurrentScene.m_nClicks);var damageStr="(unknown)";if(damage>1000000000)damageStr=(damage/1000000000)+"B";else if(damage>1000000)damageStr=(damage/1000000)+"M";else if(damage>1000)damageStr=(damage/1000)+"K";console.log('We did roughly '+damageStr+' damage in the last second.')}},autoClickerFreq);console.log("autoClicker has been started.")}function startAutoUpgradeManager(){if(autoUpgradeManager){console.log("UpgradeManager is already running!");return}autoUpgradeManager=setInterval(function(){if(debug)console.log('Checking for worthwhile upgrades');var survivalTime=30;var elementalCoefficient=0.35;var elementalSpecializations=2;var clickFrequency=clicksPerSecond+Math.ceil(autoClickerVariance/2);var scene;var next={id:-1,cost:0};var necessary=[{id:0,level:1},{id:11,level:1},{id:2,level:10},{id:1,level:10},];var gAbilities=[11,13,16,18,17,14,15,12,];var gHealthUpgrades=[0,8,20];var gAutoUpgrades=[1,9,21];var gDamageUpgrades=[2,10,22];var gElementalUpgrades=[3,4,5,6];var getUpgrade=function(id){var result=null;if(scene.m_rgPlayerUpgrades){scene.m_rgPlayerUpgrades.some(function(upgrade){if(upgrade.upgrade==id){result=upgrade;return true}})}return result};var canUpgrade=function(id){if(!scene.bHaveUpgrade(id))return false;var data=scene.m_rgTuningData.upgrades[id];var required=data.required_upgrade;if(required!==undefined){var level=data.required_upgrade_level||1;return(level<=scene.GetUpgradeLevel(required))}return true};var necessaryUpgrade=function(){var best={id:-1,cost:0};var upgrade,id;while(necessary.length>0){upgrade=necessary[0];id=upgrade.id;if(getUpgrade(id).level<upgrade.level){best={id:id,cost:scene.m_rgTuningData.upgrades[id].cost};break}necessary.shift()}return best};var nextAbilityUpgrade=function(){var best={id:-1,cost:0};gAbilities.some(function(id){if(canUpgrade(id)&&getUpgrade(id).level<1){best={id:id,cost:scene.m_rgTuningData.upgrades[id].cost};return true}});return best};var bestHealthUpgrade=function(){var best={id:-1,cost:0,hpg:0};gHealthUpgrades.forEach(function(id){if(!canUpgrade(id))return;var data=scene.m_rgTuningData.upgrades[id];var upgrade=getUpgrade(id);var cost=data.cost*Math.pow(data.cost_exponential_base,upgrade.level);var hpg=scene.m_rgTuningData.player.hp*data.multiplier/cost;if(hpg>=best.hpg){best={id:id,cost:cost,hpg:hpg}}});return best};var bestDamageUpgrade=function(){var best={id:-1,cost:0,dpg:0};var dpc=scene.m_rgPlayerTechTree.damage_per_click;var data,cost,dpg;gAutoUpgrades.forEach(function(id){if(!canUpgrade(id))return;data=scene.m_rgTuningData.upgrades[id];cost=data.cost*Math.pow(data.cost_exponential_base,getUpgrade(id).level);dpg=(scene.m_rgPlayerTechTree.base_dps/clickFrequency)*data.multiplier/cost;if(dpg>=best.dpg){best={id:id,cost:cost,dpg:dpg}}});gDamageUpgrades.forEach(function(id){if(!canUpgrade(id))return;data=scene.m_rgTuningData.upgrades[id];cost=data.cost*Math.pow(data.cost_exponential_base,getUpgrade(id).level);dpg=scene.m_rgTuningData.player.damage_per_click*data.multiplier/cost;if(dpg>=best.dpg){best={id:id,cost:cost,dpg:dpg}}});if(canUpgrade(7)){data=scene.m_rgTuningData.upgrades[7];cost=data.cost*Math.pow(data.cost_exponential_base,getUpgrade(7).level);dpg=(scene.m_rgPlayerTechTree.crit_percentage*dpc)*data.multiplier/cost;if(dpg>best.dpg){best={id:7,cost:cost,dpg:dpg}}}data=scene.m_rgTuningData.upgrades[4];var elementalLevels=gElementalUpgrades.reduce(function(sum,id){return sum+getUpgrade(id).level},1);cost=data.cost*Math.pow(data.cost_exponential_base,elementalLevels);dpg=(elementalCoefficient*dpc)*data.multiplier/cost;if(dpg>=best.dpg){var level=gElementalUpgrades.map(function(id){return getUpgrade(id).level}).sort(function(a,b){return b-a})[elementalSpecializations-1];var match=gElementalUpgrades.filter(function(id){return getUpgrade(id).level==level});match=match[Math.floor(Math.random()*match.length)];best={id:match,cost:cost,dpg:dpg}}return best};var timeToDie=function(){var maxHp=scene.m_rgPlayerTechTree.max_hp;var enemyDps=scene.m_rgGameData.lanes.reduce(function(max,lane){return Math.max(max,lane.enemies.reduce(function(sum,enemy){return sum+enemy.dps},0))},0);return maxHp/(enemyDps||scene.m_rgGameData.level*4||1)};var updateNext=function(){next=necessaryUpgrade();if(next.id===-1){if(timeToDie()<survivalTime){next=bestHealthUpgrade()}else{var damage=bestDamageUpgrade();var ability=nextAbilityUpgrade();next=(damage.cost<ability.cost||ability.id===-1)?damage:ability}}if(debug&&next.id!==-1){console.log('next buy:',scene.m_rgTuningData.upgrades[next.id].name,'('+FormatNumberForDisplay(next.cost)+')')}};return function(){scene=g_Minigame.CurrentScene();if(scene.m_bUpgradesBusy)return;if(next.id===-1||timeToDie()<survivalTime)updateNext();if(next.id!==-1){if(next.cost<=scene.m_rgPlayerData.gold){$J('.link').each(function(){if($J(this).data('type')===next.id){scene.TryUpgrade(this);next.id=-1;return false}})}}}},upgradeManagerFreq);console.log("autoUpgradeManager has been started.")}function startAutoRespawner(){if(autoRespawner){console.log("autoRespawner is already running!");return}autoRespawner=setInterval(function(){if(debug)console.log('Checking if the player is dead.');if(g_Minigame.m_CurrentScene.m_bIsDead){if(debug)console.log('Player is dead. Respawning.');RespawnPlayer()}},respawnCheckFreq);console.log("autoRespawner has been started.")}function startAutoTargetSwapper(){if(autoTargetSwapper){console.log("autoTargetSwapper is already running!");return}updateUserElementMultipliers();autoTargetSwapperElementUpdate=setInterval(updateUserElementMultipliers,elementUpdateRate);autoTargetSwapper=setInterval(function(){var currentTarget=null;g_Minigame.m_CurrentScene.m_rgEnemies.each(function(potentialTarget){if(compareMobPriority(potentialTarget,currentTarget))currentTarget=potentialTarget});var oldTarget=g_Minigame.m_CurrentScene.m_rgEnemies[g_Minigame.m_CurrentScene.m_rgPlayerData.target];if(currentTarget!=null&&(oldTarget==undefined||currentTarget.m_data.id!=oldTarget.m_data.id)){if(debug&&swapReason!=null){console.log(swapReason);swapReason=null}if(g_Minigame.m_CurrentScene.m_rgPlayerData.current_lane!=currentTarget.m_nLane)g_Minigame.m_CurrentScene.TryChangeLane(currentTarget.m_nLane);g_Minigame.m_CurrentScene.TryChangeTarget(currentTarget.m_nID)}else if(currentTarget!=null&&oldTarget==undefined&&currentTarget.m_data.id!=oldTarget.m_data.id&&g_Minigame.m_CurrentScene.m_rgPlayerData.current_lane!=currentTarget.m_nLane){g_Minigame.m_CurrentScene.TryChangeLane(currentTarget.m_nLane)}},targetSwapperFreq);console.log("autoTargetSwapper has been started.")}function startAutoAbilityUser(){if(autoAbilityUser){console.log("autoAbilityUser is already running!");return}autoAbilityUser=setInterval(function(){if(debug)console.log("Checking if it's useful to use an ability.");var percentHPRemaining=g_Minigame.CurrentScene().m_rgPlayerData.hp/g_Minigame.CurrentScene().m_rgPlayerTechTree.max_hp*100;var target=g_Minigame.m_CurrentScene.m_rgEnemies[g_Minigame.m_CurrentScene.m_rgPlayerData.target];var targetPercentHPRemaining;if(target)targetPercentHPRemaining=target.m_data.hp/target.m_data.max_hp*100;if(hasAbility(5)){}if(hasAbility(6)){}if(percentHPRemaining<=useMedicsAtPercent&&!g_Minigame.m_CurrentScene.m_bIsDead){if(debug)console.log("Health below threshold. Need medics!");if(hasAbility(7)&&!currentLaneHasAbility(7)){if(debug)console.log("Unleash the medics!");castAbility(7)}else if(debug)console.log("No medics to unleash!")}if(target!=undefined&&target.m_data.type==2&&targetPercentHPRemaining<=useMetalDetectorOnBossBelowPercent){if(hasAbility(8)){if(debug)console.log('Using Metal Detector.');castAbility(8)}}if(target!=undefined&&target.m_data.type==0&&targetPercentHPRemaining>=useNukeOnSpawnerAbovePercent){if(hasAbility(10)){if(debug)console.log('Nuclear launch detected.');castAbility(10)}}if(hasAbility(11)){}if(hasAbility(12)){}},abilityUseCheckFreq);console.log("autoAbilityUser has been started.")}function startAutoItemUser(){if(autoItemUser){console.log("autoItemUser is already running!");return}autoItemUser=setInterval(function(){if(debug)console.log("Checking if it's useful to use an item.");var percentHPRemaining=g_Minigame.CurrentScene().m_rgPlayerData.hp/g_Minigame.CurrentScene().m_rgPlayerTechTree.max_hp*100;if(percentHPRemaining<=useStealHealthAtPercent&&!g_Minigame.m_CurrentScene.m_bIsDead){if(hasAbility(23)&&!currentLaneHasAbility(7)){if(debug)console.log("Stealing Health!");castAbility(23)}}},itemUseCheckFreq);console.log("autoItemUser has been started.")}function startAllAutos(){startAutoClicker();startAutoRespawner();startAutoTargetSwapper();startAutoAbilityUser();startAutoItemUser();startAutoUpgradeManager()}function stopAutoClicker(){if(autoClicker){clearInterval(autoClicker);autoClicker=null;console.log("autoClicker has been stopped.")}else console.log("No autoClicker is running to stop.")}function stopAutoRespawner(){if(autoRespawner){clearInterval(autoRespawner);autoRespawner=null;console.log("autoRespawner has been stopped.")}else console.log("No autoRespawner is running to stop.")}function stopAutoTargetSwapper(){if(autoTargetSwapper){clearInterval(autoTargetSwapper);autoTargetSwapper=null;console.log("autoTargetSwapper has been stopped.")}else console.log("No autoTargetSwapper is running to stop.")}function stopAutoAbilityUser(){if(autoAbilityUser){clearInterval(autoAbilityUser);autoAbilityUser=null;console.log("autoAbilityUser has been stopped.")}else console.log("No autoAbilityUser is running to stop.")}function stopAutoItemUser(){if(autoItemUser){clearInterval(autoItemUser);autoItemUser=null;console.log("autoItemUser has been stopped.")}else console.log("No autoItemUser is running to stop.")}function stopAutoUpgradeManager(){if(autoUpgradeManager){clearInterval(autoUpgradeManager);autoUpgradeManager=null;console.log("autoUpgradeManager has been stopped.")}else console.log("No autoUpgradeManager is running to stop.")}function stopAllAutos(){stopAutoClicker();stopAutoRespawner();stopAutoTargetSwapper();stopAutoAbilityUser();stopAutoItemUser();stopAutoUpgradeManager()}function disableAutoNukes(){useNukeOnSpawnerAbovePercent=200;console.log('Automatic nukes have been disabled')}function castAbility(abilityID){if(hasAbility(abilityID))g_Minigame.CurrentScene().TryAbility(document.getElementById('ability_'+abilityID).childElements()[0])}function currentLaneHasAbility(abilityID){return laneHasAbility(g_Minigame.CurrentScene().m_rgPlayerData.current_lane,abilityID)}function laneHasAbility(lane,abilityID){return g_Minigame.m_CurrentScene.m_rgLaneData[lane].abilities[abilityID]}function hasAbility(abilityID){return((1<<abilityID)&g_Minigame.CurrentScene().m_rgPlayerTechTree.unlocked_abilities_bitfield)&&g_Minigame.CurrentScene().GetCooldownForAbility(abilityID)<=0}function updateUserElementMultipliers(){if(!gameRunning())return;userElementMultipliers[3]=g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_multiplier_air;userElementMultipliers[4]=g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_multiplier_earth;userElementMultipliers[1]=g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_multiplier_fire;userElementMultipliers[2]=g_Minigame.m_CurrentScene.m_rgPlayerTechTree.damage_multiplier_water;userMaxElementMultiiplier=Math.max.apply(null,userElementMultipliers)}function getMobTypePriority(potentialTarget){mobType=potentialTarget.m_data.type;switch(mobType){case 0:return 0;case 3:return 1;case 2:return 2;case 4:return 3}return-Number.MAX_VALUE}function compareMobPriority(mobA,mobB){if(mobA==null)return false;if(mobB==null){swapReason="Swapping off a non-existent mob.";return true}var percentHPRemaining=g_Minigame.CurrentScene().m_rgPlayerData.hp/g_Minigame.CurrentScene().m_rgPlayerTechTree.max_hp*100;var aHasHealing=laneHasAbility(mobA.m_nLane,7)||laneHasAbility(mobA.m_nLane,23);var bHasHealing=laneHasAbility(mobB.m_nLane,7)||laneHasAbility(mobB.m_nLane,23);var aIsGold=laneHasAbility(mobA.m_nLane,17);var bIsGold=laneHasAbility(mobB.m_nLane,17);var aTypePriority=getMobTypePriority(mobA);var bTypePriority=getMobTypePriority(mobB);var aElemMult=userElementMultipliers[g_Minigame.m_CurrentScene.m_rgGameData.lanes[mobA.m_nLane].element];var bElemMult=userElementMultipliers[g_Minigame.m_CurrentScene.m_rgGameData.lanes[mobB.m_nLane].element];if(laneHasAbility(mobA.m_nLane,16))aElemMult=userMaxElementMultiiplier;if(laneHasAbility(mobB.m_nLane,16))bElemMult=userMaxElementMultiiplier;var aHP=mobA.m_data.hp;var bHP=mobB.m_data.hp;if(mobA.m_bIsDestroyed)return false;else if(mobB.m_bIsDestroyed){swapReason="Swapping off a destroyed mob.";return true}else if(percentHPRemaining<=seekHealingPercent&&!g_Minigame.m_CurrentScene.m_bIsDead){if(aHasHealing!=bHasHealing){if(aHasHealing){swapReason="Swapping to lane with active healing.";return true}}}else if(aIsGold!=bIsGold){if(aIsGold){swapReason="Switching to target with Raining Gold.";return true}}else if(aTypePriority!=bTypePriority){if(aTypePriority>bTypePriority){swapReason="Switching to higher priority target.";return true}}else if(aElemMult!=bElemMult){if(aElemMult>bElemMult){swapReason="Switching to elementally weaker target.";return true}}else if(aHP!=bHP){if(aHP<bHP){swapReason="Switching to lower HP target.";return true}}return false}function gameRunning(){return typeof g_Minigame==="object"&&g_Minigame.m_CurrentScene.m_rgGameData.status==2}function addPointer(){g_Minigame.m_CurrentScene.m_rgFingerTextures=[];var w=26;var h=49;for(var y=0;y<4;y++){for(var x=0;x<5;x++){g_Minigame.m_CurrentScene.m_rgFingerTextures.push(new PIXI.Texture(g_rgTextureCache.pointer.texture,{x:x*w,y:y*h,width:w,height:h}))}}g_Minigame.m_CurrentScene.m_nFingerIndex=0;g_Minigame.m_CurrentScene.m_spriteFinger=new PIXI.Sprite(g_Minigame.m_CurrentScene.m_rgFingerTextures[g_Minigame.m_CurrentScene.m_nFingerIndex]);g_Minigame.m_CurrentScene.m_spriteFinger.scale.x=g_Minigame.m_CurrentScene.m_spriteFinger.scale.y=2;g_Minigame.m_CurrentScene.m_containerParticles.addChild(g_Minigame.m_CurrentScene.m_spriteFinger)}if(typeof unsafeWindow!='undefined'){unsafeWindow.startAutoClicker=startAutoClicker;unsafeWindow.startAutoRespawner=startAutoRespawner;unsafeWindow.startAutoTargetSwapper=startAutoTargetSwapper;unsafeWindow.startAutoAbilityUser=startAutoAbilityUser;unsafeWindow.startAutoItemUser=startAutoItemUser;unsafeWindow.startAllAutos=startAllAutos;unsafeWindow.stopAutoClicker=stopAutoClicker;unsafeWindow.stopAutoRespawner=stopAutoRespawner;unsafeWindow.stopAutoTargetSwapper=stopAutoTargetSwapper;unsafeWindow.stopAutoAbilityUser=stopAutoAbilityUser;unsafeWindow.stopAutoItemUser=stopAutoItemUser;unsafeWindow.stopAllAutos=stopAllAutos;unsafeWindow.disableAutoNukes=disableAutoNukes;unsafeWindow.castAbility=castAbility;unsafeWindow.hasAbility=hasAbility}var startAll=setInterval(function(){if(!gameRunning())return;startAllAutos();addPointer();clearInterval(startAll)},1000);CSceneGame.prototype.ClearNewPlayer=function(){if(this.m_spriteFinger){var bPlayedBefore=WebStorage.SetLocal('mg_how2click',1);$J('#newplayer').hide()}}
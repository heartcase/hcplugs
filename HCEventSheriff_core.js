//=============================================================================
// HCEventSheriff_core.js
//=============================================================================
/*:
 * @plugindesc 创建/删除 事件 核心库.
 * @author HeartCase Li
 *
 * @param Map ID
 * @desc 脚本从此编号的地图上拷贝事件
 * @default 1
 *
 * @help 创建1个张地图专门用来放置想要创建的事件作为事件数据库. 
 * 脚本指令:
 * CreateEvent id x y # 创建在事件数据库编号为id的指定事件于当前地图x,y
 * RemoveEvent x y    # 移除在本地图x,y位置上的由本脚本创建的事件.
 */
$gameES = {};
$gameES._eventLists = [];
$gameES._lastObject = {};
$gameES._lastContent = {};
$gameES._lastSprite = {};
$gameES._foundEvent = {};
$gameES._errLog = [];
//useful function
$gameES.forEachInDo = function(set, job, args){
	for(var i=0; i < set.length; i++){
		if(job.call(this, set, i, args)) return true;
	}
	return false;
}
$gameES.getFreeSpace = function(set){
	var i = 1;
	while(set[i] != undefined) i++;
	return i;
}
$gameES.report = function(msg){
	this._errLog.push(msg);
	console.log(msg);
}
//content
$gameES.createContent = function(content, index, x, y){
	var data = JsonEx.makeDeepCopy(content);
	data.id = index;
	data.x = x;
	data.y = y;
	this._lastContent = data;
	return data;
}
$gameES.removeContent = function(obj){
	var index = obj._eventId;
	$dataMap.events[index] = undefined;
}
//object
$gameES.createObject = function(index){
	var obj = new Game_Event($gameMap._mapId, index);
	obj._ES = true;
	obj._isCursor = false;
	obj._settled = true;
	this._lastObject = obj;
	return obj;
}
$gameES.removeObject = function(obj){
	var index = $gameMap._events.indexOf(obj);
	$gameMap._events[index] = undefined;
}
//sprite
$gameES.createSprite = function(obj){
	var container = SceneManager._scene.children[0]._tilemap;
	var img = new Sprite_Character(obj);
	container.addChild(img);
	this._lastSprite = img;
}
$gameES.removeSprite = function(obj){
	var set = SceneManager._scene.children[0]._tilemap.children;
	var job = function(set, i, obj){
		var container = SceneManager._scene.children[0]._tilemap;
		if(set[i]._character === obj) container.removeChild(set[i]);
	}
	this.forEachInDo(set, job, obj);
}
//check conditions
$gameES.isESEvent = function(obj){
	if(obj._settled != true){
		this.report("Not An ES Event:Event is Picked");
		return false;
	}
	if(obj._ES != true ){
		this.report("Not An ES Event: Created By Others");
		return false;
	}
	if(obj._isCursor == true){
		this.report("Not An ES Event: Is a cursor");
		return false;
	}
	this.report("Is An ES Event");
	return true;
}
$gameES.hasEvent = function(x, y){
	var set = $gameMap._events;
	var job = function(set, i){
		if(set[i] == undefined) return false;
		if(set[i]._x == x && set[i]._y == y && this.isESEvent(set[i])){
			this._foundEvent = set[i];
			this.report("Event is Found");
			return true;
		}
		this.report("No Event Found");
		return false;
	}
	return this.forEachInDo(set, job);
}
//create Event
$gameES.createEvent = function(content, x, y){
	if(content == undefined){
		this.report("Fail To Create Event: content is undefined");
		return false;
	}
	var index = this.getFreeSpace($dataMap.events);
	$dataMap.events[index] = this.createContent(content, index, x, y);
	$gameMap._events[index] = this.createObject(index);
	this.createSprite($gameMap._events[index]);
	if($gameES._eventLists[$gameMap._mapId] == undefined){
		$gameES._eventLists[$gameMap._mapId] = [];
	}
	$gameES._eventLists[$gameMap._mapId] = JsonEx.makeDeepCopy($dataMap.events);
}
$gameES.createEventByID = function(id, x, y){
	var content = $dataES.events[id];
	this.createEvent(content, x, y);
}
//remove Event
$gameES.removeEvent = function(obj){
	this.removeSprite(obj);
	this.removeContent(obj);
	this.removeObject(obj);
}
$gameES.removeEventAt = function(x, y){
	if(this.hasEvent(x, y)){
		this.removeEvent(this._foundEvent);
	}else{
		this.report("Cannot Remove Event: no event is found");
	}
}

!function(){
	var parameters = PluginManager.parameters('HCEventSheriff_core');
	var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	var _DataManager_createGameObjects = DataManager.createGameObjects;
	var _Scene_Map_start = Scene_Map.prototype.start;
	var _DataManager_makeSaveContents = DataManager.makeSaveContents;
	var _DataManager_extractSaveContents = DataManager.extractSaveContents;
	var mid = Number(parameters['Map ID'] || 0);
	var filename = 'Map%1.json'.format(mid.padZero(3));
	DataManager.loadDataFile('$dataES', filename);
	Scene_Map.prototype.start = function() {
		_Scene_Map_start.call(this);
		var set = $gameES._eventLists[$gameMap._mapId];
		if(set != undefined){
			if(set.length > 0){
				$dataMap.events = $gameES._eventLists[$gameMap._mapId];
			}
		}
	}	
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'CreateEvent') {
			var id = String(args[0] || '1');
			var x = String(args[1] || '1');
			var y = String(args[2] || '1');
			id = parseInt(id);
			x = parseInt(x);
			y = parseInt(y);
			$gameES.createEventByID(id, x, y);
        }
		if (command === 'RemoveEvent') {
			var x = String(args[0] || '1');
			var y = String(args[1] || '1');
			x = parseInt(x);
			y = parseInt(y);
			$gameES.removeEventAt(x, y);
        }
    };
	DataManager.createGameObjects = function() {
		_DataManager_createGameObjects.call(this);
		$gameES._eventLists = [];
	}
	DataManager.makeSaveContents = function() {
		var contents = _DataManager_makeSaveContents.call(this);
		contents.gameES_groupLists = $gameES._groupLists;
		contents.gameES_eventLists = $gameES._eventLists;
		return contents;
	}
	DataManager.extractSaveContents = function(contents) {
		_DataManager_extractSaveContents.call(this, contents);
		$gameES._groupLists = contents.gameES_groupLists;
		$gameES._eventLists = contents.gameES_eventLists;		
	}
}();
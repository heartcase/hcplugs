//=============================================================================
// HCEventSheriff_buildEx.js
//=============================================================================
/*:
 * @plugindesc ES建筑模式的拓展, 新增功能:
 * -事件组的放置, 移除, 选取 和 移动
 * -设置事件组的库存
 * -动画效果
 * -UI(窗口待添加)
 * -错误提示
 * @author HeartCase Li
 *
 * @help
 * 在建筑模式按下ok键或鼠标左键可以在指针处放置id为$gameES._newEventID的事件组;
 * 在已有事件组的位置按下ok键或鼠标会拾取这个事件组, 并进入拖拽模式.
 * 在拖拽模式中, 按下ok键或鼠标会放置这个事件组到当前位置.
 * 如果有部分事件显示深色表示当前图块不可放置
 * 在建筑模式下按下D键可以删除整个鼠标所指的事件组.
 */
 function Game_EventGroup(){
	this.initialize.apply(this, arguments);
}

!function(){
	function run(){
			s = setInterval(checkLoaded,1000);
	}
	function checkLoaded(){
		if($dataES != null){
			clearInterval(s);			
			$dataES.eventsGroups = [];
			var set = $dataES.events;	
			for(var i=0; i < set.length ; i++){
				if(set[i] == undefined){
					continue;
				}
				DataManager.extractMetadata(set[i]);
				if(set[i].meta.group != undefined){
						var width = $dataES.width;
						var height = $dataES.height;
						var id =  $dataES.data[(5 * height + set[i].y) * width + set[i].x] || 0;
						if($dataES.eventsGroups[id] == undefined){
							$dataES.eventsGroups[id] = [];
						}
						$dataES.eventsGroups[id].push(set[i]);
				}
			}
			var outerSet = $dataES.eventsGroups;
			for(var i=0; i < outerSet.length; i++){
				if(outerSet[i] != undefined){
					var innerSet = outerSet[i];
					var offsetX = innerSet[0].x;
					var offsetY = innerSet[0].y;
					for(var j = 0; j< innerSet.length; j++){
						innerSet[j].x -= offsetX;
						innerSet[j].y -= offsetY;
					}
				}
			}
		}
	}
	run();
}();

$gameES._lastGroup = {};
$gameES._pickedGroup = undefined;
$gameES._originalX = null;
$gameES._originalY = null;
$gameES._groupLists = [];
$gameES._foundGroup = {};
$gameES._foundID = 0;
$gameES._newGroupID = 1;
$gameES._moving = false;
$gameES._placeable = false;
$gameES._groupCreated = false;
//Game_EventGroup class
Game_EventGroup.prototype.initialize = function(id, x, y){
	this._groupID = id;
	this._x = x;
	this._y = y;
	this._contents = [];
	this._objects = [];
	this.setup();
}
Game_EventGroup.prototype.setup = function(){
	var set = $dataES.eventsGroups[this._groupID];
	if(set == undefined){
		return;
	}		
	for(var i=0; i < set.length; i++){
		var dx = set[i].x + this._x;
		var dy = set[i].y + this._y;
		if(!$gameES.canBuild(set[i], dx, dy)){
			this.terminate();
			$gameES._groupCreated = false;
			return;
		}
		$gameES.createEvent(set[i], dx, dy);
		$gameES._lastObject._ox = set[i].x;
		$gameES._lastObject._oy = set[i].y;
		this._contents.push($gameES._lastContent);
		this._objects.push($gameES._lastObject);
	}
	$gameES._groupCreated = true;
}
Game_EventGroup.prototype.terminate = function(){
	var set = this._objects;
	if(set == undefined){
		return;
	}		
	for(var i=0; i < set.length; i++){
		$gameES.removeEvent(set[i]);
	}
}
//check function
$gameES.isInGroup = function(obj, group){	
	if(group == undefined){
		return false;
	}
	var set = group._objects;
	for(var i=0; i < set.length; i++){
		if(obj == set[i]){
			return true;
		}
	}
	return false;
}
$gameES.hasGroupAt = function(x, y){
	if (!this.hasEvent(x, y)){
		return false;
	}
	var set = this._groupLists;
	for(var i=0; i < set.length; i++){
		if($gameES.isInGroup(this._foundEvent, set[i])){
			$gameES._foundGroup = set[i];
			return true;
		}
	}
	return false;
}
$gameES.hasGroup = function(group){
	this._foundGroup = undefined;
	var set = this._groupLists;
	for(var i=0; i < set.length; i++){
		if(set[i] == group){
			this._foundID = i;
			return true; 
		}
	}
	return false;
}
$gameES.isPicking = function(){
	return (this._pickedGroup != undefined);
}
$gameES.canPutGroup = function(){
	var test = true;
	var set = this._pickedGroup._objects;
	for(var i=0; i < set.length; i++){
		var content = this._pickedGroup._contents[i];
		if(this.canBuild(content, set[i]._x, set[i]._y)){
			set[i]._blendMode = 0;
		}else{
			test = false;
			set[i]._blendMode = 2;
		}
	}
	this._placeable = test;
	return test;
}
//createGroup
$gameES.createGroup = function(id, x, y){
	var group = new Game_EventGroup(id, x, y);
	if($gameES._groupCreated){
		this._lastGroup = group;
		this._groupLists.push(group);
	}else{
		delete group;
	}
}
//removeGroup
$gameES.removeGroup = function(group){
	if(this.hasGroup(group)){
		this._groupLists.splice(this._foundID , 1);
		var set = group._objects;
		for(var i=0; i < set.length; i++){
			this.removeEvent(set[i]);
		}
	}
}
$gameES.removeGroupAt = function(x, y){
	if(this.hasGroupAt(x,y)){
		this.removeGroup(this._foundGroup);
	}
}
//pickGroup
$gameES.setESFlag = function(group, bool){
	var set = group._objects;
	for(var i=0; i < set.length; i++){
		set[i]._settled = bool;
	}
}
$gameES.pickGroup = function(group){
	this._pickedGroup = group;
	this.setOpacity(group, 175);
	this.setESFlag(group, false);
	SceneManager._scene.children[0]._tilemap.removeChild(this._cursorSprite);
}
$gameES.pickGroupAt = function(x,y){
	if(this.hasGroupAt(x,y)){
		this.pickGroup(this._foundGroup);
	}
}
$gameES.setOpacity = function(group, opacity){
	var set = group._objects;
	for(var i=0; i < set.length; i++){
		set[i]._opacity = opacity;
	}
}
$gameES.putGroup = function(){
	if(this.canPutGroup()){
		SceneManager._scene.children[0]._tilemap.addChild(this._cursorSprite);
		this.setOpacity(this._pickedGroup, 255);
		this.setESFlag(this._pickedGroup, true);
		this._pickedGroup = undefined;
	}

}
//update
$gameES.updatePickedGroup = function(){	
	if(!this.isPicking()){
		return;
	}
	var set = this._pickedGroup._objects;
	for(var i=0; i < set.length; i++){
		set[i]._x = set[i]._ox + this._gridX;
		set[i]._realX = set[i]._x;
		set[i]._y = set[i]._oy + this._gridY;
		set[i]._realY = set[i]._y;
	}
	this.canPutGroup();
}
$gameES.update = function(){
	this.updateInput();
	this.updateMapScrolling();
	this.updateCursorPosition();
	this.updatePickedGroup();
}
$gameES.updateInput = function(){
	if(Input.isTriggered("Build")){
		if(this.isStateOn()){
			this.stateOff(false);
		}else{
			this.stateOn(false);
		}
	}
	if(!this.isStateOn()){
		return;
	}
	if((Input.isTriggered("ok") || TouchInput.isTriggered()) && this.isIdle()){
		if(!this.isPicking()){
			this.createGroup(this._newGroupID, this._gridX, this._gridY);
		}
		if(!$gameES._groupCreated){
			if(this.hasGroupAt(this._gridX, this._gridY) && !this.isPicking()){
				this.pickGroup(this._foundGroup);
			} else if(this.isPicking()) {
				this.putGroup();
			}	
			return;
		}
	}
	if(Input.isTriggered("Delete") && this.isIdle() && !this.isPicking()){
		this.removeGroupAt(this._gridX, this._gridY);
	}
}
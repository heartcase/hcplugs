//=============================================================================
// HCEventSheriff_build.js
//=============================================================================
/*:
 * @plugindesc ES建筑模式. 提供了一种在地图上可视的放置事件的方法.
 * @author HeartCase Li
 *
 * @param Cursor ID
 * @desc 指定在事件数据库地图中序号为id的事件作为指针样式
 * @default 1
 *
 * @help 在需要建筑的地图的注释上插入标签<ES>
 * 在地图上按B进入建筑模式, 如有需求可以修改脚本最前部分的按键配置;
 * 使用方向键或鼠标操作指针的位置.
 * 在建筑模式按下ok键可以在指针处放置id为$gameES._newEventID的事件;
 * 可以使用脚本指令: setEventID n 来修改$gameES._newEventID的值;
 * 在事件的注释中加入<region:n>的标签来限定该事件仅可以放在指定区域的图块上;
 */
//key setting
Input.keyMapper[66] = "Build";
Input.keyMapper[68] = "Delete";

$gameES._state = false;
$gameES._scrolling = false;
$gameES._cursorRealX = 0;
$gameES._cursorRealY = 0;
$gameES._cursorX = 0;
$gameES._cursorY = 0;
$gameES._cursorID = 0;
$gameES._cursorObject = {};
$gameES._cursorSprite = {};
$gameES._gridX = 0;
$gameES._gridY = 0;
$gameES._newEventID = 1;
//check
$gameES.isPlaceableRegion = function(content, x, y){
	DataManager.extractMetadata(content);		
	if(content.meta.region == undefined){
		$gameES.report("No Region Type Limitation");
		return true;
	}
	var eventRegionID = parseInt(content.meta.region);
	var mapRegionID = $gameMap.regionId(x, y);
	return (eventRegionID == mapRegionID);
	
}
$gameES.canBuild = function(content, x, y){
	if(this.hasEvent(x, y)){
		$gameES.report("Cannot Build: already have an event on this location");
		return false;
	}
	if(!this.isPlaceableRegion(content, x, y)){
		$gameES.report("Cannot Build: this event cannot build in this region");
		return false;
	}
	$gameES.report("Ready to build");
	return true;
}
$gameES.isStateOn = function(){
	return this._state;
}
$gameES.isESMap = function(){
	return $dataMap.meta.ES == true;
}
$gameES.canTurnOn = function(){
	var scene = SceneManager._scene;
	if(!this.isESMap()){
		$gameES.report("Cannot Turn On Build Mode: this is not an ES Map");
		return false;
	}
	if(scene.isBusy()){
		$gameES.report("Cannot Turn On Build Mode: scene is busy");
		return false;
	}
	if(scene._messageWindow.isOpen()){
		$gameES.report("Cannot Turn On Build Mode: message Window is opened");
		return false;
	}
	if($gamePlayer.isMoving()){
		$gameES.report("Cannot Turn On Build Mode: player is moving");
		return false;
	}
	return true;
}
$gameES.canTurnOff = function(){
	if(!this.isIdle()){
		$gameES.report("Cannot Turn Off Build Mode: in the middle of actions");
		return false;
	}
	return true;
}
$gameES.isIdle = function(){
	return true;
}
//state control
$gameES.stateInitialize = function(){
	$gameSystem.disableMenu();
	this.createCursor();
}
$gameES.stateTerminate = function(){
	$gamePlayer.center($gamePlayer.x , $gamePlayer.y );
	this.removeCursor();
	$gameSystem.enableMenu();
	
}
$gameES.stateOn = function(force){
	if(force || this.canTurnOn()){
		this._state = true;
		this.stateInitialize();
	}
}
$gameES.stateOff = function(force){
	if(force || this.canTurnOff()){
		this._state = false;
		this.stateTerminate();
	}
}	
//removeCursor
$gameES.removeCursor = function(){
	this.removeEvent(this._cursorObject);
}
//createCursor
$gameES.createCursor = function(){
	var content = $dataES.events[this._cursorID];
	this.createEvent(content, this._gridX, this._gridY); 
	this._cursorObject = this._lastObject;
	this._cursorSprite = this._lastSprite;
	this._cursorObject._isCursor = true;
}
//update
$gameES.update = function(){
	this.updateInput();
	this.updateMapScrolling();
	this.updateCursorPosition();
}
$gameES.updateInput = function(){
	if(Input.isTriggered("Build")){
		if(this.isStateOn()){
			this.stateOff(false);
		}else{
			this.stateOn(false);
		}
	}
	if(!this.isStateOn())
	{
		return;
	}
	if(Input.isTriggered("ok") && this.isIdle()){
		var content = $dataES.events[this._newEventID];
		if(!this.canBuild(content, this._gridX, this._gridY)){
			this.report("Fail To Build Event: cannot Build here");
			return;
		}
		this.createEvent(content, this._gridX, this._gridY);
	}
	if(Input.isTriggered("Delete") && this.isIdle()){
		this.removeEventAt(this._gridX, this._gridY);
	}
}
$gameES.updateCursorPosition = function(){
	this._cursorX = this._cursorRealX / $gameMap.tileWidth() + $gameMap._displayX;
	this._cursorY = this._cursorRealY / $gameMap.tileHeight() + $gameMap._displayY;	
	this._cursorObject._x = this._cursorX - 0.5;
	this._cursorObject._realX = this._cursorX - 0.5 ;
	this._cursorObject._y = this._cursorY - 0.5;
	this._cursorObject._realY = this._cursorY - 0.5;
}
$gameES.updateMapScrolling = function(){	
	if(this.isStateOn()){
		$gameES._scrolling = false
		$gameTemp.clearDestination();
		this._gridX = $gameMap.canvasToMapX($gameES._cursorRealX);
		this._gridY = $gameMap.canvasToMapY($gameES._cursorRealY);	
		var speed = 0.1;
		var space = 5;
		var screenGridX = this._gridX - $gameMap._displayX;
		var screenGridY = this._gridY - $gameMap._displayY;
		var endX = $gameMap.width() - $gameMap.screenTileX();
		var endY = $gameMap.height() - $gameMap.screenTileY();		
		if($gameMap.screenTileX() - screenGridX < space){
			$gameMap._displayX += speed;
			$gameES._scrolling = true;
		}
		if(screenGridX - 0  < space){
			$gameMap._displayX -= speed;
			$gameES._scrolling = true;
		}		
		if($gameMap.screenTileY() - screenGridY  < space){
			$gameMap._displayY += speed;
			$gameES._scrolling = true;
		}
		if(screenGridY - 0  < space){
			$gameMap._displayY -= speed;
			$gameES._scrolling = true;
		}
		$gameMap._displayX = endX < 0 ? endX / 2 : $gameMap._displayX.clamp(0, endX);
		$gameMap._displayY = endY < 0 ? endY / 2 : $gameMap._displayY.clamp(0, endY);
	}
}
!function(){
	var parameters = PluginManager.parameters('HCEventSheriff_build');
	var eid = Number(parameters['Cursor ID'] || 0);
	$gameES._cursorID = eid;
	TouchInput._onMouseMoveES = function(event) {
		$gameES._cursorRealX = Graphics.pageToCanvasX(event.pageX);
		$gameES._cursorRealY = Graphics.pageToCanvasY(event.pageY);
	};
	document.addEventListener('mousemove', TouchInput._onMouseMoveES.bind(TouchInput));
	Scene_Map.prototype.updateMain = function() {
		var active = this.isActive();
		$gameMap.update(active);
		$gameTimer.update(active);
		$gameScreen.update();
		$gameES.update();
		if(!$gameES.isStateOn()){
			$gamePlayer.update(active);
		}
	}
}();
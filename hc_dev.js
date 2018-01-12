//=============================================================================
// hc_dev.js
//=============================================================================
/*:
 * @plugindesc 插件调试用.
 * @author HeartCase Li
 *
 * @param sample_param
 * @desc 插件参数描述范例
 * @default 1
 *
 * @help 插件帮助范例
 */
!function(){
    // 读取插件参数
    var parameters = PluginManager.parameters('hc_dev');
    // 覆写插件指令解释方法
    var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    // 仅在闭包内可以访问
    var sample = Number(parameters['sample_param'] || 0);
    var ver = "0.0.0.1";
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        //范例command: <version> <param>
        if (command === 'version') {
            var param = String(args[0] || '1');
            console.log(
              "版本%1, 插件参数%2, 指令参数%3".format(ver, sample, param) 
            );
        }
    };
    // 测试1 异步请求 读取外部文件
    // http request
    var readJson = function(url, callback){
        var request = new XMLHttpRequest();
        request.open('GET', url);
        request.onload = function () {
            var result = JSON.parse(request.response);
            callback(result)
            SceneManager.pop()
        };
        request.onerror = function () {
            throw new Error("There was an error loading the file '" + url + "'.");
        };
        request.send();
        SceneManager.push(Scene_Loading);
    }
    // create scene
    function Scene_Loading(){
        this.initialize.apply(this, arguments);
    }
    Scene_Loading.prototype.create = function() {
        Scene_Base.prototype.create.call(this);
    };
    Scene_Loading.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_Loading.prototype.constructor = Scene_Loading;
    Scene_Loading.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
    };
}()

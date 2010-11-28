/*
    Web App Debugger v0.01
    by mr speaker
*/
(function($, container){

var nameTog = "wadbug-toggle",
    nameMes = "wadbug-messages",
    nameScreen = "wadbug-debug",
    runningTime = 0,
    doLiveUpdates = false,
    blnFirstLive = true,
    lastLiveHash =  -1;
    
var wadbug = {
    liveUrl: "server/wadbug.php",
    
    consoleLog: [],
    cmdHistory: [],
    historyIndex: 0,
    
    init: function(){
        runningTime = new Date();
        CacheMon.init();
        
        var _this = this;

        // Hijack console.log
        // TODO: other console methods!
        if(window.console){
            this.realConsole = window.console;
            window.console = {
                log: function(){
                    _this.consoleLog.push( arguments );
                    _this.realConsole.log.apply( _this.realConsole, arguments );
                }
            };
        }

        $(document).ready( function(){
            var dbg = $("<div></div>")
                .attr( "id", nameScreen )
                .addClass( "wadbug-hidden" )
                .appendTo( container || "body" );

            $("<div></div>")
                .attr( "id", nameTog )
                .appendTo( dbg );
                
            $("<div></div>")
                .attr( "id", nameMes )
                .appendTo( dbg );
            
            // Add commands
            _this.addMenuItem( "X", function(){ this.toggleMenu(); });
            _this.addMenuItem( "Home", function(){ 
                 $("#" + nameMes ).html( this.getAbilities() ); 
             });
            _this.addMenuItem( "Console", function(){
                this.setMessage( this.createMiniConsole() );
            });
            var cacheItem = _this.addMenuItem( "Cache", function(){
                this.setMessage( CacheMon.printLog() );
            }).hide();
            $(document).bind({
                "CacheEvent_First": function(){
                    cacheItem.show();
                },
                "CacheEvent": function(){
                    cacheItem.addClass("wadbug-live").delay(500).removeClass("wadbug-live");
                }
            });
            
            _this.addMenuItem( "Live", function(){
                var menuItem = $( "#" + nameTog + " span:contains(Live)" );
                if(!doLiveUpdates){
                    doLiveUpdates = true;
                    if(this.doLiveUpdate()){
                        menuItem.addClass( "wadbug-live" );
                    };
                } else {
                    menuItem.removeClass( "wadbug-live" );
                    doLiveUpdates = false;
                }
            });
        });
    },
    toggleMenu: function(){
        var screen =  $( "#" + nameScreen );
        screen.toggleClass('wadbug-hidden');
    },
    addMenuItem: function( text, cmd ){
        var _this = this;
        return $("<span></span>")
            .text( text )
            .addClass( "wadbug-menuItem" )
            .appendTo( "#" + nameTog )
            .click( function(){
                cmd.call(_this, arguments);
            });
    },
    setMessage: function( msg ){
        $( "#" + nameMes ).html( msg );
    },
    makeSubHead: function( msg ){
        return "<span class='wadbug-head'>" + msg + "</span>";
    },
    getAbilities: function(){
        var msg = [];
        msg.push( "Running time: " + ((new Date() - runningTime) / 1000) );
        msg.push( "<br/>" + this.makeSubHead("[ CAPABILITIES ]") );
        msg.push( "Offline storage: " + ( window.applicationCache !== undefined ) );
        msg.push( "Web storage: " + (window.openDatabase !== undefined) ); 
        msg.push( "GEO: " + ( navigator && navigator.geolocation !== undefined) );  
        msg.push( "Messaging: " + ( window.MessageEvent && window.MessageEvent !== undefined ) );
        msg.push( "<br/>" + this.makeSubHead("[ SETTINGS ]") );
        msg.push( "Standalone: " + ( navigator && navigator.standalone === undefined ? "-" : navigator.standalone ) );
        msg.push( "Orientation: " + ( window.orientation === undefined ? "-" : window.orientation ) );
        msg.push( "Online: " + ( navigator && navigator.onLine !== undefined && navigator.onLine ) );        
        if( navigator ){
            msg.push( "<br/>" + this.makeSubHead("[ NAVIGATOR DETAILS ]") );
            msg.push( "Platform: " + navigator.platform );
            msg.push( "Code Name: " + navigator.appCodeName );
            msg.push( "Name: " + navigator.appName );
            msg.push( "Version: " + navigator.appVersion );
            msg.push( "Cookies: " + (navigator.cookieEnabled !== null) );
        }
        msg.push( "<br/>" + this.makeSubHead("[ SCREEN ]") );
        msg.push( "W:" + window.outerHeight + " H:" + window.outerWidth );
        return msg.join( "<br/>" );
    },
    createMiniConsole: function(){
        var _this = this;
        var con = $("<div id='wadbug-console'>&nbsp;&gt;</div>");
        $("<input id='appmon_cmd' autocapitalize='off' autocapitalize='off'></input>")
            .bind("keydown", function(e){
                switch( e.keyCode ){
                    case 38:
                        _this.showHistory( false );
                        break;
                    case 40:
                        _this.showHistory( true );
                        break;
                    case 13:
                        $("#appmon_conbtn").click();
                        break;
                }
            })
            .appendTo( con );
        
        var cmdButtons = $("<div></div>").appendTo(con);
        $("<span id='appmon_conbtn'>Run</span>")
            .addClass("wadbug-button")
            .click(function(){
                var resultDiv = $("#wadbug-miniRes");
                resultDiv.html( _this.evalCommand( $('#appmon_cmd').val() )  + "<br/>" + resultDiv.html() );
            })
            .appendTo(cmdButtons);
            
        $("<span>Clear</span>")
            .addClass("wadbug-button")
            .click(function(){
                $('#wadbug-miniRes').text("");
            })
            .appendTo(cmdButtons);
        
        $("<span>Prev</span>")
            .addClass("wadbug-button")
            .click(function(){
                _this.showHistory( false );
            })
            .appendTo( cmdButtons );
        $("<span>Next</span>")
            .addClass("wadbug-button")
            .click( function(){
                _this.showHistory( true );
            })
            .appendTo( cmdButtons );
        $("<span>Help</span>")
            .addClass("wadbug-button")
            .click( function(){
                $('#wadbug-miniRes').html([
                    "Enter commands and hit return or 'Run'. You can scroll the results window by pressing the top/bottom half of the display.",
                    "","[Special Commands]",
                    _this.makeSubHead(":object_name") +" will loop through and print the object (for example: ':window.document')",
                    _this.makeSubHead("-command") +" will close the debugger and execute the command.",
                    _this.makeSubHead("?") +" lists the console.log entries.",
                    _this.makeSubHead("??") +" assigns the console.log entries to a global variable 'wadlog' for inspection with ':wadlog' etc."
                ].join("<br/>"));
            })
            .appendTo( cmdButtons );
            
        var miniCon = $("<div></div>")
            .attr( "id", "wadbug-miniResCon" )
            .appendTo( con );
        
        $("<div></div>")
            .attr( "id", "wadbug-miniRes" )
            .appendTo( miniCon )
            .bind({
                "mousedown": function(e){
                    if(e.pageY > 200){
                        $("#wadbug-miniRes").animate({"margin-top": "-=300px"}, 'fast');
                    }
                    if(e.pageY < 200){
                        if( parseInt( $("#wadbug-miniRes").css("margin-top"), 10 ) < 0){
                            $("#wadbug-miniRes").animate({"margin-top": "+=300px"}, 'fast', function(){
                                if(parseInt( $( this ).css("margin-top"), 10 ) > 0){
                                    $( this ).css("margin-top", 0);
                                }
                            });
                        }
                    }
                }
            })
            .html( _this.getConsoleHistory() );
        return con;
    },
    getConsoleHistory: function(){
        var res = [];
        for(var i = 0; i < this.consoleLog.length; i++){
            var msg = "<span>" + i + "</span>";
            for( var j = 0; j < this.consoleLog[ i ].length; j++ ){
                msg += this.consoleLog[ i ][ j ] + " ";
            }
            res.push( msg );
        }
        return res.join("<br/>");        
    },
    
    showHistory: function( blnDir ){
        this.historyIndex = blnDir ? this.historyIndex + 1: this.historyIndex - 1;
        if( this.historyIndex > this.cmdHistory.length-1 ) this.historyIndex = this.cmdHistory.length-1;
        if( this.historyIndex < 0 ) this.historyIndex = 0;
        $("#appmon_cmd").val( this.cmdHistory[ this.historyIndex ] );
    },
    
    evalCommand: function( cmd ){
        if(!cmd || cmd.length === 0) return "No command.";
        var res = "";
        this.cmdHistory.push(cmd);
        this.historyIndex = this.cmdHistory.length - 1;
        
        if( cmd[0] === '-' ){
            this.toggleMenu();
            return eval(cmd.slice(1));
        }
        
        if( cmd[0] === '?'){
            if(cmd.length == 1){
                return this.getConsoleHistory();
            }
            if(cmd[1]==='?'){
                window.wadlog = this.consoleLog;
                return "Console log assigned to 'wadlog' (inspect with " + this.makeSubHead(":wadlog") + " and " + this.makeSubHead(":wadlog[0]") + "etc.)";
            }
            return 'A single ? will list the log, ?? will assign the log to a global variable for inspection.';
        }
        if( cmd[0] === ':' ){
            cmd = eval(cmd.slice(1));
            for(var o in cmd){
                try {
                    var ores = cmd[o].toString();
                    ores = ores.length > 20 ? ores.slice(0,20) + "..." : ores;
                    res += o + " : " + ores + "<br/>";
                } catch(e){
                    res += o + " : ?<br/>";
                }
            }
        }
        else {
            try{
                res = eval(cmd).toString();
            }
            catch(e){
                res = e.message.replace('eval(cmd)', cmd);
            }
        }
        return res;
    },
    doLiveUpdate: function(){
        if(blnFirstLive){
            if(!confirm("Live updating will execute code from:\n" + this.liveUrl + "\nAre you sure?")){
                return false;
            };
            blnFirstLive = false;
        }
        var _this = this;
        $.ajax({
            type: "GET",
            url: _this.liveUrl,
            error: function(res){
                alert("Live updating failed from url:\n" + _this.liveUrl + "\nError: " + res.statusText + "");
                doLiveUpdates = false;
            },
            success: function( data ){
                var hash = data.slice(0,6);
                if( hash != lastLiveHash ){
                    lastLiveHash = hash;
                    data = data.slice(6,data.length);
                    try{
                        eval( data );
                    } catch( e ){
                        alert('error eval-ing...\n' + e.message);
                    }
                }
                setTimeout( function(){
                    if(doLiveUpdates){
                        _this.doLiveUpdate();
                    }
                }, 2000);
            }
        });
        return true;
    }
};

var CacheMon = {
    
    events: [ 'cached', 'checking', 'downloading', 'error', 'noupdate', 'obsolete', 'progress', 'updateready' ],
    statuses: [ 'uncached', 'idle', 'checking', 'downloading', 'updateready', 'obsolete' ],
    cache: null,
    initTime: null,
    history:[],
    
    init: function(){
        var _this = this;
        this.cache = window.applicationCache;
        for( var i = 0; i < this.events.length; i++ ){
            this.cache.addEventListener( this.events[ i ], function( e ){ _this.log(e); }, false );
        }
    },
    reset: function(){
        this.history = [];
    },
    log: function(e){
        if( this.initTime === null ){
            this.initTime = e.timeStamp;
        }
        var message = {
            time: e.timeStamp - this.initTime,
            type: e.type,
            online: navigator.onLine,
            status: this.statuses[ this.cache.status ],
            toString: function(){
                return "(" + this.time + ") '" + this.type + "' status:" + this.status + " online:" + this.online;
            }
        };
        if(document){
            if( this.history.length === 0 ){
               $(document).trigger( "CacheEvent_First", {} );
            }
            $(document).trigger( "CacheEvent", {} );
        }
        this.history.push( message );
    },
    printLog: function( seperator ){
        var ret = [];
        for( var i = 0; i < this.history.length; i++ ){
            ret.push( this.history[ i ].toString() );
        }
        return ret.join( seperator || '<br/>') || "No cache events";
    },
    updateCache: function(){
        var _this = this;
        this.cache.addEventListener( 'updateready', function(){
            _this.cache.swapCache();
            console.log('swap cache has been called');
        }, false );
    }
};

wadbug.init();

})(jQuery);
var Application, hooks = [], scroll, Clients, Conversations
Application = {
        container: null,
        resize: null,
        params: null,
        home: null,
        chat: null,
        run: null,
        native: false,
        log: {},
        keydown: null,
        executed: false
}
Application.run = function() {
        if( Application.native == true ) {
                console.log( 'Set native log functions' )
                
                // Because Phonegap sucks
                log.debug = function(msg){
                        console.log(msg)
                }
                log.warn = function(msg){
                        console.log(msg)
                }
                log.error = function(msg){
                        console.log(msg)
                }
                log.info = function(msg){
                        console.log(msg)
                }
                log.message = function(msg){
                        console.log(msg)
                }
        }
        
        if( Application.executed ) return console.log( 'Alreay executed' );
        Application.executed = true
        
        log.debug( 'Run Application' )
        container = $( '#container' )
        Application.home = function home() {
                lang.get( 'current', function( l ) {
                    switch( l ) {
                            case 'nl':
                                    $( '#your_location_pin' ).css({ 'margin-right': '-11px', 'margin-top': '2px' })
                            break;
                    }
                })
                
                if( $( '#container section.home' ).css( 'display' ) != 'block' ) {
                        $( '#container section' ).slideUp()
                        $( '#container section.home' ).slideDown(Application.resize)
                        $( 'header ul li' ).removeClass( 'selected' )
                        $( 'header ul li.home' ).addClass( 'selected' )
                }
                
                $( '#login_submit' ).show()
                $( '#register_submit' ).hide()
                $( '#home_no_account' ).show()
                $( '#home_has_account' ).hide()
                
                if( local.get( 'email' ) ) {
                        $( '#login_username' ).val( local.get( 'email' ) )
                        setTimeout(function(){
                                $( '#login_password' ).focus()
                        }, 500)
                }
                
                $( '#login_username, #login_password' ).keypress(function(){
                        $( 'section.home article.login' ).removeClass( 'red' )
                })
                
                $( '#login_submit' ).click(function( event, method ){
                        event.preventDefault()
                        Clients.getLocal().emit( 'authentication request' )
                        Clients.getLocal().authenticate({
                                'username': $( '#login_username' ).val(),
                                'password': $( '#login_password' ).val(),
                                'method'  : ( method ? method : 'plain' )
                        }, function( response ){
                                if( response.valid === true ) {
                                        $( 'section.home article.login' ).remove()
                                        $( 'header ul li.chat, header ul li.contacts' ).show()
                                        $( 'header ul li.home, header ul li.account' ).hide()
                                        Application.chat( 'main' )
                                }
                                else
                                        $( 'section.home article.login' ).addClass( 'red' )
                        })
                        return false;
               })
               
               if( local.get( 'hash' ) && Application.native ) {
                        $( '#login_password' ).val( local.get( 'hash' ) )
                        $( '#login_submit' ).trigger( 'click', ['hash'] )
               }
        }
        Application.register = function register() {
                if( $( '#container section.home' ).css( 'display' ) != 'block' ) {
                        $( '#container section' ).slideUp()
                        $( '#container section.home' ).slideDown(Application.resize)
                        $( 'header ul li' ).removeClass( 'selected' )
                        $( 'header ul li.home' ).addClass( 'selected' )
                }
                
                $( 'html,body' ).animate({ scrollTop: $( "#container section.home article.login" ).offset().top }, 'slow' )
                
                $( '#login_submit' ).hide()
                $( '#register_submit' ).show()
                $( '#home_no_account' ).hide()
                $( '#home_has_account' ).show()
                
                if( local.get( 'email' ) ) {
                        $( '#login_username' ).val( local.get( 'email' ) )
                        setTimeout(function(){
                                $( '#login_password' ).focus()
                        }, 500)
                }
                
                $( '#login_username, #login_password' ).keypress(function(){
                        $( 'section.home article.login' ).removeClass( 'red' )
                })
                
                $( '#login_submit' ).click(function( event ){
                        event.preventDefault()
                        Clients.getLocal().emit( 'register request' )
                        Clients.getLocal().register({
                                'username': $( '#login_username' ).val(),
                                'password': $( '#login_password' ).val(),
                                'method'  : 'plain'
                        }, function( response ){
                                if( response.valid === true ) {
                                        $( 'section.home article.login' ).remove()
                                        $( 'header ul li.chat, header ul li.contacts' ).show()
                                        $( 'header ul li.home, header ul li.account' ).hide()
                                }
                                else
                                        $( 'section.home article.login' ).addClass( 'red' )
                        })
                        return false;
                })
        }	        
        Application.features = function Features() {
                $( '#container section' ).slideUp()
                $( '#container section.features' ).slideDown(Application.resize)
                $( 'header ul li' ).removeClass( 'selected' )
                $( 'header ul li.features' ).addClass( 'selected' )
        }
        Application.plans = function() {
                $( '#container section' ).slideUp()
                $( '#container section.main' ).slideDown(Application.resize)
                $( 'header ul li' ).removeClass( 'selected' )
                $( 'header ul li.plans' ).addClass( 'selected' )
        }
        Application.faq = function() {
                $( '#container section' ).slideUp()
                $( '#container section.main' ).slideDown(Application.resize)
                $( 'header ul li' ).removeClass( 'selected' )
                $( 'header ul li.faq' ).addClass( 'selected' )
        }
        Application.chat = function Chat( id ) {
                var params = {id:id}
                if( !Clients.getLocal().is( 'authenticated' ) )
                        return Application.home()
                if( params && Conversations.get( 'active', 1 ) !== false && params[ 'id' ] == Conversations.get( 'active', 1 ).get( 'id' ) )
                        return log.debug( 'This conversation is already active' );
                        
                Application.params = params
                $( '#container .chat article.post textarea' ).unbind( 'keydown' ).keydown(function( event ){
                        if( $(this).val().length > 2000 ) $( this ).val( $(this).val().substr(0, 2000) )
                        if( event.keyCode == 13 ) {
                                $( '#container .chat article.post input' ).click()
                                event.preventDefault() 
                                return false
                        }
                })
                $( '#container .chat article.post input.prev' ).unbind( 'focus' ).bind( 'focus', function(){
                        gui.conversation.emit( 'prev tab', [false] )
                        $(this).blur()
                })
                $( '#container .chat article.post input.next' ).unbind( 'focus' ).bind( 'focus', function(){
                        gui.conversation.emit( 'next tab', [false] )
                        $(this).blur()
                })
                $( '#container' ).addClass( 'chat' )
                
                // Remove unneeded data for native
                if( Application.native ) {
                        $( 'header, footer' ).remove()
                        $( 'section.home, section.main, section.features' ).remove()  
                }

                if( Application.params[ 'id' ] == 'new' ) {
                        if( ( conv = Conversations.get( 'active', 1 ) ) !== false ) {
                                conv.set( 'active', 0 )
                                $( '#tab-list' ).find( 'li.current' ).removeClass( 'current' );
                                $( '#tab-list' ).find( 'li span.close' ).hide()
                        }

                        $( '#chat-content' ).parent().hide()
                        $( '#chat-content' ).parent().next().hide()
                        $( '#chat-head' ).hide()
                        $( '#container .chat article.post input' ).attr( 'value', lang.get( 'send' ) ).unbind( 'click' ).click(function(){
                                (new Conversation()).emit( 'create conversation', [$( '#container .chat article.post textarea' ).val()] )
                                $( '#container .chat article.post textarea' ).val('')
                        })
                }
                else {
                        $( '#chat-content' ).parent().show()
                        $( '#chat-content' ).parent().next().hide()
                        $( '#chat-content' ).parent().next().find( 'p' ).text( lang.get( 'file.drop' ) )
                        $( '#chat-content' ).parent().next().find( 'input' ).attr( 'value', lang.get( 'file.add' ) )
                        if( Application.native === false )
                                $( '#chat-head' ).show()
                        else
                                $( '#chat-head' ).hide()
                        $( '#container .chat article.post input[type="submit"]' ).attr( 'value', lang.get( 'send' ) ).unbind( 'click' ).click(function(){
                                if( ( conv = Conversations.get( 'active', 1 ) ) !== false ) {
                                        conv.emit( 'new message', [$( '#container .chat article.post textarea' ).val()] )
                                        $( '#container .chat article.post textarea' ).val('')
                                }
                        })
                }
        
                $( '#container section' ).css( 'display', 'none' )
                $( '#chat-thumbs' ).hide()
                $( '#container section.chat' ).css( 'display', 'block' )
                Application.resize.apply(this,[])
                
                $( 'header ul li' ).removeClass( 'selected' )
                $( 'header ul li.chat' ).addClass( 'selected' )
                if( Application.native === false ) 
                        setTimeout(function(){
                                $( '#container .chat article.post textarea' ).focus()
                        }, 50)
                delete params;
        }
        
        Application.home()        
        $(this).trigger( 'resize' )
        
        // Run hooks
        if( hooks.length ) {
                do {
                        try { (hooks.shift())(); } 
                        catch( e ) {
                                log.error( 'Hook crashed with the following reason(s)' )
                                log.error( e )
                        }
                } while( hooks.length )
        }
        else {
                log.debug( 'No hooks to run' )
        }
        delete hooks;
}

$(window).bind( 'keydown', function(event){
        if( Conversations.get( 'active', 1 ) !== false 
         && $( '#container .chat article.post textarea' )[0] != document.activeElement 
         && !Application.native ) {
                var e = jQuery.Event( 'keydown' );
                e.keyCode = event.keyCode;
                if( e.keyCode != 91 && !( Application.keydown == 91 && e.keyCode == 67) )
                        $( '#container .chat article.post textarea' ).focus().trigger( e )
                Application.keydown = e.keyCode
        }
}).resize(( Application.resize = function(){
        $( '#container' ).css( 'height', 'auto' )
        
        var outerHeight, total
        if( ( outerHeight = $( '#container' ).outerHeight() ) < $( window ).height() ) {
                $( '#container' ).css( 'height', ( $( window ).height() - ( Application.native ? 50 : 100 ) ) + 'px' )
                
                if( Application.native === false ) {
                        total = ($( window ).height()-outerHeight);
                        if( total > 0 ) 
                                $( '.chat .content' ).height( parseInt($( '.chat .content' ).css( 'min-height' )) + total )
                }
        }
        
        if( Application.native === false ) {
                $( '.chat .content' ).height( parseInt($( '.chat .content' ).css( 'min-height' )) );
                
                gui.conversation.emit( 'scrolldown' )
                if( local.get( 'fullscreen' ) == 1 ) 
                        $( '#container section.chat' ).css( 'width', ( $( window ).width() - 100 ) + 'px' )
                else
                        $( '#container section.chat' ).css( 'width', parseInt($( '#container section.chat' ).css( 'min-width' )) )
        }
        delete outerHeight, total;
}))

document.addEventListener( 'deviceready', function(){
        console.log( 'Device ready' )
        $( '#container, body, html' ).addClass( 'native' )
        createNativeFunctions()
        Application.native = true
        Application.executed = false
        
        // Events
        document.addEventListener( 'pause', function(){
                if( Clients.getLocal().connection ) {
                        Clients.getLocal().connection.socket.disconnect()
                }
        }, false)
        document.addEventListener( 'resume', function(){
                if( Clients.getLocal().connection ) {
                        gui.connection.emit( 'reconnect' )
                        Clients.getLocal().connection.socket.connect();
                }
        }, false)
        
        // Because PhoneGap debugging sucks, we run everything in a catch
        try {
                Application.run()
        }
        catch( e ) {
                console.log( e )
        }
}, false )

setTimeout(function(){
        if( !Application.native )
                Application.run()
}, 500)

// Lazy event emitters
var events = {
        clear: function() {
                this.events = {}
        },
        emit: function( name, args ) {
                if( (name in this.events) ) {
                        for( i in this.events[name] )
                                this.events[name][i].apply(this, args)
                }
        },
        on: function( name, cb ) {
                if( !(name in this.events) )
                        this.events[name] = []
                this.events[name].push(cb)
        }
}

// Just lazy helper object
var local = {
        set: function( key, value ) {
                if( !this.canStore() ) return debug( 'Unable to store on local machine' );
                localStorage.setItem( key, value );  
        },
        get: function( key ) {
                if( !this.canStore() ) return debug( 'Unable to load stored item on local machine' );
                return localStorage.getItem( key ) || '';
        },
        remove: function( key ) {
                if( !this.canStore() ) return debug( 'Unable to remove stored item from local machine' );
                if( this.item( key ) )
                        localStorage.removeItem( key );
        },
        
        // Check methods
        canStore: function() {
                return ( 'localStorage' in window ) 
                    && ( window[ 'localStorage' ] !== null );
        }
}

// Extend existing objects
Date.prototype.humanDate = function() {
        return lang.get( 'date.week.' + this.getDay() ).toLowerCase() + ' ' + this.getDate() + ' ' + lang.get( 'date.month.' + this.getMonth() ) + ' ' + this.getFullYear()
}
Date.prototype.humanTime = function() {
        return ( this.getHours() <= 9 ? '0' + this.getHours() : this.getHours() )  + ':' + ( this.getMinutes() <= 9 ? '0' + this.getMinutes() : this.getMinutes() )
}

function createNativeFunctions() {
        console.log( 'set APN & zoom' )
        
        // Zoom
        document.documentElement.addEventListener( 'touchstart', function(event) {
                if( (event.target.nodeName == 'SELECT') 
                 || (event.target.nodeName == 'INPUT') 
                 || (event.target.nodeName == 'TEXTAREA') ) { // it is a combo
                        document.getElementById( 'view' ).setAttribute( 'content', 'width=device-width, user-scalable=no' )
                        setTimeout(function () {
                            document.getElementById( 'view' ).setAttribute( 'content', 'width=device-width, user-scalable=yes' );
                        }, 1000);
                }
        }, true)

        // IMPORTANT: must start notify after device is ready,
        // otherwise you will not be able to receive the launching notification in callback
        //PushNotification.startNotify();
        window.plugins.pushNotification.startNotify();
        
        /**
         * Customize following callbacks in your application
         */
        
        // Customized callback for receiving notification
        PushNotification.prototype.notificationCallback = function (notification) {
            window.plugins.pushNotification.log("Received a notification.");
            // alert(notification['alert']);
        };
        
        // when APN register succeeded
        function successCallback(e) {
            registerUAPush(e.deviceToken, e.host, e.appKey, e.appSecret);
        }
        
        // when APN register failed
        function errorCallback(e) {
            console.log(e.error)
        }
        
        // register button action
        function registerAPN() {
            window.plugins.pushNotification.log("Registering with APNS via the App Delegate");
            window.plugins.pushNotification.register(successCallback, errorCallback, [{ alert:true, badge:true, sound:true }]);
        }
        
        // register urban airship push service after APN is registered successfully
        function registerUAPush(deviceToken, host, appKey, appSecret) {
            window.plugins.pushNotification.log("Registering with Local Data.");
            Clients.getLocal().set( 'device token', deviceToken )
        }
        
        registerAPN()
}
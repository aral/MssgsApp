Notify = { events: {}, popups: [] }
        $.extend(Notify, events)

// Notifications for the webkitties
hooks.push( function notifyHook() {
        // Request notifications enable
        Clients.getLocal().on( 'authentication request', function(){  
                if( window.webkitNotifications ) {
                        if( window.webkitNotifications.checkPermission() == 1 )    
                                window.webkitNotifications.requestPermission()  
                }
        })
        
        // Add listeners
        Conversations.on( 'add', function( convInstance ) { 
                convInstance.on( 'message', function( message ){
                        // We received a message
                        // log.debug( 'Received a message for notification' );
                        if( Application.native ) return false;
                        
                        // Do we have support/are we we/is notify.enabled true?
                        if (window.webkitNotifications 
                                && message.userid != Clients.getLocal().get( 'id' )
                                && Clients.getLocal().is( 'inactive' )) {
                                
                                // log.debug( 'We have webkitNotifications support and are not me' );
                                // And do we have permission (yawning already now)
                                if (window.webkitNotifications.checkPermission() == 0) { 
                                        popup = null;
                                        
                                        // log.debug( 'We have permission to show notifications, create one' );
                                        if( message.userid != -1 ) {                                   
                                                popup = window.webkitNotifications.createNotification( 'http://ava.mss.gs/' + message.userid + '.png', message.firstname + ' ' + message.lastname, message.message );
                                                popup.ondisplay = function(event){
                                                        if( navigator.userAgent.indexOf( 'Chrome' ) > -1 ) {
                                                                setTimeout(function(){
                                                                        event.currentTarget.cancel();
                                                                        Notify.popups.splice(Notify.popups.indexOf(event.currentTarget),1)
                                                                }, (5*1000))
                                                        }
                                                }
                                                Notify.popups.push(popup)
                                                popup.show()
                                        }
                                } 
                                else {
                                        log.debug( 'We have no permissions to show notifications' );
                                }
                        } else {
                                // log.debug( 'webkitNotifications disabled or active' );
                        }
                })
        })
        
        $( window ).bind( 'beforeunload', function(){
                if( Notify.popups.length ) {
                        Notify.popups.forEach(function(v,i){
                                v.cancel()
                        })
                }
        })
})
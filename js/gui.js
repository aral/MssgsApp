var gui = {}
gui.conversation = {
        maxState: 0,
        events: {}
}
gui.connection = {
        events: {}
}
$.extend( gui.connection, events )
gui.connection.on( 'reconnect', function(){
        $( '#loading' ).show().text( lang.get( 'reconnecting' ) )
})
gui.connection.on( 'connected', function(){
        $( '#loading' ).hide()
})
$.extend( gui.conversation, events )
gui.conversation.on( 'snapito', function(el){
        if( el.rolloverImage ) return; 
        $(el).unbind( 'mouseout' ).bind( 'mouseout', function(){
                if( this.rolloverImage ) {
                        this.rolloverImage.remove()
                        this.rolloverImage = null
                }
        }) 
        el.rolloverImage = $( '<span />' ).addClass( 'snapito' ).append( 
        $( '<img />' ).addClass( 'snapito' ).css({
                        'width': '150px',
                        'height': 'auto',
                }).attr( 'src', 'http://api.snapito.com/free/mc?url=' + $(el).attr( 'data-host' ) )
        ).bind( 'click', function(){ window.open($(this).next().attr( 'href' )) } ).css({
                'position': 'absolute',
                'z-index': 500,
                'width': '150px',
                'height': 'auto',
                'cursor': 'pointer'
        }).insertBefore( el )
})
gui.conversation.on( 'next tab', function(touch){
        log.debug( 'Next tab' )
        var tabList = $( '#tab-list li.tab.current' )
        var nextTab = tabList.next()
        if( nextTab && !nextTab.hasClass( 'tab' ) )
                nextTab = tabList.parent().find( 'li.tab:eq(0)' )
        nextTab.trigger( 'click', [touch])
        delete tabList
})
gui.conversation.on( 'prev tab', function(touch){
        log.debug( 'Prev tab' )
        var tabList = $( '#tab-list li.tab.current' )
        var prevTab = tabList.prev()
        if( prevTab && !prevTab.hasClass( 'tab' ) )
                prevTab = tabList.parent().find( 'li.tab:eq(' + ( tabList.parent().find( 'li.tab' ).length - 1 ) + ')' )
        prevTab.trigger( 'click', [touch])
        delete tabList
})
gui.conversation.on( 'hide slidedown tabs', function(){
        $( '#chats' ).hide()
})
gui.conversation.on( 'show slidedown tabs', function(){
        var tabs = $( '#chats' ), ul = tabs.find( 'ul' )
        tabs.addClass( 'active' )
        
        $( '<li />' ).addClass( 'close' ).bind( 'click touchstart', function(){
                if( event.type == 'click' && Application.native ) return false;
                gui.conversation.emit( 'hide slidedown tabs' )
        }).append(
                $( '<strong />' ).text( lang.get( 'close' ) )
        ).appendTo( ul )  
         
        for( i in Conversations.cache ) {
                var conv = Conversations.cache[i], names = [].concat( conv.get( 'usernames' ) ), str, li;
                names.splice( names.indexOf( Clients.getLocal().get( 'username' ) ), 1 )
                if( names.length == 0 ) continue;
                
                li = $( '<li />' ).addClass( 'tab' ).attr( 'data-conv', conv.get( 'id' ) ).data( 'conv', conv ).bind( 'click touchstart', function(event){
                        if( event.type == 'click' && Application.native ) return false;
                        gui.conversation.emit( 'activate conversation', [$(this).data( 'conv' ), touch] )
                }).addClass( ( conv.get( 'active' ) == 1 ? 'current' : 'deselected' ) ).append(
                        ( str = $( '<strong />' ).text( ( names.length == 1 ? names[0] : names.slice(0,-1).join( ', ' ) + ' ' + lang.get( 'and' ) + ' ' + names.pop() ) ) )
                ).appendTo( ul )

                var span = $( '<em />' ).addClass( 'badge' ).text( conv.get( 'unread messages' ) ).appendTo( str )
                if( conv.get( 'unread messages' ) > 0 )
                        span.show()
                else
                        span.hide()
                
                span = $( '<span />' ).text( 'x' ).click(function(){
                        $(this).parent().parent().data( 'conv' ).emit( 'remove conversation' )
                }).addClass( 'close' ).appendTo( str )
                if( conv.get( 'active' ) == 1 )
                        span.show()
                else
                        span.hide()
                delete conv, names, span, str, li
        }
        
        delete tabs, ul
})
gui.conversation.on( 'rebuild tabs', function(){
        var tabList = $( '#tab-list' ).unbind( 'touchstart touchend touchmove' ).bind( 'touchstart', function(){
                this.startMove = true;
        }).bind( 'touchmove', function(){
                if( this.startMove ) {
                        this.startPageY = event.pageY;
                        this.moving = true;
                        this.startMove = false;
                }
                this.endPageY = event.pageY;
        }).bind( 'touchend', function(event){
                if( this.moving && ( this.endPageY - this.startPageY ) >= 20 ) {
                        gui.conversation.emit( 'show slidedown tabs' )
                }
                this.moving = false;
        }).empty()
        $( '<li />' ).addClass( 'prev' ).bind( 'touchstart', function(){
                gui.conversation.emit( 'prev tab', [true] )
                $(this).addClass( 'active' )
        }).bind( 'touchend', function(){
                $(this).removeClass( 'active' )
        }).append(
                $( '<strong />' ).text( '<' )
        ).appendTo( tabList ) 
                
        for( i in Conversations.cache ) {
                var conv = Conversations.cache[i], names = [].concat( conv.get( 'usernames' ) ), str, li;
                names.splice( names.indexOf( Clients.getLocal().get( 'username' ) ), 1 )
                if( names.length == 0 ) continue;
                li = $( '<li />' ).addClass( 'tab' ).attr( 'data-conv', conv.get( 'id' ) ).data( 'conv', conv ).bind( 'click', function(event, touch){
                        gui.conversation.emit( 'activate conversation', [$(this).data( 'conv' ), touch] )
                }).addClass( ( conv.get( 'active' ) == 1 ? 'current' : 'deselected' ) ).append(
                        ( str = $( '<strong />' ).text( ( names.length == 1 ? names[0] : ( names.length >= 3 && Application.native ? names[0] + ', ' + names[1] + ' ' + lang.get( 'and' ) + lang.get( 'more' ) : names.slice(0,-1).join( ', ' ) + ' ' + lang.get( 'and' ) + ' ' + names.pop() ) ) ) )
                ).appendTo( tabList )

                var span = $( '<em />' ).addClass( 'badge' ).text( conv.get( 'unread messages' ) ).appendTo( str )
                if( conv.get( 'unread messages' ) > 0 )
                        span.show()
                else
                        span.hide()
                
                span = $( '<span />' ).text( 'x' ).click(function(){
                        $(this).parent().parent().data( 'conv' ).emit( 'remove conversation' )
                }).addClass( 'close' ).appendTo( str )
                if( conv.get( 'active' ) == 1 )
                        span.show()
                else
                        span.hide()
                delete conv, names, span, str, li
        }
        
        if( Application.params ) {
                if( !local.get( 'lastconversation' ) )
                        tabList.find( 'li.tab:eq(0)' ).click()
                else if( local.get( 'lastconversation' )
                      && tabList.find( 'li[data-conv="' + local.get( 'lastconversation' ) + '"]' ).length
                      && tabList.find( 'li.current' ).length == 0 )
                        tabList.find( 'li[data-conv="' + local.get( 'lastconversation' ) + '"]' ).click()
        }
        
        $( '<li />' ).addClass( 'next' ).bind( 'touchstart', function(){
                gui.conversation.emit( 'next tab', [true] )
                $(this).addClass( 'active' )
        }).bind( 'touchend', function(){
                $(this).removeClass( 'active' )
        }).append(
                $( '<strong />' ).text( '>' )
        ).appendTo( tabList )  
        
        $( '<li />' ).addClass( 'new' ).click(function(){
                Application.chat( 'new' )
        }).append(
                $( '<strong />' ).text( '+' )
        ).appendTo( tabList )
        delete tabList                 
})
gui.conversation.on( 'render counter', function( convInstance ) {
        var elem = $( '#tab-list li[data-conv="' + convInstance.get( 'id' ) + '"] em.badge' ).text( convInstance.get( 'unread messages' ) )
        if( convInstance.get( 'unread messages' ) > 0 )
                elem.show()
        else
                elem.hide()
        delete elem;
        gui.conversation.emit( 'notification' )
})
gui.conversation.on( 'notification', function(){
        if( Application.native || !Tinycon ) return false;
        // Get all conversations and their counter
        var counter = 0
        for( c in Conversations.cache )
                counter += Conversations.cache[c].get( 'unread messages' )
        if( counter > 0 )
                Tinycon.setBubble(counter);
        else
                Tinycon.setBubble(0);
        delete counter;
})
gui.conversation.on( 'scrolldown', function( maxOut ) {
        var chatContent = $( ( Application.native ? document : '#wrapper' ) ),
        currentState = chatContent.scrollTop()
        chatContent.scrollTop(99999999) // Max scroll 
        var maxState = chatContent.scrollTop()
        // console.log( 'maxState: ' + maxState )
        // console.log( 'previousMaxState: ' + gui.conversation.maxState )
        // console.log( 'currentState: ' + currentState )
        if( maxOut !== true && currentState != gui.conversation.maxState )
                chatContent.scrollTop( currentState )
        gui.conversation.maxState = maxState
        delete chatContent, currentState, maxState
})
gui.conversation.on( 'rebuild conversation head', function( convInstance ) {
        if( convInstance.get( 'active' ) != 1 ) return false;
        
        var chatHead  = $( '#chat-head' ), chatRight = chatHead.find( '.right' ).removeClass( 'group' ).empty(), names, usernames, users
        if( convInstance.get( 'usernames' ).length == 2 ) {
                names = [].concat( convInstance.get( 'fullnames' ) )
                names.splice( names.indexOf( Clients.getLocal().get( 'firstname' ) + ' ' + Clients.getLocal().get( 'lastname' ) ), 1 )
                
                usernames = [].concat( convInstance.get( 'usernames' ) )
                usernames.splice( usernames.indexOf( Clients.getLocal().get( 'username' ) ), 1 )
                
                users = [].concat( convInstance.get( 'users' ) )
                users.splice( users.indexOf( Clients.getLocal().get( 'id' ) ), 1 )
                
                $( '<div />' ).addClass( 'avatar' ).append(
                        $( '<img />' ).attr( 'src', 'http://ava.mss.gs/' + users.pop() + '.png' )
                ).appendTo( chatRight )
                $( '<h2 />' ).text( names.pop() ).appendTo( chatRight )
                $( '<strong />' ).text( '@' + usernames.pop().toLowerCase() ).appendTo( chatRight )
        }
        else {
                chatRight.addClass( 'group' )
                $( '<h2 />' ).text( lang.get( 'group' ) ).appendTo( chatRight )
                names = [].concat( convInstance.get( 'fullnames' ) )
                names.splice( names.indexOf( Clients.getLocal().get( 'firstname' ) + ' ' + Clients.getLocal().get( 'lastname' ) ), 1 )
                $( '<strong />' ).text( (names.length+1) + ' ' + lang.get( 'participants' ) ).appendTo( chatRight )
                $( '<em />' ).text( ( names.length == 1 ? names[0] : names.slice(0,-1).join( ', ' ) + ' ' + lang.get( 'and' ) + ' ' + names.pop() ) ).appendTo( chatRight )
        }
        delete chatHead, chatRight, names, usernames, users
})
gui.conversation.on( 'activate conversation', function( convInstance, touch ){
        var tabList = $( '#tab-list' );
        if( convInstance == -1 )
                return ( tabList.find( 'li.tab' ).length ? tabList.find( 'li.next' ).prev().click() : tabList.find( 'li.next' ).click() )
                
        if( convInstance.get( 'active' ) == 1 ) return;
        if( ( conv = Conversations.get( 'active', 1 ) ) !== false ) {
                conv.set( 'active', 0 )
                tabList.find( 'li span.close' ).hide()
                tabList.find( 'li.current' ).removeClass( 'current' )
        }
        
        Application.chat( convInstance.get( 'id' ) )
        convInstance.set( 'active', 1 )
        tabList.find( 'li[data-conv="' + convInstance.get( 'id' ) + '"]' ).addClass( 'current' )
        tabList.find( 'li.current span.close' ).show()
        gui.conversation.maxState = 0
        log.debug( 'Activate chat ' + convInstance.get( 'id' ) )
        
        convInstance.set( 'unread messages', 0 )
        gui.conversation.emit( 'render counter', [convInstance] )
        
        var chatHead = $( '#chat-head' ), chatLeft = chatHead.find( '.left' ).empty()
        $( '<div />' ).addClass( 'avatar' ).append(
                $( '<img />' ).attr( 'src', 'http://ava.mss.gs/' + Clients.getLocal().get( 'id' ) + '.png' )
        ).appendTo( chatLeft )
        
        $( '<h2 />' ).text( Clients.getLocal().get( 'firstname' ) + ' ' + Clients.getLocal().get( 'lastname' ) ).appendTo( chatLeft )
        $( '<strong />' ).text( '@' + Clients.getLocal().get( 'username' ).toLowerCase() ).appendTo( chatLeft )
        
        var chatRight = chatHead.find( '.right' ).removeClass( 'group' ).empty(), names, usernames, users
        if( convInstance.get( 'usernames' ).length == 2 ) {
                names = [].concat( convInstance.get( 'fullnames' ) )
                names.splice( names.indexOf( Clients.getLocal().get( 'firstname' ) + ' ' + Clients.getLocal().get( 'lastname' ) ), 1 )
                
                usernames = [].concat( convInstance.get( 'usernames' ) )
                usernames.splice( usernames.indexOf( Clients.getLocal().get( 'username' ) ), 1 )
                
                users = [].concat( convInstance.get( 'users' ) )
                users.splice( users.indexOf( Clients.getLocal().get( 'id' ) ), 1 )
                
                $( '<div />' ).addClass( 'avatar' ).append(
                        $( '<img />' ).attr( 'src', 'http://ava.mss.gs/' + users.pop() + '.png' )
                ).appendTo( chatRight )
                $( '<h2 />' ).text( names.pop() ).appendTo( chatRight )
                $( '<strong />' ).text( '@' + usernames.pop().toLowerCase() ).appendTo( chatRight )
        }
        else {
                chatRight.addClass( 'group' )
                $( '<h2 />' ).text( lang.get( 'group' ) ).appendTo( chatRight )
                names = [].concat( convInstance.get( 'fullnames' ) )
                names.splice( names.indexOf( Clients.getLocal().get( 'firstname' ) + ' ' + Clients.getLocal().get( 'lastname' ) ), 1 )
                $( '<strong />' ).text( (names.length+1) + ' ' + lang.get( 'participants' ) ).appendTo( chatRight )
                $( '<em />' ).text( ( names.length == 1 ? names[0] : names.slice(0,-1).join( ', ' ) + ' ' + lang.get( 'and' ) + ' ' + names.pop() ) ).appendTo( chatRight )
        }
        
        // Append last messages
        if( local.get( 'lastconversation' ) != convInstance.get( 'id' ) || $( '#chat-content' ).find( 'li' ).length <= 1 ) {
                $( '#chat-content' ).empty()
                if( convInstance.get( 'messages' ).length ) {
                        messages = [].concat(convInstance.get( 'messages' ))
                        for( m in messages )
                                gui.conversation.emit( 'render message', [convInstance, messages[m], true] )
                }
        }
        
        local.set( 'lastconversation', convInstance.get( 'id' ) )
        
        if( !touch )
                gui.conversation.emit( 'scrolldown', [true] )
        else
                log.debug( 'Cancel scrolldown' ) 
        delete tabList, chatHead, chatLeft, chatRight, names, usernames, users
})
gui.conversation.on( 'render message', function( convInstance, message, cache ) {
        if( convInstance.get( 'active' ) == 1 ) {
                var chatContent = $( '#chat-content' ), lastMessage = chatContent.find( 'li:last-child p' )
                if( chatContent.find( 'li' ).length >= ( Application.native === true ? 50 : 100 ) ) 
                        chatContent.find( 'li:eq(0)' ).remove()
                
                var messageDate = new Date(message.date*1000)
                if( message.username ) {
                        if( lastMessage 
                         && lastMessage.attr( 'data-userid' ) == message.userid 
                         && ( Math.floor(messageDate.getTime()/1000) - Math.floor(lastMessage.attr( 'data-date' )/1000) ) <= 62
                         && messageDate.getMinutes() == new Date(parseInt(lastMessage.attr( 'data-date' ))).getMinutes() ) {
                                lastMessage.append(
                                        span = $( '<span />' ).data( 'message', message.message )
                                )
                        }
                        else {
                                var img, p
                                $( '<li />' ).addClass( ( message.userid == Clients.getLocal().get( 'id' ) ? 'me' : 'you' ) ).append(
                                        ( p = $( '<p />' ).attr( 'data-userid', message.userid ).attr( 'data-date', messageDate.getTime() ).attr( 'data-conv-id', convInstance.get( 'id' ) ).append(
                                                ( span = $( '<span />' ).data( 'message', '[name]' + message.firstname + '[/name]: ' + message.message ) )
                                        ).append(
                                                $( '<em />' ).attr( 'title', messageDate.humanDate().toLowerCase() ).addClass( 'time' ).text( messageDate.humanTime() )
                                        ) )
                                ).appendTo( chatContent )
                                
                                if( !Application.native )
                                        img = $( '<img />' ).addClass( 'avatar' ).attr( 'src', 'http://ava.mss.gs/' + message.userid + '.png?=' + message[ 'last_update_ava' ] ).insertBefore( p );
                                if( message.gm && !Application.native )
                                        $( '<span />' ).addClass( 'gm' + ( message.founder ? ' red' : ( message[ 'gm color' ] ? ' ' + message[ 'gm color' ] : '' ) ) ).html( '&#9733;' ).insertAfter( img )
                                delete li, img, p;
                        }
                        
                        gui.conversation.message.render( span )
                }
                else {
                        msg  = message.message.split( ':' )
                        json = JSON.parse( message.message.substr( msg[0].length + 1 ) )
                        switch( msg[0] ) {
                                case 'join':
                                        msg = lang.get( 'internmessage.join', {
                                                'firstname': [ json.firstname ],
                                                'lastname': [ json.lastname ]
                                        })
                                break;
                                case 'rejoin':
                                        msg = lang.get( 'internmessage.rejoin', {
                                                'firstname': [ json.firstname ],
                                                'lastname': [ json.lastname ]
                                        })
                                break;
                                case 'leave':
                                        msg = lang.get( 'internmessage.leave', {
                                                'firstname': [ json.firstname ],
                                                'lastname': [ json.lastname ]
                                        })
                                break;
                                case 'invite':
                                        msg = lang.get( 'internmessage.invite', {
                                                'firstname': [ json.firstname, json.invite.firstname ],
                                                'lastname': [ json.lastname, json.invite.lastname ]
                                        })
                                break;
                                case 'banned':
                                        msg = lang.get( 'internmessage.banned', {
                                                'firstname': [ json.user.firstname ],
                                                'lastname': [ json.user.lastname ]
                                        })
                                break;
                                case 'unbanned':
                                        msg = lang.get( 'internmessage.unbanned', {
                                                'firstname': [ json.user.firstname ],
                                                'lastname': [ json.user.lastname ]
                                        })
                                break;
                                case 'warnflood':
                                        msg = lang.get( 'internmessage.warnflood', {
                                        })
                                break;
                                case 'bannedreminder':
                                        msg = lang.get( 'internmessage.bannedreminder', {
                                                'firstname': [ json.user.firstname ],
                                                'lastname': [ json.user.lastname ]
                                        })
                                break;
                                case 'invitereminder':
                                        msg = lang.get( 'internmessage.invitereminder', {
                                                'firstname': [ json.user.firstname ],
                                                'lastname': [ json.user.lastname ]
                                        })
                                break;
                                case 'message':
                                        msg = lang.get( 'internmessage.message', {
                                                'message': [ json.message ]
                                        })
                                break;
                                case 'loadingcloud':
                                        msg = lang.get( 'internmessage.loadingcloud', {
                                                'found': [ json.found ]
                                        })
                                break;
                                case 'me':
                                        msg = lang.get( 'internmessage.me', {
                                                'message': [ gui.conversation.message.render( json.message, true, message.id ) ],
                                                'firstname': [ json.firstname ],
                                                'lastname': [ json.lastname ]
                                        })
                                break;
                                default:
                                        return;
                                break;
                        }
                
                        $( '<li />' ).addClass( 'status' ).append(
                                $( '<em />' ).attr( 'title', messageDate.humanDate().toLowerCase() ).addClass( 'time' ).text( messageDate.humanTime() )
                        ).append(
                                $( '<p >' ).html( msg )
                        ).appendTo( chatContent )
                }

                if( !cache )
                        gui.conversation.emit( 'scrolldown' )
                delete chatContent, lastMessage, messageDate
        }
})
gui.conversation.on( 'invite', function( invite ) {
        if( Application.native ) {
                navigator.notification.confirm(
                        invite.firstname + ' ' + invite.lastname + ' ' + lang.get( 'invites.you' ),
                        utils.scope( invite, function( button ){
                                if( button == 0 ) { // Yes
                                        Clients.getLocal().connection.emit( 'accept invite', {
                                                id: this.id
                                        })
                                }
                                else { // No
                                        Clients.getLocal().connection.emit( 'reject invite', {
                                                id: this.id
                                        })
                                }
                        }),          
                        ( invite.users == 1 ? lang.get( 'invite' ) : lang.get( 'group' ) ),
                        lang.get( 'invites.yes' ) + ',' + lang.get( 'invites.no' )
                )
        }
        else {
                if( $( '#notify p[data-invite-id="' + invite.id + '"]' ).length ) return;
                $( '<p />' ).attr( 'data-invite-id', invite.id ).append(
                        $( '<strong />' ).text( ( invite.users == 1 ? lang.get( 'invite' ) : lang.get( 'group' ) ) )
                ).append(
                        $( '<span />' ).text( invite.firstname + ' ' + invite.lastname + ' ' + lang.get( 'invites.you' ) )
                ).append(
                        $( '<a />' ).attr( 'href', 'javascript:void(0)' ).click(function(){
                                Clients.getLocal().connection.emit( 'accept invite', {
                                        id: $(this).parent().attr( 'data-invite-id' )
                                })
                                $(this).parent().remove()
                        }).addClass( 'accept' ).append(
                                $( '<span />' ).text( lang.get( 'invites.yes' ) )
                        )
                ).append(
                        $( '<a />' ).attr( 'href', 'javascript:void(0)' ).click(function(){
                                Clients.getLocal().connection.emit( 'reject invite', {
                                        id: $(this).parent().attr( 'data-invite-id' )
                                })
                                $(this).parent().remove()
                        }).addClass( 'reject' ).append(
                                $( '<span />' ).text( lang.get( 'invites.no' ) )
                        )
                ).appendTo( '#notify' )
        }
})  
gui.conversation.on( 'remove invite', function( invite ) {
        if( Application.native === false ) return false;
        if( $( '#notify p[data-invite-id="' + invite.id + '"]' ).length == 1 ) 
                $( '#notify p[data-invite-id="' + invite.id + '"]' ).remove()
})
                                
gui.conversation.message = {
        emoticons: {
                definitions: {},
                callback: function() {
                        return $( '<div />' ).html( arguments[0].substr(0, 1) ).append(
                                $( '<img />' ).bind( 'load', function(){ gui.conversation.emit( 'scrolldown' ) } ).addClass( 'emoticon' ).attr( 'src', 'data:image/png;base64,' + this.emoticon )
                        ).html()
                }
        },
        render: function( me, retur, id ) {
                id   = ( retur ? id : me.data( 'id' ) )
                var text = $( '<pre />' ).text(( retur ? me : me.data( 'message' ) )).html(), i,
                text = ' ' + text.trim().replace( /\n/g, ' <br />\n' ) + ' ', patterns = { 
                        url: /(\s?)(http\:\/\/|https\:\/\/|ftp\:\/\/|ftps\:\/\/|)(www\.|)([a-zA-Z0-9.\-]{1,})([\.]{1}[a-zA-Z0-9\-]{2,5})([\.]{1}[a-zA-Z\&\']{2,5})?(:[0-9]{0,})?(\/[a-zA-Z0-9\&#!:\.\_\;?+{}\{\}=\[\,\'&%@!\-\/]{0,})?(?=\s)/gi,
                        skype: /skype\:\/\/([a-zA-Z0-9]{1,})/gi,
                        bold: /\[b\]([a-zA-Z0-9.#!:?+=$]{1,})\[\/b\]/gi,
                        names: /\[name\]([a-zA-Z0-9é]{1,})\[\/name\]/gi,
                        italic: /\[i\]([a-zA-Z0-9.#!:?+=$]{1,})\[\/i\]/gi,
                        // code: /\[code\](.*?)\[\/code\]/m,
                        name: /\@([a-zéA-ZÉ0-9]{1,})(;\s|:\s|\s?)/gi,
                        tag: /\#([a-zA-ZÉ0-9\-]{1,})(\s?)/gi
                };
      
                // Methods
                //codeblocks = []
                //text = text.replace( patterns.code, function( full, content ) {
                //        return '{codeblock:' + codeblocks.push(content) + '}';
                //})
                text = text.replace( patterns.url, function( url, opt, prefix, www ) {
                        url = url.trim()
                        if( !prefix )
                                url = 'http://' + url
                                
                        if( !retur && Application.native === false ) {
                                var youtube = null, args = []
                                if( arguments[4] == 'youtu' && arguments[5] == '.be' && arguments[8] && arguments[8].split( '&' )[0].match(/[a-zA-Z0-9\-\/.]/) != null ) {
                                        youtube = arguments[8].split( '&' )[0]
                                        args = arguments[8].split( '&' ).splice(1)
                                }
                                else if( arguments[4] == 'youtube' && arguments[5] == '.com' && arguments[8] && arguments[8].substr( 0, 6 ) != '/watch' && arguments[8] && arguments[8].split( '/' )[2].match(/[a-zA-Z0-9\-\/.]/) != null ) {
                                        youtube = arguments[8].split( '/' )[2]
                                }
                                else if( arguments[4] == 'youtube' && arguments[5] == '.com' && arguments[8] && arguments[8].substr( 0, 6 ) == '/watch' ) {
                                        youtube = arguments[8].split( 'v=' )[1].split( '&amp;' )[0]
                                        args = arguments[8].split( 'v=' )[1].split( '&amp;' ).splice(1)
                                }
                                if( youtube ) 
                                        return '<iframe class="embed youtube" width="560" height="315" src="https://www.youtube-nocookie.com/embed/' + youtube + '" frameborder="0" allowfullscreen></iframe>';
                                delete youtube, args
                        }
   
                        var imgurCode;
                        if( url.substr(7,9) == 'imgur.com' ) {
                                // Cross request
                                imgurCode = url.replace( /gallery\//g, empty ).substr(17)
                                $.get( 'http://api.imgur.com/2/image/' + imgurCode + '.json', function(data) {
                                        if( data ) {
                                                $( '#chat-content a.imgur.' + data.image.image.hash ).each(utils.scope(data,function(i,el){
                                                        $( '<img />' ).data( 'url', this.image.links.imgur_page ).attr( 'src', this.image.links.small_square ).bind( 'load', function(){
                                                                gui.conversation.emit( 'scrolldown' )
                                                        }).click(function(){
                                                                window.open($(this).data( 'url' ))
                                                        }).addClass( 'thumb' ).insertBefore( el )
                                                        $(el).remove()
                                                }))
                                        }
                                })
                        }
                        else {
                                var imageCheckUrl = url.split( '?' )[0],
                                imageCheckExtensionURL = imageCheckUrl.toLowerCase()
                                if( imageCheckExtensionURL.substr( -4 ) == '.png' || imageCheckExtensionURL.substr( -4 ) == '.jpg' || imageCheckExtensionURL.substr( -4 ) == '.gif' || imageCheckExtensionURL.substr( -5 ) == '.jpeg' 
                                 || imageCheckExtensionURL.substr( -7, 4 ) == '.png' || imageCheckExtensionURL.substr( -7, 4 ) == '.jpg' || imageCheckExtensionURL.substr( -7, 4 ) == '.gif' || imageCheckExtensionURL.substr( -8, 5 ) == '.jpeg' )
                                        return opt + '<img src="' + imageCheckUrl.replace( /"/, '%22' ) + '" onload="gui.conversation.emit( \'scrolldown\' )" class="thumb" onclick="window.open(\'' + imageCheckUrl.replace( /"/, '%22' ).replace( /'/, '\\\'' ) + '\')" />';
                                delete imageCheckUrl, imageCheckExtensionURL 
                        }
                        url = $( '<div />' ).html( url ).text()
                        delete imgurCode
                        return opt + $( '<div />' ).append( $( '<a />' ).attr( 'data-host',  ( www ? url.split( '://www.' )[1] : url.split( '://' )[1] ).split( '/' )[0] ).attr( 'onmouseover', 'gui.conversation.emit(\'snapito\',[this])' ).addClass( 'link' + ( imgurCode ? ' imgur ' + imgurCode : empty ) ).attr( 'target', '_blank' ).attr( 'href', url ).attr( 'title', ( www ? url.split( '://www.' )[1] : url.split( '://' )[1] ) ).text( ( www ? url.split( '://www.' )[1] : url.split( '://' )[1] ) ) ).html()
                })
                
                text = text.replace( patterns.name, utils.scope(me[0], function( full, name, opt ) {
                        return '<a class="mention" href="javascript:void(0)"><tag class="tag">@</tag>' + name + '</a>' + opt
                }))
                
                // Emoticons
                if( !Application.native ) {
                        for( i in gui.conversation.message.emoticons.definitions ) {
                                text = text.replace( new RegExp( '[^0-9a-zA-Z\+]' + i, 'gi' ), utils.scope({found: i, emoticon: gui.conversation.message.emoticons.definitions[i]}, gui.conversation.message.emoticons.callback ))
                                if( i != i.toUpperCase() )
                                        text = text.replace( new RegExp( '[^0-9a-zA-Z\+]' + i.toUpperCase(), 'gi' ), utils.scope({found: i, emoticon: gui.conversation.message.emoticons.definitions[i]}, gui.conversation.message.emoticons.callback )) 
                        }

                        text = text.replace( patterns.bold, function( text, v ) {
                                return '<strong class="bold">' + v + '</strong>'
                        })
                        text = text.replace( patterns.italic, function( text, v ) {
                                return '<i>' + v + '</i>'
                        })
                }
                text = text.replace( patterns.names, function( text, name ) {
                        return '<b>' + name + '</b>'
                })
                //text = text.replace( /\{codeblock:([0-9]{0,})\}/gi, function( text, num ){
                //        return $( '<div />' ).append( $( '<code />' ).addClass( 'code' ).text( codeblocks[(num-1)] ) ).html()
                //})
                
                if( retur ) return text
                me.html( text )
                delete text, me, i, id
        }
}
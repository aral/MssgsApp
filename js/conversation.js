var Conversation = function( data ) {
        this.setting = data || {},
        this.position = 0,
        
        // !Updater
        Conversation.prototype.update = function( data ) {
                this.setting = $.extend( this.setting, data )
                gui.conversation.emit( 'rebuild tabs' ) // Just in case
                gui.conversation.emit( 'rebuild conversation head', [this] ) // Just in case
        },  
        
        // !Messages
        Conversation.prototype.receivedMessage = function( message, queue ) {
                if( !( 'messages' in this.setting ) )
                        this.setting.messages = []
                this.setting.messages.push( message )
                if( this.setting.messages.length > ( Application.native ? 50 : 100 ) )
                        this.setting.messages.shift()
                gui.conversation.emit( 'render message', [this, message] )
                if( !queue ) this.emit( 'message', [message] )
        },
        
        // !Setters
        Conversation.prototype.set = function( key, value ) {
                log.debug( 'Setting updated ' + key + ' to ' + value )
                if( 'active' == key )
                        Clients.getLocal().connection.emit( ( value ? 'activate' : 'deactivate' ) + ' conversation', this.get( 'id' ) )
                return ( this.setting[key] = value )
        },
        
        // !Getters
        Conversation.prototype.get = function( key, callback ) {
                if( callback )
                        return callback.apply(this, [(this.setting[key] || false)])
                else
                        return this.setting[key] || false
        },
        
        Conversation.prototype.is = function( key ) {
                return ( this.setting[key] === true )
        },
        
        // !Events
        this.events = {},
        $.extend( Conversation.prototype, events )
        
        // !Binders
        this.on( 'remove', function() {
                Conversations.remove( this )
                this.events = {}, this.setting = {}
                gui.conversation.emit( 'rebuild tabs' )
                gui.conversation.emit( 'activate conversation', [-1] )
        })
        this.on( 'message', function( message ){        
                if( ( this.get( 'active' ) != 1 || Clients.getLocal().is( 'inactive' ) ) && message.userid != -1 ) {
                        this.set( 'unread messages', ( this.get( 'unread messages' ) ? this.get( 'unread messages' )+1 : 1 ) )
                        gui.conversation.emit( 'render counter', [this] )
                }
        })
        this.on( 'new message', function( message ) {
                if( message.trim().toLowerCase().substr( 0, 6 ) == '#local'
                 && Clients.getLocal().get( 'gm' ) == 1 ) {
                        action = message.trim().substr( 7 ).toLowerCase()
                        switch( action ) {
                                case 'activate cssrefresh':
                                        local.set( 'cssrefresh', 1 )
                                        window.location.reload()
                                        message = ''
                                break;
                                case 'deactivate cssrefresh':
                                        local.set( 'cssrefresh', 0 )
                                        window.location.reload()
                                        message = ''
                                break;
                                case 'activate fullscreen':
                                        local.set( 'fullscreen', 1 )
                                        Application.resize()
                                        message = ''
                                break;
                                case 'deactivate fullscreen':
                                        local.set( 'fullscreen', 0 )
                                        Application.resize()
                                        message = ''
                                break;
                                case 'activate font size':
                                case 'activate font-size':
                                case 'increase font-size':
                                case 'increase font size':
                                        $( '#chat-content' ).addClass( 'font' )
                                        setTimeout(function(){
                                                scroll.refresh()
                                                gui.conversation.emit( 'scrolldown' )
                                        }, 0)
                                        message = ''
                                break;
                        }
                }
                
                if( message.trim().length ) {
                        message = message.trim()
                        if( message.substr( 0, 1 ) == '*' && message.substr(-1) == '*' && message.substr(1, (message.length-2)).length > 1 )
                                message = '/me ' + message.substr(1, (message.length-2))
                                
                        var found = []
                        message.replace( /\@([a-zéA-ZÉ0-9]{1,})(;\s|:\s|\s?)/gi, function( full, name, opt ) {
                                found.push( name )
                        })
                        Clients.getLocal().connection.emit( 'message', {
                                text: message,
                                conversation: this.get( 'id' ),
                                attachments: [],
                                users: found
                        })
                        delete found;
                        
                        // Local push
                        this.receivedMessage({
                                message: message.substr(0,2000),
                                userid: Clients.getLocal().get( 'id' ),
                                conversation: this.get( 'id' ),
                                date: Math.round( new Date().getTime() / 1000 ),
                                username: Clients.getLocal().get( 'username' ),
                                firstname: Clients.getLocal().get( 'firstname' ),
                                lastname: Clients.getLocal().get( 'lastname' ),
                                gm: Clients.getLocal().get( 'gm' ),
                                'gm color': ( Clients.getLocal().get( 'color' ) ? Clients.getLocal().get( 'color' ) : 'yellow' ),
                                founder: Clients.getLocal().get( 'founder' ),
                                last_update_ava: Clients.getLocal().get( 'lst_update_ava' )
                        })
                }
        })
        this.on( 'create conversation', function( message ) {
                if( !message.trim().length ) return;
                var found = []
                message.replace( /\@([a-zéA-ZÉ0-9]{1,})(;\s|:\s|\s?)/gi, function( full, name, opt ) {
                        found.push( name )
                })
                if( found.length == 0 )
                        return log.error( 'Cannot start a new conversation without any participants' )

                // Find conversations with this amount of users
                if( found.length == 1 ) {
                        if( ( find = Conversations.find( 'usernames', new String( found[0] ) ) ).length ) {
                                for( f in find ) {
                                        if( find[f].get( 'users' ).length == 2 ) { 
                                                find[f].emit( 'new message', [message, arguments] )
                                                gui.conversation.emit( 'activate conversation', [find[f]] ) 
                                                return;
                                        }
                                } 
                        }
                }
                
                Clients.getLocal().connection.emit( 'create conversation', {
                        users: found,
                        message: message,
                        attachments: []
                })
                delete found;
        })
        this.on( 'remove conversation', function( ) {
                Clients.getLocal().connection.emit( 'leave conversation', {
                        conversation: this.get( 'id' )
                })
        })
        this.on( 'join', function( data ) {
                if( this.setting[ 'usernames' ].indexOf( data.username ) == -1 )
                        this.setting[ 'usernames' ].push( data.username )
                if( this.setting[ 'fullnames' ].indexOf( data.firstname + ' ' + data.lastname ) == -1 )
                        this.setting[ 'fullnames' ].push( data.firstname + ' ' + data.lastname )
                if( this.setting[ 'users' ].indexOf( data.userid ) == -1 )
                        this.setting[ 'users' ].push( data.userid )
                gui.conversation.emit( 'rebuild tabs' ) // Just in case
                gui.conversation.emit( 'rebuild conversation head', [this] )
                gui.conversation.emit( 'join message', [data, this] )
        })
        this.on( 'remove from', function( data ) {
                if( this.setting[ 'usernames' ].indexOf( data.username ) != -1 )
                        this.setting[ 'usernames' ].splice( this.setting[ 'usernames' ].indexOf( data.username ), 1 )
                if( this.setting[ 'fullnames' ].indexOf( data.firstname + ' ' + data.lastname ) != -1 )
                        this.setting[ 'fullnames' ].splice( this.setting[ 'fullnames' ].indexOf( data.firstname + ' ' + data.lastname ), 1 )
                if( this.setting[ 'users' ].indexOf( data.userid ) != -1 )
                        this.setting[ 'users' ].splice( this.setting[ 'users' ].indexOf( data.uerid ), 1 )
                gui.conversation.emit( 'rebuild tabs' ) // Just in case
                gui.conversation.emit( 'rebuild conversation head', [this] )
        })
        
        Conversations.add(this)
        return this
}

Conversations = {
        cache: [],
        events: {},
        add: function( convInstance ) {
                this.cache.push( convInstance )
                Conversations.emit( 'add', [convInstance] )
                gui.conversation.emit( 'rebuild tabs' )
        },
        remove: function( convInstance ) {
                Conversations.emit( 'remove', [convInstance] )
                this.cache.splice(this.cache.indexOf(convInstance), 1)
        },
        get: function( key, value ) {
                for( i in this.cache ) { 
                        if( this.cache[i].get( key ) == value )
                                return this.cache[i]
                }
                return false;
        },
        find: function( key, val ) {
                var found = []
                lowerCase = function( v ) {
                        return v.toLowerCase()
                }
                for( i in this.cache ) {
                        findIn = this.cache[i].get( key );
                        if( typeof findIn == 'object' ) { 
                                findIn = findIn.map(lowerCase)
                                if( findIn.indexOf( val ) > 0 )
                                        found.push( this.cache[i] )
                        }
                }
                return found;
        }
}

$.extend( Conversations, events )
var Client = function( data ) {
        this.setting = data || {},
        this.position = 0,
        
        // !Setters
        Client.prototype.set = function( key, value ) {
                log.debug( 'Setting updated ' + key + ' to ' + value )
                this.setting[key] = value
                return this
        },
        
        // !Getters
        Client.prototype.get = function( key, callback ) {
                if( callback )
                        return callback.apply(this, [(this.setting[key] || false)])
                else
                        return this.setting[key] || false
        },
        
        Client.prototype.is = function( key ) {
                return ( this.setting[key] === true )
        },
        
        // !Events
        this.events = {},
        $.extend( Client.prototype, events )
        
        // !Auth
        Client.prototype.authenticate = function( clientData, clientCallback ) {
                if( this.is( 'local' ) ) {
                        if( !this.connection ) {
                                this.clientData = clientData
                                this.connection = io.connect( 'api.mss.gs', { port: 8100, reconnect: true })
                                this.connection.client = this; // Private attach
                                this.connection.on( 'connect', function connect(){
                                        log.debug( 'Connection established' )
                                        if( this.client.clientData ) {
                                                this.emit( 'auth', this.client.clientData )
                                                this.client.clientData = false
                                        }
                                        else {  
                                                this.emit( 'auth', { username: local.get( 'email' ), password: local.get( 'hash' ), method: 'hash', reconnect: true } )
                                        }
                                })
                                this.connection.on( 'auth', function auth( data ){
                                        if( data.valid == true ) {
                                                this.client.set( 'authenticated', true )
                                                
                                                var hash = data.data.password;
                                                delete data.data.password; // so third party API/hooks cannot use it
                                                for( i in data.data )
                                                        this.client.set( i, data.data[i] ) 
                                                local.set( 'email', this.client.get( 'email' ) )
                                                if( this.client.get( 'device token' ) )
                                                        this.emit( 'device', this.client.get( 'device token' ) )
                                                this.client.emit( 'authentication success', [hash] )
                                                gui.connection.emit( 'connected' )
                                                delete hash;
                                        }
                                        else {
                                                this.client.set( 'authenticated', false )
                                                this.client.emit( 'authentication failed' )
                                        }
 
                                        clientCallback.apply(this.client, [data])
                                })
                                this.connection.on( 'conversation', function conversation( data ){
                                        var conv;
                                        if( ( conv = Conversations.get( 'id', data.id ) ) === false )
                                                new Conversation( data )
                                        else
                                                conv.update( data )
                                        delete conv;
                                })
                                this.connection.on( 'conversation intro', function conversation( data ){
                                })
                                this.connection.on( 'join conversation', function joinConversation( data ){
                                        var conv;
                                        if( ( conv = Conversations.get( 'id', data.id ) ) !== false )
                                                conv.emit( 'join', [data] )
                                        else 
                                                log.warn( 'Received join for conversation that is not known' )
                                        delete conv;
                                })
                                this.connection.on( 'remove from conversation', function leaveConversation( data ){
                                        var conv;
                                        if( ( conv = Conversations.get( 'id', data.id ) ) !== false )
                                                conv.emit( 'remove from', [data] )
                                        delete conv;
                                })
                                this.connection.on( 'remove conversation', function removeConversation( data ) {
                                        var conv;
                                        if( ( conv = Conversations.get( 'id', data.conversation ) ) !== false )
                                                conv.emit( 'remove' )
                                        delete conv;
                                })
                                this.connection.on( 'activate conversation', function activateConversation( data ) {
                                        var conv;
                                        if( ( conv = Conversations.get( 'id', data.conversation ) ) !== false )
                                                gui.conversation.emit( 'activate conversation', [conv] )
                                        delete conv;
                                })
                                this.connection.on( 'messages', function messages( data ){
                                        var m;
                                        for( m in data )
                                                this.$emit( 'message', data[m], true )
                                        delete m;
                                })
                                this.connection.on( 'message', function message( data, queue ){
                                        var conv;
                                        if( ( conv = Conversations.get( 'id', data.conversation ) ) !== false )
                                                conv.receivedMessage( data, queue )
                                        delete conv;
                                })
                                this.connection.on( 'invites', function invites( data ){
                                        var i;
                                        for( i in data ) 
                                                gui.conversation.emit( 'invite', [data[i]] )
                                        delete i;
                                })
                                this.connection.on( 'remove invite', function invites( data ){
                                        gui.conversation.emit( 'remove invite', [data] )
                                })
                                this.connection.on( 'disconnect', function disconnect(){
                                        log.debug( 'Connection lost' );
                                })
                        }
                        else {
                                this.connection.emit( 'auth', clientData )
                        }
                }
                else {
                        log.warn( 'Tried authenticating remote user', this.get( 'username' ) )
                }
        }
        
        Clients.add(this)
        return this
}

Clients = {
        cache: [],
        local: null, // Fast searching
        add: function( clientInstance ) {
                this.cache.push( clientInstance )
        },
        remove: function( clientInstance ) {
                this.cache.splice(this.cache.indexOf(clientInstance), 1)
        },
        getLocal: function() {
                if( this.local ) return this.local
                for( i in this.cache ) {
                        if( this.cache[i].is( 'local' ) )
                                return (this.local = this.cache[i])
                }
        },
        get: function( key, value ) {
                for( i in this.cache ) {
                        if( this.cache[i].get( key ) == value )
                                return this.cache[i]
                }
                return false;
        }
}

// Create single local client
new Client().set( 'local', true ).set( 'inactive', false )

// Bind local store
Clients.getLocal().on( 'authentication success', function( hash ) {
        local.set( 'hash', hash )
})

// Check user activity
$( window ).bind( 'blur', function(){
        Clients.getLocal().set( 'inactive', true )
}).bind( 'focus', function(){
        Clients.getLocal().set( 'inactive', false )
        if( Conversations.get( 'active', 1 ) !== false ) {
                Conversations.get( 'active', 1 ).set( 'unread messages', 0 )
                gui.conversation.emit( 'render counter', [Conversations.get( 'active', 1 )] )
                $( window ).trigger( 'beforeunload' )
        }
})
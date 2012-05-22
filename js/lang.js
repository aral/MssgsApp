var lang = {
        setting: {},
        
        // !Setters
        set: function( key, value ) {
                log.debug( 'Setting updated', key, 'to', value )
                return ( this.setting[key] = value )
        },
        
        // !Getters
        get: function( key, callback ) {
                if( typeof callback == 'function' )
                        return callback.apply(this, [(this.setting[key] || null)])
                else {
                        var key = ( key.split( '.' ).length == 0 ? this.setting[this.setting['current']][key] : lang.deep( this.setting[this.setting['current']], key ) ) || null
                        if( key && callback ) {
                                for( i in callback ) {
                                        for( ii = 0; ii <= callback[i].length; ii++ )
                                                key = key.replace( new RegExp( '\{' + i + '\}', 'i' ), callback[i][ii] )
                                }
                        }
                        return key
                }
        },
        deep: function( l, k ) {
                var k = k.split( '.' ), value = l[( k[0] )] 
                for( i = 1; i < k.length; i++ ) {
                        if( ( k[i] in value ) )
                                value = value[( k[i] )]
                }
                delete k;
                return value;
        }
}

lang.set( 'current', navigator.language.split( '-' )[0] )
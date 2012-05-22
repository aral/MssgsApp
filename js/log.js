var empty = '', log = {}
log.error = function(msg) {
        log.message.apply( log, ['error', utils.toArray(arguments).join( ' ' ), 0] )
}
log.warn = function(msg) {
        log.message.apply( log, ['warn', utils.toArray(arguments).join( ' ' ), 0] )
}
log.info = log.debug = function(msg) {
        log.message.apply( log, ['info', utils.toArray(arguments).join( ' ' ), 0] )
}
log.message = function( type, msg, deep ) {
        //if( Application.native === true ) return console.log( msg );
        var prefix;
        try { err; } catch( e ) {
               if( e.stack && navigator.userAgent.indexOf( 'Chrome' ) > -1  ) {
                       stack = e.stack.split( '\n' ); 
                       for( d = (deep-3); d < 0; d++ ) 
                               stack.shift();
                       line = stack.shift().split( ' ' ); 
                       f = line[5].split( '.' )[1]; 
                       l = line.pop(); 
                       t = l.split( '/js/' )[1];
                       t = ( t ? t.split( '.js' )[0] : l ); 
                       prefix = t + ':' + f; 
                }
        } 
        console[( type )]( '[' + Date() + ( prefix ? ' @' + prefix : '' ) + '] ' + msg )
        delete prefix;
}
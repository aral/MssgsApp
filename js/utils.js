var utils = {}
utils.toArray = function( arg ) {
        var i, args = []
        for( i in arg )
             args.push( arg[i] )
        return args
}
utils.scope = function( target, func ) {
        return function(){
                return func.apply( target, arguments )
        }
}
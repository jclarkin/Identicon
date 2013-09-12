var Identicon = (function (module) {
    module._private = module._private || {};
    
    /***********************/
    /** Private Variables **/
    /***********************/
    
    var patch0 = [0, 4, 24, 20];
    var patch1 = [0, 4, 20];
    var patch2 = [2, 24, 20];
    var patch3 = [0, 2,  20, 22];
    var patch4 = [2, 14, 22, 10];
    var patch5 = [0, 14, 24, 22];
    var patch6 = [2, 24, 22, 13, 11, 22, 20];
    var patch7 = [0, 14, 22];
    var patch8 = [6, 8, 18, 16];
    var patch9 = [4, 20, 10, 12, 2];
    var patch10 = [0, 2, 12, 10]; 
    var patch11 = [10, 14, 22];
    var patch12 = [20, 12, 24];
    var patch13 = [10, 2, 12];
    var patch14 = [0, 2, 10];
    var patchTypes = [patch0, patch1, patch2, patch3, 
                      patch4, patch5, patch6, patch7, 
                      patch8, patch9, patch10, patch11, 
                      patch12, patch13, patch14, patch0];
    var centerPatchTypes = [0, 4, 8, 15];

    /*** Expose private for testing ***/
    module._private.patchTypes = patchTypes;
    
    /***********************/ 
    /** Private Functions **/
    /***********************/
    
    /**
     * Hashing algorithm for any string. Uses the SDBM hash algorithm
     * 
     * @param string  The input to be hashed
     *
     * @return The deterministic hash value for the provided string
     */
    function hash(string) {
        var key = 0;
        var tempChar;
        for (var i = 0; i < string.length; i++) {
            tempChar = string.charCodeAt(i);
            key = tempChar + (key << 6) + (key << 16) - key;
        }
        return key;  
    }
    function renderPatch(ctx, x, y, size, patch, turn, invert, foreColor, backColor) {
        patch %= patchTypes.length;
        turn %= 4;
        if (patch == 15)
            invert = !invert;
    
        var vertices = patchTypes[patch];
        var offset = size / 2;
        var scale = size / 4;
    
        ctx.save();
    
        // paint background
        ctx.fillStyle = invert ? foreColor : backColor;
        ctx.fillRect(x, y, size, size);
    
        // build patch path
        ctx.translate(x + offset, y + offset);
        ctx.rotate(turn * Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo((vertices[0] % 5 * scale - offset), (Math.floor(vertices[0] / 5) * scale - offset));
        for (var i = 1; i < vertices.length; i++)
            ctx.lineTo((vertices[i] % 5 * scale - offset), (Math.floor(vertices[i] / 5) * scale - offset));
        ctx.closePath();
    
        // offset and rotate coordinate space by patch position (x, y) and
        // 'turn' before rendering patch shape
    
        // render rotated patch using fore color (back color if inverted)
        ctx.fillStyle = invert ? backColor : foreColor;
        ctx.fill();
    
        // restore rotation
        ctx.restore();
    }
    
        /*
            ab 		--> middle Type (4 options, thus 11 bit match)
            c 		--> middle invert (on/off)
            
            defg 	--> corner type (16 options, thus 1111 bit match)
            h 		--> corner invert (on/off)
            ij 		--> corner turn (4 options, thus 11 bit match)
            
            klmn 	--> side type (16 options, thus 1111 bit match)
            o		--> side invert (on/off)
            pq 		--> side turn (4 options, thus 11 bit match)
            
            rstuv	--> blue color (32 options, thus 11111 bit match)
            wxyzA	--> green color (32 options, thus 11111 bit match)
            BCDEF	--> red color (32 options, thus 11111 bit match)
        */    
    function parseBits(code, size) {
        var config = {};

        config.patchSize = size / 3;
        
        config.middleType = centerPatchTypes[code & 3];
        config.middleInvert = false;((code >> 2) & 1) != 0;
        
        config.cornerType = (code >> 3) & 15;
        config.cornerInvert = ((code >> 7) & 1) != 0;
        config.cornerTurn = (code >> 8) & 3;
        
        config.sideType = (code >> 10) & 15;
        config.sideInvert = ((code >> 14) & 1) != 0;
        config.sideTurn = (code >> 15) & 3;
        
        var blue = (code >> 16) & 31;
        var green = (code >> 21) & 31;
        var red = (code >> 27) & 31;
        config.foreColor = "rgb(" + (red << 3) + "," + (green << 3) + "," + (blue << 3) + ")";
        config.backColor = "rgb(255,255,255)";
        
        return config;
    }
    
    function renderIcon(node, code, size) {
        if (!node || !size) return;
    
        var config = parseBits(code, size);
    
        var ctx = node.getContext("2d");
    
        // middle patch
        renderPatch(ctx, config.patchSize, config.patchSize, config.patchSize, config.middleType, 0, config.middleInvert, config.foreColor, config.backColor);
        
        // side patchs, starting from top and moving clock-wise
        renderPatch(ctx, config.patchSize, 0, config.patchSize, config.sideType, config.sideTurn++, config.sideInvert, config.foreColor, config.backColor);
        renderPatch(ctx, config.patchSize * 2, config.patchSize, config.patchSize, config.sideType, config.sideTurn++, config.sideInvert, config.foreColor, config.backColor);
        renderPatch(ctx, config.patchSize, config.patchSize * 2, config.patchSize, config.sideType, config.sideTurn++, config.sideInvert, config.foreColor, config.backColor);
        renderPatch(ctx, 0, config.patchSize, config.patchSize, config.sideType, config.sideTurn++, config.sideInvert, config.foreColor, config.backColor);
        
        // corner patchs, starting from top left and moving clock-wise
        renderPatch(ctx, 0, 0, config.patchSize, config.cornerType, config.cornerTurn++, config.cornerInvert, config.foreColor, config.backColor);
        renderPatch(ctx, config.patchSize * 2, 0, config.patchSize, config.cornerType, config.cornerTurn++, config.cornerInvert, config.foreColor, config.backColor);
        renderPatch(ctx, config.patchSize * 2, config.patchSize * 2, config.patchSize, config.cornerType, config.cornerTurn++, config.cornerInvert, config.foreColor, config.backColor);
        renderPatch(ctx, 0, config.patchSize * 2, config.patchSize, config.cornerType, config.cornerTurn++, config.cornerInvert, config.foreColor, config.backColor);
    }
    
    
    
    /*** Expose private for testing ***/
    module._private.renderPatch = renderPatch;
    module._private.parseBits = parseBits;
    module._private.hash = hash;
    module._private.renderIcon = renderIcon;
    
    
    /**********************/ 
    /** Public Functions **/
    /**********************/ 
    
    /**
    * Used to create a deterministic identicon on the provided canvas element
    * 
    * @param node The Canvas element to be used for an identicon
    * @param code Optional value used to generate the identicon. 
    *             If not provided, the data-code attribute on the <canvas> will be used instead
    *
    **/
	function render(node, code) {
        if (!node) return;

        var size = node.width;
        if(!code) {
            var code = node.dataset.code;
        }

        // Hash code to 10 digit number
		renderIcon(node, hash(code), size);
    };
    
    /*** Expose for public consumption ***/
    module.render = render;

	return module;
}(Identicon || {}));

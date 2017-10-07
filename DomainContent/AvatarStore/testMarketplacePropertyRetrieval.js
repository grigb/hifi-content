(function() {
    var KEY_SUFFIX = '-transform';
    var _this;    
    function PrototypeMarketplaceAttachable(){
        _this = this;
    }
    PrototypeMarketplaceAttachable.prototype = {
        preload: function(entityID) {
            _this.entityID = entityID;
            print(_this.entityID);
        },
        clickDownOnEntity : function(){
            var marketplaceID = Entities.getEntityProperties(_this.entityID, 'marketplaceID').marketplaceID;var props = Settings.getValue(marketplaceID + KEY_SUFFIX);
            print (JSON.stringify(props)); 
            Entities.editEntity(_this.entityID, {
                parentID: MyAvatar.sessionUUID,
                parentJointIndex: MyAvatar.getJointIndex(props.jointName),
                dimensions: props.dimensions,
                localRotation: props.rotation,
                localPosition: props.position                
            });
        }
    };
    return new PrototypeMarketplaceAttachable();
});

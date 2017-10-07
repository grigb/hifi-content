//
//  storeMarketplaceTransforms.js
//
//  This script captures entities that are attached to a user and stores
//  information about them to be used to respawn after purchasing.
//
//  Copyright 2017 High Fidelity, Inc.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//

(function() {

    var KEY_SUFFIX = "-transform";
    var DESIRED_PROPERTIES = ['marketplaceID', 'certificateID', 'localPosition',
        'localRotation', 'dimensions', 'parentJointIndex', 'clientOnly', 'owningAvatarID'];

    var shared = Script.require('./attachmentZoneShared.js');

    var addedSettingsKeys = [];
    
    function MarketplaceTransformer() {

    }

    function setOrUpdateTransformsFromSettings(entityID) {
        var properties = Entities.getEntityProperties(entityID, DESIRED_PROPERTIES);
        if (properties.certificateID !== "") {
            // We already own this, we do not need to check
            return;
        }
        if (properties.marketplaceID !== "") {
            // This is something we can purchase 
            var key = properties.marketplaceID + KEY_SUFFIX;
            var transformData = {
                position: properties.localPosition,
                rotation: properties.localRotation,
                dimensions: properties.dimensions,
                jointName: MyAvatar.jointNames[properties.parentJointIndex]
            };
            if (Settings.getValue(key) === "") {
                // We have not already set a value for this marketplace ID
                Settings.setValue(key, {"transform" : transformData});                
            } else {
                // We have multiple values for this marketplace ID, we need to append
                var existingTransformData = Settings.getValue(key);
                var newDataValues = [existingTransformData, {"transform" : transformData}];
                Settings.setValue(key, newDataValues);
            }
            addedSettingsKeys.push(key);
        }
    }

    function getAndUpdateTransformsFromSettings(key, entityID) {
        var data = Settings.getValue(key);
        if (data === "") {
            print ("There was an error retrieving properties for this item");
            return;
        }
        JSON.stringify(data.transform);
        var updatedProperties = {
            parentID : MyAvatar.sessionUUID,
            parentJointIndex: MyAvatar.getJointIndex(data[0].transform.jointName),
            localPosition: data[0].transform.position,
            localRotation: data[0].transform.rotation,
            dimensions: data[0].transform.dimensions
        };
        Entities.editEntity(entityID, updatedProperties);

    }

    function cleanUp() {
        addedSettingsKeys.forEach(function(key){
            Settings.setValue(key, "");
        });
    }

    function checkAndPlaceWearables(entityID) { 
        var newItemProperties = Entities.getEntityProperties(entityID, DESIRED_PROPERTIES);
        if (newItemProperties.marketplaceID === "") {
            // Not a purchased item, return
            return;
        }
        // Add this back once items are certified
        /** if (newItemProperties.certificateID === "") {
            // This isn't certified. I dunno what you added, but we don't care about it
            return;
        }**/
        if (newItemProperties.clientOnly && newItemProperties.owningAvatarID === MyAvatar.sessionUUID) {
            // We have just created a wearable! 
            var marketplaceID = newItemProperties.marketplaceID;
            getAndUpdateTransformsFromSettings(marketplaceID + KEY_SUFFIX, entityID);

        }
    }

    MarketplaceTransformer.prototype = {
        preload : function(entityID) {
        },
        enterEntity : function() {
            Entities.addingEntity.connect(checkAndPlaceWearables);            
            var childEntities = shared.getAvatarChildEntities(MyAvatar);
            childEntities.forEach(function(entityID){
                setOrUpdateTransformsFromSettings(entityID);
            });
        },
        leaveEntity: function() {
            Entities.addingEntity.disconnect(checkAndPlaceWearables);
            cleanUp();
        }

    };

    return new MarketplaceTransformer();
});

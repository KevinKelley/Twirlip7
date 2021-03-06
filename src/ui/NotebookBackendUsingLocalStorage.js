define(["vendor/sha256"], function(sha256) {
    "use strict"
    /* global localStorage */
    
    const hashToItemPrefix = "_h2i_"
    const hashToLocationPrefix = "_h2l_"
    const locationToHashPrefix = "_l2h_"
    const itemCountKey = "_itemCounter"
    
    function NotebookBackendUsingLocalStorage() {

        function addItem(item) {
            const hash = "" + sha256.sha256(item)
            if (getItem(hash)) return { id: hash, existed: true }
            const numberOfItems = itemCount()
            const location = numberOfItems
            try {
                // TODO: Could simplify this now -- but want to still support legacy notebooks
                localStorage.setItem(hashToItemPrefix + hash, item)
                localStorage.setItem(hashToLocationPrefix + hash, "" + location)
                localStorage.setItem(locationToHashPrefix + location, hash)
                localStorage.setItem(itemCountKey, "" + (numberOfItems + 1))
            } catch (e) {
                // Probably storage is full
                console.log("addItem failed", location, hash, e)
                return { id: null, existed: false, error: e}
            }
            return { id: hash, existed: false }
        }
        
        function getItem(hash) {
            return localStorage.getItem(hashToItemPrefix + hash)
        }
        
        function getItemForLocation(location) {
            return getItem(localStorage.getItem(locationToHashPrefix + location))
        }
        
        function itemCount() {
            const itemCountString = localStorage.getItem(itemCountKey) || "0"
            return parseInt(itemCountString)
        }

        function clearItems() {
            // record keys to delete first to avoid modifying localStorage when we traverse it
            const keysToDelete = []
            const length = localStorage.length
            for (let i = 0; i < length; i++) {
                const key = localStorage.key(i)
                if (key.startsWith(hashToItemPrefix)
                    || key.startsWith(hashToLocationPrefix)
                    || key.startsWith(locationToHashPrefix)
                    || key === itemCountKey
                ) {
                    keysToDelete.push(key)
                }
            }
            for (let key of keysToDelete) {
                localStorage.removeItem(key)
            }
        }
        
        // TODO: No longer used
        function locationForKey(key) {
            const searchKey = hashToLocationPrefix + key
            const locationString = localStorage.getItem(searchKey)
            if (!locationString) return null
            return parseInt(locationString)
        }
        
        // TODO: No longer used
        function keyForLocation(location) {
            return localStorage.getItem(locationToHashPrefix + location)
        }
        
        function connect(notebook) {
            const count = itemCount()
            for (let i = 0; i < count; i++) {
                notebook.addItem(getItemForLocation(i), "isAlreadyStored")
            }
            
            window.addEventListener("storage", function(event) {  
                const key = event.key
                if (key.startsWith(hashToItemPrefix)) {
                    const newValue = event.newValue
                    notebook.addItem(newValue, "isAlreadyStored")
                }
            })
            
            notebook.onLoaded()
        }
    
        return {
            addItem,
            clearItems,
            connect,
            isSetup: function() { return true }
        }
    }

    return NotebookBackendUsingLocalStorage
})

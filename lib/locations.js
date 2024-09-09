function Locations() {
    this.locations = []
}

Locations.prototype = {
    set: function(locations) {
        this.locations = locations;
      }
}

module.exports = Locations
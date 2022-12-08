var SERVER = {
  v: {
    major: 4,
    minor: 6,
    speed: 1,
  },
  setVersion(version) {
    this.v = parseVersion(version);
  },
  setParsedVersion(v) {
    this.v = v;
  },
  hasBrewery: function () {
    return this.v.major == 3 && this.v.minor >= 6
        || this.v.major >= 4;
  },
  hasHdp: function () {
    return this.v.major == 3 && this.v.minor >= 5
        || this.v.major >= 4;
  },
  hasArtifacts: function () {
    return this.v.major == 3 && this.v.minor >= 5
        || this.v.major >= 4;
  },
  hasHeroes: function () {
    return this.v.major >= 3;
  },
  hasItems: function () {
    return this.v.major >= 4;
  },
  hasExtraRaces: function () {
    return this.v.major === 4
        &&(this.v.minor === 31
        || this.v.minor === 32
        || this.v.minor === 4
        || this.v.minor === 41
        || this.v.minor === 5
        || this.v.minor === 51
        || this.v.minor === 6);
  },
  breweryLevel: function () {
    return (this.v.major === 4
          && (this.v.minor === 5
          ||  this.v.minor === 41))
        || this.v.major === 5
      ? 20 : 10;
  },
  hasAllianceBoni: function () {
    return this.v.major == 4;
  },
  doubleUpgrades: function() {
    return this.v.major === 4
        && this.v.minor >= 2 && this.v.minor <= 3;
  },
  worldOnlySize: function() {
    if (this.v.major !== 4) return 400;
    if (this.v.minor === 31 || this.v.minor === 32) return 200;
  },
  isDoubleArena: function() {
    return this.v.major === 4
        && (this.v.minor === 32
        ||  this.v.minor === 5
        ||  this.v.minor === 4
        ||  this.v.minor === 41
        ||  this.v.minor === 51
        ||  this.v.minor === 6);
  },
  troopsSpeed: function () {
    return {1:1,2:2,3:2,5:2,10:4}[this.v.speed] || 1;  
  },
  arenaDistance: function() {
    return this.v.major >= 4 ? 20 : 30;
  }
};

const TimeTicks = {
  timeZoneOffset: (new Date()).getTimezoneOffset() * 1000 * 60,

  now() {
    return Date.now() - TimeTicks.timeZoneOffset;
  },

  ticksToTime(duration) {
    var milliseconds = parseInt((duration % 1000)),
        seconds = parseInt((duration / 1000) % 60),
        minutes = parseInt((duration / (1000 * 60)) % 60),
        hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? '0' + hours : hours;
    minutes = (minutes < 10) ? '0' + minutes : minutes;
    seconds = (seconds < 10) ? '0' + seconds : seconds;
    if(milliseconds === 0)
      milliseconds = '000';
    else
      if(milliseconds < 10)
        milliseconds = '0' + milliseconds;
      else
        if(milliseconds < 100)
          milliseconds = '0' + milliseconds;

    return hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
  },

  timeToTicks(time) {
    var parts = time.split(/[:.]/);
    var hours = (parseInt(parts.shift(), 10) || 0) * 1000 * 60 * 60;
    var minutes = (parseInt(parts.shift(), 10) || 0) * 1000 * 60;
    var seconds = (parseInt(parts.shift(), 10) || 0) * 1000;
    var milliseconds = (parseInt(parts.shift(), 10) || 0);
    return hours + minutes + seconds + milliseconds;
  },

  fixedTo(number, places) {
    if(Number.isFinite(number)){
      var k = Math.pow(10, places);
      var value = Math.round(number * k) / k;
      return value.toFixed(places);
    } else {
      return null;
    }
  }

};

module.exports = TimeTicks;

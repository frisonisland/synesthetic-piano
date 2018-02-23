audioCtx = new (window.AudioContext || window.webkitAudioContext)();

data_keys = {
  'a': ['4C', 0, false], // note, audio, keydown
  'w': ['4C#', 0, false],
  's': ['4D', 0, false],
  'e': ['4D#', 0, false],
  'd': ['4E', 0, false],
  'f': ['4F', 0, false],
  't': ['4F#', 0, false],
  'g': ['4G', 0, false],
  'y': ['4G#', 0, false],
  'h': ['4A', 0, false],
  'u': ['4A#', 0, false],
  'j': ['4B', 0, false],
  'k': ['5C',0, false],
};

function map_sounds(){
  document.onkeypress = function(e) {
    console.log(e);
    var sound = data_keys[e.key];
    var oscillator;
    if (sound){
      var soundId = sound[0];
      // create oscillator
      if (sound[2]){
        oscillator = sound[1];
        console.log("Continue to play");
        sound[2] = true;
      }
      else {
          // key not pressed, instantiate oscillator
          console.log("Start");
          sound[1] = audioCtx.createOscillator(); // recreate oscillator
          oscillator = sound[1];

          console.log("Id: " + soundId);
          var el = $("[id='" + soundId + "']");
          var frequency = el.attr('data-frequency');
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency; // value in hertz
          oscillator.connect(audioCtx.destination);
          oscillator.start();
          el.addClass("active");
          synestethic_color(frequency);
          sound[2] = true;
      }

    }
    else {
      console.log("key not mapped : code is", e.keyCode);
    }
  }

  document.onkeyup = function(e) {
    var sound = data_keys[e.key];
    if (sound){
      var soundId = sound[0];
      console.log("Stop " + e.key);
      sound[1].stop();
      var el = $("[id='" + soundId + "']");
      el.removeClass("active");
      sound[2] = false;
    }
  }
}

function synestethic_color(frequency){
  console.log("Frequency: " + frequency + " Hz");
  var wavelength = frequency_to_wavelength(frequency); // meters;
  console.log("Wavelength: " + wavelength + " m");
  /* NOTE: since we want same color at frequencies such that fn = n*f1,
      and visible spectrum is 400 - 700 nm wavelength circa
  */
  var normalized_wavelength = normalize_wavelength(wavelength*Math.pow(10,9)) // nanometers;
  console.log("Normalized Wavelength: " + normalized_wavelength + " nm");
  // since wavelength interval is narrow, when key changes the color changes a lot
  var color = wavelengthToColor(normalized_wavelength);
  console.log(color);
  $("body").animate({
    backgroundColor: color[0]
  }, 500);
}

function normalize_wavelength(wavelength){
  var frequency = wavelength_to_frequency(wavelength*Math.pow(10,-9)); // Hz
  var notes = get_notes();
  var steps = frequency_to_steps(frequency) + notes.indexOf("A"); // add note A offset, because octave starts from C
  // console.log("Steps: " + steps);
  // normalize wavelength to value of 4th octave
  var octave = Math.floor(steps / 12); // get octave by rounding to integer digit, offset 4A, octave 4
  // console.log("Min Wavelength: " + 390);
  // console.log("Octave: " + octave);
  // Lower octaves (1-3) will shorten wavelength. Higher (>4) will expand wavelength
  // Since to raise one octave for frequency we multiply by Math.pow(2,steps/12) = Math.pow(2,octave)
  // and we normalize to 4th octave, we have to divide by Math.pow(2,octave) (inverse process)
  // Because wavelength ~ 1/f, in the end we multiply by Math.pow(2,octave)
  wavelength = wavelength*Math.pow(2,octave);
  // console.log("New wavelength: " + wavelength)
  // set wavelength in range 390 - 700 nanometers (visible spectrum);
  var min_wavelength = 390; // 400 nm
  var max_wavelength = 700; // 700 nm

  if (wavelength < min_wavelength){
    var distance = (min_wavelength % wavelength);
    wavelength = min_wavelength + distance;
  }
  else {
      var distance = (wavelength % min_wavelength);
      wavelength = min_wavelength + distance;
  }
  // now if steps are negative we must multiply frequency for steps to reach the spectrum
  // if steps is positive we must divide;

  return wavelength;
}

function frequency_to_wavelength(frequency){
  // NOTE: frequency: 1 Hz = 1/1s, c = 3*10^8 m/s => lambda =
  var c = 3*10^8; // m/s
  var lambda = c*(1/frequency);
  return lambda; // meters
}


function wavelength_to_frequency(lambda){
  // NOTE: frequency: 1 Hz = 1/1s, c = 3*10^8 m/s => lambda =
  var c = 3*10^8; // m/s
  var frequency = c/lambda;
  return frequency; // Hz
}

function piano_init(piano_ul, octave_start, octave_stop){
  /* NOTE: piano_ul is the piano container
      note_start must be key start. E.g.: 1C
      note_stop must be frequency stop
  */
  var start_key = "C";
  var stop_key = "C";
  var keys = [];
  var scale = get_notes();
  var piano_key = scale.indexOf(start_key);
  var frequency;

  while (octave_start <= octave_stop) {
    // console.log(scale[piano_key]);
    if (octave_start === octave_stop && piano_key === stop_key){
      // NOTE: end piano when last note is reached;
      break;
    }

    if (scale[piano_key].includes("#")) {
      keys.push(black_key(octave_start, scale[piano_key]) + "</li>")
    }
    else {
      // NOTE: white key is standalone
      keys.push("<li class='key'>" + white_key(octave_start, scale[piano_key]))
    }
    piano_key += 1;
    if (piano_key === 12){
      // NOTE: when last key of piano is reached, add an octave
      piano_key = 0;
      octave_start += 1;
      // console.log(octave_start);
    }
    if (!(scale[piano_key].includes("#"))){
      keys.push("</li>");
    }
  }
  $(piano_ul).html(keys.join(""));
  map_sounds();
}

function black_key(octave, note){
  var frequency = calculate_frequency(octave,note);
  return ("<span class='black-key' id='" + octave + note + "' data-frequency='" + frequency +
  "' data-note='" + note + "'></span>");
}

function white_key(octave, note){
  var frequency = calculate_frequency(octave,note);
  return ("<span class='white-key'  id='" + octave + note + "' data-frequency='" + frequency +
  "' data-note='" + note + "'><span class='key_name'>" + octave + note + "</span></span>");
}

function get_notes(){
  return ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]
}

function calculate_frequency(octave,note){
  var A4 = A4_frequency();
  var octave_distance = octave - 4;
  var notes = get_notes();
  var note_distance = notes.indexOf(note) - notes.indexOf("A"); //difference of note from origin
  var note_distance = note_distance + octave_distance*12;
  // console.log(note_distance);
  var freq = (A4*Math.pow(2, note_distance/12))
  // console.log(freq);
  return freq;
}

function frequency_to_steps(frequency){
  // Calculates steps from A4, based od frequency_to_steps
  var note_distance = 12*Math.log2(frequency/A4_frequency());
  return Math.round(note_distance);
}

function play_note(frequency){

  oscillator.frequency.value = frequency; // value in hertz
  oscillator.start();

  setTimeout(
      function(){
          oscillator.stop();
      }, 500);

}

function A4_frequency(){
  return 440;
}

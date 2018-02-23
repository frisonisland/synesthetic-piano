ID_KEY = 'id';
OSCILLATOR_KEY = 'oscillator';
GAIN_KEY = 'gain';
ACTIVE_KEY = 'active';

audioCtx = new (window.AudioContext || window.webkitAudioContext)();

played_octave = 4;

data_keys = {};

function init_octave_sound(){
  keys = ['a','w','s','e','d','f','t','g','y','h','u','j'];
  notes = get_notes();
  for (var i=0; i < keys.length; i++){
    data_keys[keys[i]] = {[ID_KEY]: played_octave + notes[i],
      [OSCILLATOR_KEY]: null,
      [GAIN_KEY]: null,
      [ACTIVE_KEY]: false}; // build keys with id, sound, keydown
  }
  data_keys['k'] = {[ID_KEY]: (played_octave + 1) + "C",
    [OSCILLATOR_KEY]: null,
    [GAIN_KEY]: null,
    [ACTIVE_KEY]: false};
    // last note is a C
}

function custom_wave(){
  var real = new Float32Array(4);
  var imag = new Float32Array(4);

  var coefficients_2 = [[0.014203569399984786, 0],
  [0.025917478472564034,-0.0008506385400001219],
  [0.02305847100722676, 0.004732844848764174],
  [0.028648553173178493,0.014660109193815688]
]; // I draw a function that is similar to hammond sound, and got coefficients with a Fourier transformation online
  for (var i=0; i<coefficients_2.length;i++){
    real[i] = coefficients[i][0];
    imag[i] = coefficients[i][1];
  }
  console.log("Real: " + real);
  console.log("Imag: " + imag);
  var wave = audioCtx.createPeriodicWave(real, imag, {disableNormalization: true});
  return wave
}


function map_sounds(){
  document.onkeypress = function(e) {
    console.log(e);
    var sound = data_keys[e.key];
    var oscillator;
    if (sound){
      var soundId = sound[ID_KEY];
      // create oscillator
      if (sound[ACTIVE_KEY]){
        oscillator = sound[OSCILLATOR_KEY];
        sound[ACTIVE_KEY] = true;
      }
      else {
          // key not pressed, instantiate oscillator
          sound[OSCILLATOR_KEY] = audioCtx.createOscillator(); // recreate oscillator
          oscillator = sound[OSCILLATOR_KEY];
          var el = $("[id='" + soundId + "']");
          var frequency = el.attr('data-frequency');
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency; // value in hertz
          oscillator.setPeriodicWave(custom_wave());
          oscillator.connect(audioCtx.destination);
          var gain = audioCtx.createGain();
          gain.gain.value = 0.1;
          gain.connect(audioCtx.destination);
          oscillator.start();
          el.addClass("active");
          synestethic_color(frequency);
          sound[ACTIVE_KEY] = true;
      }
    }
    else {
      console.log("key not mapped : ", e.key);
    }
  }

  document.onkeyup = function(e) {
    var sound = data_keys[e.key];
    if (sound){
      var soundId = sound[ID_KEY];
      console.log("Stop " + e.key);
      sound[OSCILLATOR_KEY].stop();
      var el = $("[id='" + soundId + "']");
      el.removeClass("active");
      sound[ACTIVE_KEY] = false;
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
  init_octave_sound();
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

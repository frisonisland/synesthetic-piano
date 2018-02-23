synesthetic-piano

A piano that changes background color when played.

You can use a,w,s,e,d,f,t,g,h,u,j,k keys to play the piano.

The piano is supposed to sound like a "Hammond".

The waveform follows the equation: 1 + 2*sin(2*x)*cos(x)**2.
Then I've calculated the first four Fourier coefficients and created a custom PeriodicWave using the Javascript Web Audio Api.

The result is a wave with less distortion and more smooth edges, to reduce noise when playing a chord.

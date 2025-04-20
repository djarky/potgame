#include <DigiMIDI.h>
#include <math.h>


DigiMIDIDevice midi;


#define DEBUG 1  // Set to 1 to enable, 0 to disable
 
#if DEBUG
#define DebugPin 1  // Digispark model A onboard LED
#define DebugBlink 75
#define DebugPause 300
#define debugDelay(ms) delay(ms)




int digitalIn = 0;
int mode = 0;
int pot1Raw = 0;
int pot2Raw = 0;


int digitalPot1 = 0;
int digitalPot2 = 0;

int digitalPot1Ant = 0;
int digitalPot2Ant = 0;


//pin definicion

int pot1Pin        = A7;
int pot2Pin        = A6;
int buttonCheckPin = 8;   // Botón para "comprobar"
int buttonResetPin = 9;   // Botón para "reiniciar"
int led1           = 10; // LED jugador 1
int led2           = 11; // LED jugador 2




int valorObjetivo = 512;
int objetivoMidi = 100;
int distancia1, distancia2;


void _debugBlink(int n) {
  for ( int i = 0 ; i < n ; i++ ) {
    digitalWrite(DebugPin, HIGH);
    debugDelay(DebugBlink);
    digitalWrite(DebugPin, LOW);
    debugDelay(DebugBlink);
  }
  debugDelay(DebugPause);
}
 
void _debugSetup() {
  pinMode(DebugPin, OUTPUT);
}
 
#define debugBlink(n) _debugBlink(n)  // Do the blink when DEBUG is set
#define debugSetup() _debugSetup()
#else
#define debugBlink(n)  // Make the calls disappear when DEBUG is 0
#define debugSetup()
#endif


void setup() {
  randomSeed(analogRead(A5));

  pinMode(buttonCheckPin, INPUT_PULLUP);
  pinMode(buttonResetPin, INPUT_PULLUP);
  pinMode(led1 , OUTPUT); // LED para jugador 1
  pinMode(led2 , OUTPUT); // LED para jugador 2  
  digitalWrite(led1, HIGH);
  digitalWrite(led2, HIGH);

  debugSetup();
  debugBlink(3);

  midi.update();
  
  midi.delay(500);
  debugBlink(1);
  // Note number, velocity (opt=channel)
  midi.sendNoteOn(62,32);
  debugBlink(1);
  
}

void loop() {
  pot1Raw = analogRead(pot1Pin); // Read Pin 0 as analog input
  pot2Raw = analogRead(pot2Pin); // Read pin 1 as analog input

  digitalIn=digitalRead(0);

  for(int i=0;i<200;i++){
  pot1Raw = (pot1Raw/2)+ analogRead(pot1Pin); // Read Pin 0 as analog input
  pot2Raw = (pot2Raw/2)+ analogRead(pot2Pin); // Read pin 1 as analog input 
  }
  
  pot1Raw = (pot1Raw/2)-1;
  pot2Raw = (pot2Raw/2)-1;
  

  digitalPot1Ant=digitalPot1;  
  digitalPot2Ant=digitalPot2;

  digitalPot1=map(pot1Raw,0,1023, 0, 127);
  digitalPot2=map(pot2Raw,0,1023, 0, 127);

  digitalPot1=map(digitalPot1,0,68,0,127);
  digitalPot2=map(digitalPot2,0,68,0,127);

  if(digitalPot1!=digitalPot1Ant){
  midi.sendControlChange(1,digitalPot1,1);
  midi.delay(1);
  }

  if(digitalPot2!=digitalPot2Ant){
  midi.sendControlChange(2,digitalPot2,1);
  midi.delay(1);
  }
  
 
    // Leer botones
  bool checkPressed = !digitalRead(buttonCheckPin);
  bool resetPressed = !digitalRead(buttonResetPin);

  // Enviar botones como controlChange por si necesitas detectarlos en el navegador
  if (checkPressed) {
    midi.sendControlChange(5, 127, 1); // botón de comprobación
    //midi.sendNoteOn(62,32);
    midi.delay(1000);
  }
  if (resetPressed) {
    midi.sendControlChange(6, 127, 1); // botón de reinicio
    //midi.sendNoteOn(63,32);
    valorObjetivo=rand()%1024;
    objetivoMidi = map(valorObjetivo, 0, 1023, 0, 127);
    midi.sendControlChange(10,objetivoMidi, 1); // botón de reinicio
    midi.delay(1000);
  }  
  


    // Comparar si se presionó el botón de comprobar
  if (checkPressed) {

    distancia1 = abs(digitalPot1 - objetivoMidi);
    distancia2 = abs(digitalPot2 - objetivoMidi);

    if (distancia1 < distancia2) {
      digitalWrite(led1, HIGH);
      digitalWrite(led2, LOW);
    } else if (distancia2 < distancia1) {
      digitalWrite(led1, LOW);
      digitalWrite(led2, HIGH);
    } else {
      digitalWrite(led1, HIGH);
      digitalWrite(led2, HIGH); // Empate (opcional)
    }

  }



  //valorObjetivo = map(cc10Value , 0, 127, 0, 1023);

  midi.update();
  
  


  
}

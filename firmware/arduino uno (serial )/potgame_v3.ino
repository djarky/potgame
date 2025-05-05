#include <math.h>



int valorObjetivo;
int distancia1;
int distancia2;

int pushButton = 2;
int resButton = 5;


const int pot1Pin = A0; // Pin del primer potenciómetro (Jugador 1)
const int pot2Pin = A1; // Pin del segundo potenciómetro (Jugador 2)

void setup() {
  // Inicia la comunicación serial
  Serial.begin(9600);
  delay(2000);

  pinMode(pushButton, INPUT_PULLUP);
  pinMode(resButton, INPUT_PULLUP);
  pinMode(3, OUTPUT); // LED para jugador 1
  pinMode(4, OUTPUT); // LED para jugador 2


  if (Serial.available() > 0) {
      valorObjetivo = Serial.parseInt();

	}

}

void loop() {
  // Leer los valores de los potenciómetros
  int pot1Value = analogRead(pot1Pin);
  int pot2Value = analogRead(pot2Pin);
  int buttonValue  = !digitalRead(pushButton);
  int button2Value = !digitalRead(resButton);

  if (Serial.available() > 0) {
      valorObjetivo = Serial.parseInt();

	}
  

  // Enviar los valores al puerto serial en formato JSON
  String data = String(pot1Value) + "," + String(pot2Value) + "," + String(buttonValue) + "\n"; // Añadir salto de línea
  Serial.print(data);  // Usamos print en lugar de println para evitar dobles saltos de línea


  if(button2Value == HIGH){
      String data = String(pot1Value) + "," + String(pot2Value) + "," + String(2) + "\n"; 
      Serial.print(data);  
      delay(2000);
  }


    // Calcula la distancia absoluta entre los valores del sensor y el valor objetivo
  distancia1 = abs(pot1Value - valorObjetivo);
  distancia2 = abs(pot2Value - valorObjetivo);
  
   if (buttonValue == HIGH) {

  
      if (distancia1 < distancia2) {

        digitalWrite(3, HIGH); // Enciende el LED de Jugador 1
        digitalWrite(4, LOW);  // Apaga el LED de Jugador 2
      } else if (distancia2 < distancia1) {

         digitalWrite(3, LOW);  // Apaga el LED de Jugador 1
         digitalWrite(4, HIGH); // Enciende el LED de Jugador 2
    }

    

   }


  
  // Esperar un momento antes de enviar el siguiente dato
  delay(200);
}

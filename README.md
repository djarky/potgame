# potgame
juego de potenciometros con arduino y html , se da un valor objetivo al azar ,luego los dos jugadores mueven sus potenciometros hasta donde creen que esta el valor objetivo . se presiona el boton para verificar los valores de ambos potenciometros y el jugador que se acerca mas al valor objetivo es el que gana!!


https://djarky.github.io/potgame/

Juego para 2 personas:

El juego consta de dos potenciómetros (perillas o diales) conectados a un microcontrolador (DigiSpark o Arduino), los cuales envían valores analógicos a través de una conexión SERIAL O MIDI a una computadora.



La interfaz web simula dos diales y muestra sus valores en pantalla uno para cada jugador

OBJETIVO
El objetivo es igualar o acercarse lo mas posible al  VALOR OBJETIVO (entre 0 y 1024) generado por el sistema Los diales (como sintonizar ajustando los uña radio).

El jugador que más se acerque a el VALOR OBJETIVO es el que gana!!!!

El sistema también permite el uso de controladores MIDI como entrada alternativa. Los valores de Control Change (CC) son convertidos y utilizados como si fueran potenciómetros reales. 


construccion de tablero fisico


para realizar su propia construcción de un mando usted cuenta con dos opciones disponibles:
1 construir un mando con Arduino uno (usar comunicación serial):
- realizar las siguientes conexiones en Arduino :

![arduino uno](https://raw.githubusercontent.com/djarky/potgame/refs/heads/main/imagenes/arduino%20uno.png)


- cargar el archivo "potgame_v3.ino" desde Arduino ide.

- ejecutar el juego directamente desde https://djarky.github.io/potgame/ ya que itch.io no soporta conexión serial 

2 construir mando serial con digispark pro (usar comunicación MIDI):

![arduino uno](https://github.com/djarky/potgame/blob/main/imagenes/digispark.png)


- cargar el archivo "MIDIinterfase_potgame_v5.ino" desde arduino ide

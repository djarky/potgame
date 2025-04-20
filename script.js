document.addEventListener('DOMContentLoaded', function() {
        // Elementos DOM
        const pot1 = document.getElementById('pot1');
        const pot2 = document.getElementById('pot2');
        const knob1 = document.getElementById('knob1');
        const knob2 = document.getElementById('knob2');
        const valor1 = document.getElementById('valor1');
        const valor2 = document.getElementById('valor2');
        const valorObjetivo = document.getElementById('valorObjetivo');
        const checkButton = document.getElementById('checkButton');
        const resetButton = document.getElementById('resetButton');
        const result = document.getElementById('result');
        const gameRound = document.getElementById('gameRound');
        const scoreBoard = document.getElementById('scoreBoard');
        const connectButton = document.getElementById('connect');
        const disconnectButton = document.getElementById('disconnect');


        // Variables del juego
        let pot1Value = 0;
        let pot2Value = 0;
        let isDragging1 = false;
        let isDragging2 = false;
        let prevAngle1 = 0;
        let prevAngle2 = 0;
        let targetValue = 0;
        let targetValueMidi = 0;
        let roundNumber = 1;
        let player1Score = 0;
        let player2Score = 0;

        // Conexión con el puerto serial
        let port;
        let writer;

        // Datos seriales
        let serialData = {
            pot1Value: 0,
            pot2Value: 0,
            buttonValue: 0,
        };


        let context;
        let audioElement;
        let source;
        let panner;


        // Variables para MIDI
        let midiAccess;
        let midiInput;




let midiOutput = null;

async function initMIDI() {
    try {
        const access = await navigator.requestMIDIAccess();
        
        // Elegimos la primera salida disponible
        for (let output of access.outputs.values()) {
            midiOutput = output;
            console.log("✅ Salida MIDI conectada:", midiOutput.name);
            break;
        }

        for (let input of access.inputs.values()) {
            input.onmidimessage = handleMIDIMessage;
            console.log("🎹 Entrada MIDI conectada:", input.name);
        }
    } catch (err) {
        console.error("Error al inicializar MIDI:", err);
    }
}



function sendTargetValueToMIDI() {
    if (!midiOutput) {
        console.warn("No hay salida MIDI conectada.");
        return;
    }

    const ccNumber = 10; // El número que definimos en el Digispark
    const midiChannel = 0; // Canal 1
    const ccValue = Math.floor((targetValue / 1024) * 127); // Escalado

    const statusByte = 0xB0 | midiChannel;
    const message = [statusByte, ccNumber, ccValue];
    midiOutput.send(message);

    console.log(`🎯 Enviado valor objetivo a Digispark: CC${ccNumber} = ${ccValue}`);
}

function map(x, in_min, in_max, out_min, out_max) {
  return Math.round(((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min);
}


function handleMIDIMessage(event) {
    const [status, data1, data2] = event.data;

    const isCC = (status & 0xF0) === 0xB0; // 0xB0 = Control Change
    if (!isCC) return;

    const ccNumber = data1;
    const ccValue = data2;

    // 🎯 Valor objetivo desde Digispark (CC10)
    if (ccNumber === 10) {
        if (ccValue === 0) return;
        const scaled = map(ccValue,0,127,0,1024);
        if (scaled >= 10) {
            targetValueMidi = scaled;
            console.log(`🎯 Valor objetivo recibido por MIDI: ${scaled}`);
            //speak(`El nuevo valor objetivo es ${scaled}`);
            resetButton.click();
        } else {
            console.warn(`⚠️ Valor objetivo recibido demasiado bajo (ignorado): ${scaled}`);
        }
        return;
    }

    // 🎛 Potenciómetro 1 (CC2)
    if (ccNumber === 2) {
        serialData.pot1Value = Math.floor((ccValue / 127) * 1024);
        valor1.textContent = serialData.pot1Value;
    }

    // 🎛 Potenciómetro 2 (CC1)
    if (ccNumber === 1) {
        serialData.pot2Value = Math.floor((ccValue / 127) * 1024);
        valor2.textContent = serialData.pot2Value;
    }

    // ✅ Simular botón "Comprobar" con CC5
    if (ccNumber === 5 && ccValue > 0) {
        checkButton.click();
    }

/*
    // ✅ Simular botón "Reset" con CC6
    if (ccNumber === 6 && ccValue > 0) {
        resetButton.click();
    }

*/

    // 🔄 Actualizar los knobs visualmente
    syncKnobsWithSerialData();

    // 🎧 Ajuste de paneo
    if (panner) {
        const diff1 = Math.abs(serialData.pot1Value - targetValue);
        const diff2 = Math.abs(serialData.pot2Value - targetValue);
        let pan = diff1 - diff2;
        const threshold = 20;

        if (Math.abs(pan) < threshold) {
            panner.pan.value = 0;
        } else if (pan > 0) {
            panner.pan.value = 1;
        } else {
            panner.pan.value = -1;
        }
    }
}


// Wake Lock para mantener la pantalla activa
let wakeLock = null;

// Solicitar Wake Lock
async function requestWakeLock() {
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock activado');

        wakeLock.addEventListener('release', () => {
            console.log('Wake Lock liberado');
        });
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}

// Reintentar Wake Lock si el usuario regresa a la pestaña
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wakeLock === null) {
        requestWakeLock();
    }
});


function speak(text) {
    // Crear un objeto SpeechSynthesisUtterance con el texto a decir
    let utterance = new SpeechSynthesisUtterance(text);
    
    // Opcional: Puedes modificar propiedades, como el idioma, la velocidad y el tono
    utterance.lang = 'es-ES'; // Establecer el idioma en español (puedes elegir otros idiomas)
    utterance.rate = 1; // Velocidad de la voz (1 es normal)
    utterance.pitch = 1; // Tono de la voz (1 es normal)

    // Reproducir el texto
    window.speechSynthesis.speak(utterance);
}

            

// Actualizar la rotación y el valor del potenciómetro 1
function updatePot1(angle) {
    // Aplicar la rotación al knob 1
    knob1.style.transform = `translateX(-50%) rotate(${angle}deg)`;

    // Mapear ángulo (0-300) a valor (0-1024)
    serialData.pot1Value = Math.floor((angle / 300) * 1024);

    // Actualizar el valor en la interfaz
    valor1.textContent = serialData.pot1Value;

    // Enviar el valor del potenciómetro al dispositivo serial
    //sendDataToSerial();
}

// Actualizar la rotación y el valor del potenciómetro 2
function updatePot2(angle) {
    // Aplicar la rotación al knob 2
    knob2.style.transform = `translateX(-50%) rotate(${angle}deg)`;

    // Mapear ángulo (0-300) a valor (0-1024)
    serialData.pot2Value = Math.floor((angle / 300) * 1024);

    // Actualizar el valor en la interfaz
    valor2.textContent = serialData.pot2Value;

    // Enviar el valor del potenciómetro al dispositivo serial
    //sendDataToSerial();
}

// Función para sincronizar la rotación con los valores del serial
function syncKnobsWithSerialData() {
    // Calcular el ángulo en función del valor del potenciómetro y actualizar la rotación
    const angle1 = (serialData.pot1Value / 1024) * 300; // Convertir el valor del potenciómetro a ángulo
    const angle2 = (serialData.pot2Value / 1024) * 300; // Convertir el valor del potenciómetro a ángulo

    // Actualizar la rotación de los knobs
    knob1.style.transform = `translateX(-50%) rotate(${angle1}deg)`;
    knob2.style.transform = `translateX(-50%) rotate(${angle2}deg)`;
}



// Conectar al puerto serial
async function connectSerial() {
    try {
        port = await navigator.serial.requestPort();  // Solicitar puerto serial
        await port.open({ baudRate: 9600 });

        // Inicializar writer solo después de abrir el puerto
        writer = port.writable.getWriter();

        // Cambiar estado de los botones
        connectButton.disabled = true;
        disconnectButton.disabled = false;

        // Llamar a la función para leer datos
        readSerialData();

        // Enviar el valor objetivo al dispositivo después de la conexión exitosa
        sendTargetValueToSerial();

    } catch (error) {
        console.error("Error al conectar al puerto serial:", error);
    }
}

// Función para enviar el valor objetivo por serial
async function sendTargetValueToSerial() {
    // Verificar si el puerto está abierto y si writer está definido
    if (!writer) {
        console.error("El escritor no está definido o el puerto serial no está abierto.");
        return;  // Salir si writer no está disponible
    }

    // Convertir el valor objetivo a una cadena
    const targetValueString = targetValue.toString();
    const encoder = new TextEncoder();
    const data = encoder.encode(targetValueString);

    try {
        // Enviar los datos por serial
        await writer.write(data);
        console.log("Valor objetivo enviado al dispositivo:", targetValue);

    } catch (error) {
        console.error("Error al enviar valor objetivo por serial:", error);
    }
}

// Función para cerrar la conexión serial
async function closeSerial() {
    try {
        if (port && port.readable) {
            await port.close();
            connectButton.disabled = false;
            disconnectButton.disabled = true;
        }
    } catch (error) {
        console.error("Error al desconectar el puerto serial:", error);
    }
}



async function readSerialData() {
    const reader = port.readable.getReader();
    const decoder = new TextDecoder();
    let accumulatedData = "";  // Acumulador para los datos recibidos

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                reader.releaseLock();
                break;
            }

            const data = decoder.decode(value, { stream: true });
            accumulatedData += data;

            let lines = accumulatedData.split("\n");
            accumulatedData = lines.pop(); // Última línea puede estar incompleta

            for (let line of lines) {
                const trimmedLine = line.trim();

                if (trimmedLine.indexOf(',') === -1 || trimmedLine.split(',').length !== 3) {
                    console.warn("Datos recibidos con formato incorrecto:", trimmedLine);
                    continue;
                }

                const [pot1, pot2, button] = trimmedLine.split(',');
                const pot1Value = parseInt(pot1);
                const pot2Value = parseInt(pot2);
                const buttonValue = parseInt(button);

                if (isNaN(pot1Value) || isNaN(pot2Value) || isNaN(buttonValue)) {
                    console.warn("Datos inválidos recibidos:", trimmedLine);
                    continue;
                }

                // Actualizar datos
                serialData.pot1Value = pot1Value;
                serialData.pot2Value = pot2Value;
                serialData.buttonValue = buttonValue;

                // Actualizar UI
                valor1.textContent = pot1Value;
                valor2.textContent = pot2Value;

                // Sincronizar visualmente los knobs
                syncKnobsWithSerialData();


            if (panner) {

                 const diff1 = Math.abs(serialData.pot1Value - targetValue);
                 const diff2 = Math.abs(serialData.pot2Value - targetValue);
                 let pan = diff1 - diff2; // -1 (izq) a +1 (der)
                 const threshold = 20;
 
                 if (Math.abs(pan) < threshold) {
                        panner.pan.value = 0; // Centro
                 } else if (pan > 0) {
                        panner.pan.value = 1; // Derecha total (pot2 domina)
                 } else {
                        panner.pan.value = -1; // Izquierda total (pot1 domina)
                 }   

            }


             // Simular clics por botón físico
            if (buttonValue === 1) {
                    checkButton.click();
                } else if (buttonValue === 2) {
                    resetButton.click();
                }
            }
        }
    } catch (error) {
        console.error("Error al leer los datos seriales:", error);
    }
}


async function startMusic() {
    if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)();

        audioElement = new Audio("https://ice6.somafm.com/dubstep-128-mp3");
        audioElement.crossOrigin = "anonymous";
        audioElement.loop = true;

        source = context.createMediaElementSource(audioElement);
        panner = context.createStereoPanner();

        source.connect(panner).connect(context.destination);
    }

    try {
        if (context.state === 'suspended') {
            await context.resume();
        }
        await audioElement.play();
    } catch (err) {
        console.warn("No se pudo reproducir el audio automáticamente. Se necesita interacción del usuario.", err);
    }
}









    // Iniciar el juego
        initGame();
        initMIDI();

        function initGame() {
            requestWakeLock();
            new Audio('click.mp3').play();


           // startMusic();

            // Generar valor objetivo aleatorio entre 0 y 1024
            //targetValue = Math.floor(Math.random() * 1025);


            // Usar valor MIDI si fue recibido
            if (typeof targetValueMidi === 'number' && targetValueMidi!== 0 ) {
                // Evitar usar el valor 0 recibido del Digispark (o cualquier valor indeseado)

                targetValue = targetValueMidi;
                valorObjetivo.textContent = targetValue;
                console.log("✅ Usando valor objetivo desde MIDI:", targetValueMidi);
            } else {
                targetValue = Math.floor(Math.random() * 1025);
                valorObjetivo.textContent = targetValue;
                console.log("🎲 Generando valor objetivo aleatorio:", targetValue);
            }






            if (port && writer) {
                sendTargetValueToSerial();
            }
    
             // Only send to MIDI if connection is established
            if (midiOutput) {
                //sendTargetValueToMIDI();
            }

            try {
                 speak(`El valor objetivo es ${targetValue}`);
            } catch (err) {
                console.warn("Speech synthesis failed:", err);
             }


            // Resetear los potenciómetros
            resetPots();
            document.body.style.backgroundColor = '#1a1a1a';


            // Actualizar número de ronda
            gameRound.textContent = `Ronda: ${roundNumber}`;

            // Ocultar resultado anterior
            result.className = 'result';

            // Ocultar valores
            valor1.classList.remove('revealed');
            valor2.classList.remove('revealed');
        }

        function resetPots() {
            // Resetear valores y posición de los potenciómetros
            serialData.pot1Value = 0;
            serialData.pot2Value = 0;
            knob1.style.transform = 'translateX(-50%) rotate(0deg)';
            knob2.style.transform = 'translateX(-50%) rotate(0deg)';
            valor1.textContent = '0';
            valor2.textContent = '0';
        }

        // Función para calcular el ángulo del ratón relativo al centro del potenciómetro
        function calculateAngle(element, event) {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const x = event.clientX - centerX;
            const y = event.clientY - centerY;
            let angle = Math.atan2(y, x) * (180 / Math.PI);

            // Ajustar el ángulo para que 0 esté en la parte superior
            angle = angle + 90;
            if (angle < 0) angle += 360;

            // Limitar el ángulo entre 0 y 300 (para simular un potenciómetro real)
            if (angle > 300 && angle < 360) angle = 300;
            if (angle >= 0 && angle < 60) angle = 0;

            return angle;
        }



        // Eventos para el potenciómetro 1
        pot1.addEventListener('mousedown', function(e) {
            isDragging1 = true;
            prevAngle1 = calculateAngle(pot1, e);
            updatePot1(prevAngle1);
        });

        // Eventos para el potenciómetro 2
        pot2.addEventListener('mousedown', function(e) {
            isDragging2 = true;
            prevAngle2 = calculateAngle(pot2, e);
            updatePot2(prevAngle2);
        });

        // Eventos de movimiento y liberación del ratón
        document.addEventListener('mousemove', function(e) {
            if (isDragging1) {
                const currentAngle = calculateAngle(pot1, e);
                updatePot1(currentAngle);
                prevAngle1 = currentAngle;
            }

            if (isDragging2) {
                const currentAngle = calculateAngle(pot2, e);
                updatePot2(currentAngle);
                prevAngle2 = currentAngle;
            }
        });

        document.addEventListener('mouseup', function() {
            isDragging1 = false;
            isDragging2 = false;
        });




// Evento para el botón de comprobar
checkButton.addEventListener('click', async function() {
    let serialDataReceived = false;
    const abortController = new AbortController(); // Creamos un controlador de aborto
    const timeout = setTimeout(() => {
        abortController.abort(); // Abortamos la lectura de datos después de 2 segundos
    }, 2000);

    // Intentamos esperar por los datos seriales con un tiempo límite de 2 segundos
    try {
        // Usamos Promise.race para hacer que, si el botón es presionado nuevamente, abortamos la espera.
        await Promise.race([
            waitForSerialDataWithAbort(abortController.signal), // Esperar los datos seriales con abort
            new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado para los datos seriales')), 2000)) // Timeout de 2 segundos
        ]);
        serialDataReceived = true; // Si los datos se reciben, marcamos que se recibieron
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Lectura cancelada');
        } else {
            console.warn(error.message); // Si se agotó el tiempo, mostramos el mensaje de advertencia
        }
    } finally {
        // Cancelamos el timeout si ya se resolvió antes
        clearTimeout(timeout);
    }

    // Revelar los valores (aunque no estén completos)
    valor1.classList.add('revealed');
    valor2.classList.add('revealed');

    // Si no se recibieron datos, usamos los valores actuales, aunque sean 0 o incompletos
    const pot1Value = serialDataReceived ? serialData.pot1Value : 0;
    const pot2Value = serialDataReceived ? serialData.pot2Value : 0;

    // Calcular la diferencia entre los valores de los potenciómetros y el objetivo
    const diff1 = Math.abs(pot1Value - targetValue);
    const diff2 = Math.abs(pot2Value - targetValue);

    let resultText = '';

    // Al mostrar el resultado, cambia el fondo según el ganador
    if (diff1 < diff2) {
         // Jugador 1 gana
        player1Score++;
        resultText = `¡Jugador 1 gana con ${pot1Value}! (Jugador 2: ${pot2Value}) Más cercano al objetivo por ${diff2 - diff1} unidades`;

         // Cambiar el fondo de la página a color azul (Jugador 1)
         document.body.style.backgroundColor = '#3498db'; // Color de fondo del jugador 1
         // Reproducir sonido de victoria del jugador 1
         new Audio('game_win_L.mp3').play();
         speak(`jugador uno a ganado`);

    } else if (diff2 < diff1) {
        // Jugador 2 gana
        player2Score++;
        resultText = `¡Jugador 2 gana con ${pot2Value}! (Jugador 1: ${pot1Value}) Más cercano al objetivo por ${diff1 - diff2} unidades`;

        // Cambiar el fondo de la página a color rojo (Jugador 2)
        document.body.style.backgroundColor = '#e74c3c'; // Color de fondo del jugador 2
        // Reproducir sonido de victoria del jugador 2
        new Audio('game_win_R.mp3').play();
        speak(`jugador dos a ganado`);
    } else {
         // Empate
         resultText = `¡Empate! Ambos jugadores eligieron ${pot1Value}, a ${diff1} unidades del objetivo`;

         // Cambiar el fondo de la página a gris (empate)
         document.body.style.backgroundColor = '#95a5a6'; // Color para empate
    }


    // Mostrar resultado
    result.textContent = resultText;
    result.className = 'result visible';

    // Actualizar marcador
    scoreBoard.textContent = `Jugador 1: ${player1Score} | Jugador 2: ${player2Score}`;

    // Deshabilitar el botón de comprobación
    checkButton.disabled = true;
});




// Función para esperar los datos seriales con posibilidad de abortar
function waitForSerialDataWithAbort(signal) {
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            if (signal.aborted) {
                clearInterval(interval); // Cancelar la espera si se aborta
                reject(new Error('Lectura cancelada por segundo clic'));
            }

            // Verificamos si los datos seriales han sido actualizados
            if (serialData.pot1Value !== 0 && serialData.pot2Value !== 0) {
                clearInterval(interval);
                resolve();
            }
        }, 100); // Comprobar cada 100 ms
    });
}


            // Función para el reinicio del juego
resetButton.addEventListener('click', function() {
                roundNumber++;
                initGame();
                checkButton.disabled = false;
});

            // Conectar con el puerto serial cuando se cargue la página
connectButton.addEventListener('click', function() {
                connectSerial();
});
            
disconnectButton.addEventListener('click', function() {
                closeSerial();
});    



}); //end

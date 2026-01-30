let f = 100;      
let do_val = 150; 
let ho = 60;      
let dragging = false;
let sliderF;
let scaleFactor = 1; // Factor de zoom para móviles

function setup() {
  // Crea un canvas que llena toda la ventana
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('body'); // Asegura que esté en el body
  
  // Ajustar factor de escala según el ancho de pantalla
  // Si es menor a 600px (celular), reducimos todo al 60% (0.6)
  if (width < 600) {
    scaleFactor = 0.6;
    do_val = 120; // Acercamos el objeto inicial para que se vea
    ho = 40;
  }

  // Slider centrado
  sliderF = createSlider(-200, 200, 100);
  sliderF.parent('controls'); // Lo metemos en el div de controles
  sliderF.style('width', '80%'); // Que ocupe casi todo el ancho
  sliderF.touchStarted(() => { /* Evitar propagación */ });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (width < 600) scaleFactor = 0.6; else scaleFactor = 1;
}

function draw() {
  background(245);
  
  f = sliderF.value();
  if (abs(f) < 10) f = 10; // Evitar f=0

  // Actualizar textos HTML (Mejor rendimiento que dibujar texto en canvas)
  document.getElementById('focal-label').innerText = `Foco: ${f} mm (${f>0 ? 'Convexo' : 'Cóncavo'})`;
  document.getElementById('txt-f').innerText = `f: ${f} mm`;
  document.getElementById('txt-do').innerText = `do: ${do_val.toFixed(0)} mm`;
  
  // --- TRANSFORMACIONES GLOBALES ---
  push(); 
  translate(width / 2, height / 2); // Cero en el centro
  scale(scaleFactor); // Aplicar Zoom para móvil
  
  // --- FÍSICA ---
  let di = (f * do_val) / (do_val - f);
  let m = -di / do_val;
  let hi = m * ho;
  
  document.getElementById('txt-di').innerText = `di: ${di.toFixed(0)} mm`;

  // --- INTERACCIÓN TÁCTIL/MOUSE ---
  // Convertimos las coordenadas del mouse/touch al sistema escalado
  let inputX = (mouseX - width/2) / scaleFactor;
  let inputY = (mouseY - height/2) / scaleFactor;
  
  // Detectar si tocamos la punta del objeto
  let distToTip = dist(inputX, inputY, -do_val, -ho);
  
  if (dragging) {
    // Arrastrar
    do_val = constrain(-inputX, 20, (width/2)/scaleFactor - 20);
    ho = constrain(-inputY, -200, 200);
  }

  // --- DIBUJO ---
  drawGrid();
  drawOpticalAxis();
  drawLens(f);
  drawFoci(f);
  
  // Objeto (Azul)
  let isHovering = distToTip < 30; // Área de toque más grande para dedos
  drawObject(-do_val, -ho, isHovering || dragging);
  
  // Imagen (Roja)
  drawImage(di, -hi);
  
  // Rayos
  drawRays(do_val, ho, di, hi, f);
  
  pop(); // Restaurar transformación
}

// --- GESTIÓN DE EVENTOS TÁCTILES ---
function touchStarted() {
  // Calcular coords corregidas por escala
  let inputX = (mouseX - width/2) / scaleFactor;
  let inputY = (mouseY - height/2) / scaleFactor;
  
  // Si toca cerca del objeto, activar arrastre
  if (dist(inputX, inputY, -do_val, -ho) < 40) {
    dragging = true;
    return false; // Prevenir scroll
  }
}

function touchEnded() {
  dragging = false;
}

function mousePressed() {
  touchStarted(); // Reusar lógica
}

function mouseReleased() {
  dragging = false;
}

// --- FUNCIONES DE DIBUJO (IDÉNTICAS A LA VERSIÓN PRO, SIMPLIFICADAS) ---

function drawGrid() {
  stroke(220); strokeWeight(1);
  // Dibujamos grid grande para cubrir pantallas grandes
  for (let x = -1000; x < 1000; x += 50) line(x, -1000, x, 1000);
  for (let y = -1000; y < 1000; y += 50) line(-1000, y, 1000, y);
}

function drawOpticalAxis() {
  stroke(50); strokeWeight(2);
  line(-1000, 0, 1000, 0);
}

function drawLens(f) {
  stroke(0); strokeWeight(3);
  line(0, -200, 0, 200);
  // Terminaciones simples
  if (f > 0) { // Convergente
    line(0, -200, -10, -190); line(0, -200, 10, -190);
    line(0, 200, -10, 190); line(0, 200, 10, 190);
  } else { // Divergente
    line(0, -200, -10, -210); line(0, -200, 10, -210);
    line(0, 200, -10, 210); line(0, 200, 10, 210);
  }
}

function drawFoci(f) {
  fill(0); noStroke();
  circle(f, 0, 10); circle(-f, 0, 10);
  textSize(20); 
  text("F", f-10, 30); text("F'", -f-10, 30);
}

function drawObject(x, y, active) {
  let col = active ? color(52, 152, 219) : color(41, 128, 185);
  stroke(col); fill(col); strokeWeight(3);
  line(x, 0, x, y);
  // Punta flecha
  push(); translate(x, y);
  triangle(0, 0, -5, 10, 5, 10); // Flecha simple hacia arriba (si y es neg) o abajo
  pop();
  
  if (active) {
    noFill(); stroke(52, 152, 219, 100); strokeWeight(15);
    circle(x, y, 30); // Círculo grande para indicar toque
  }
}

function drawImage(x, y) {
  let isVirtual = (x < 0); // Lógica simplificada lente simple
  let col = isVirtual ? color(231, 76, 60, 150) : color(192, 57, 43);
  stroke(col); fill(col); strokeWeight(3);
  
  if(isVirtual) drawingContext.setLineDash([10, 10]);
  line(x, 0, x, y);
  push(); translate(x, y);
  // Dibujar triángulo simple
  if (y < 0) triangle(0,0, -5, 10, 5, 10); // Apunta arriba
  else triangle(0,0, -5, -10, 5, -10); // Apunta abajo
  pop();
  drawingContext.setLineDash([]);
}

function drawRays(d, h, di, hi, f) {
  strokeWeight(2);
  let objX = -d; let objY = -h;
  let imgX = di; let imgY = -hi;
  
  // Rayo 1 (Paralelo)
  stroke('green');
  line(objX, objY, 0, objY);
  if(f>0) {
      line(0, objY, imgX, imgY);
      if(di<0) dashedLine(0, objY, imgX, imgY);
  } else {
      let m = (objY - 0)/(0 - (-f)); // pendiente desde foco virtual
      line(0, objY, 500, objY + 500*m); // sale
      dashedLine(0, objY, -f, 0); // proyeccion atras
  }
  
  // Rayo 2 (Centro)
  stroke('purple');
  line(objX, objY, imgX, imgY); 
  // Extender visualmente
  let m2 = imgY/imgX;
  if(di>0) line(imgX, imgY, imgX+200, imgY + 200*m2);
  else dashedLine(objX, objY, imgX, imgY); // virtual part
}

function dashedLine(x1, y1, x2, y2) {
    drawingContext.setLineDash([10, 10]);
    line(x1, y1, x2, y2);
    drawingContext.setLineDash([]);
}

const increaseTextBtn = document.getElementById('increaseText');
const decreaseTextBtn = document.getElementById('decreaseText');
const contrastBtn = document.getElementById('toggleContrast');
let textoTamanho = 100;
const textoMinimo = 80;
const textoMaximo = 140;
const contrasteClasse = 'high-contrast';

function atualizarTamanhoTexto() {
  document.documentElement.style.fontSize = `${textoTamanho}%`;
}

function alternarContraste() {
  document.documentElement.classList.toggle(contrasteClasse);
}

increaseTextBtn?.addEventListener('click', () => {
  if (textoTamanho < textoMaximo) {
    textoTamanho += 10;
    atualizarTamanhoTexto();
  }
});

decreaseTextBtn?.addEventListener('click', () => {
  if (textoTamanho > textoMinimo) {
    textoTamanho -= 10;
    atualizarTamanhoTexto();
  }
});

contrastBtn?.addEventListener('click', alternarContraste);

window.addEventListener('load', atualizarTamanhoTexto);

const increaseTextBtn = document.getElementById('increaseText');
const decreaseTextBtn = document.getElementById('decreaseText');
const contrastBtn = document.getElementById('toggleContrast');
const menuToggleBtn = document.getElementById('menuToggle');
const navLinks = document.querySelectorAll('.nav_links a');
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

function alternarMenuMobile() {
  const aberto = document.body.classList.toggle('menu-open');

  if (menuToggleBtn) {
    menuToggleBtn.setAttribute('aria-expanded', String(aberto));
    menuToggleBtn.textContent = aberto ? '✕' : '☰';
  }
}

function fecharMenuMobile() {
  document.body.classList.remove('menu-open');

  if (menuToggleBtn) {
    menuToggleBtn.setAttribute('aria-expanded', 'false');
    menuToggleBtn.textContent = '☰';
  }
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
menuToggleBtn?.addEventListener('click', alternarMenuMobile);
navLinks.forEach(link => link.addEventListener('click', fecharMenuMobile));
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    fecharMenuMobile();
  }
});

window.addEventListener('load', () => {
  atualizarTamanhoTexto();
  if (window.innerWidth > 900) {
    fecharMenuMobile();
  }
});

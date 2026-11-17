// ---------- Utilidades ----------
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const $ = (id) => document.getElementById(id);

// ---------- 1. Simulador de mesada ----------
const rendaEl = $('renda');
const essencialEl = $('essencial');
const lazerEl = $('lazer');

function atualizarOrcamento(origem) {
  const renda = Math.max(0, parseFloat(rendaEl.value) || 0);
  let ess = parseInt(essencialEl.value, 10);
  let laz = parseInt(lazerEl.value, 10);

  // Se passar de 100%, reduz o outro controle
  if (ess + laz > 100) {
    if (origem === 'essencial') {
      laz = 100 - ess;
      lazerEl.value = laz;
    } else {
      ess = 100 - laz;
      essencialEl.value = ess;
    }
  }
  const gua = 100 - ess - laz;

  $('essencialPct').textContent = ess + '%';
  $('lazerPct').textContent = laz + '%';

  $('barEssencial').style.width = ess + '%';
  $('barLazer').style.width = laz + '%';
  $('barGuardar').style.width = gua + '%';

  $('vEssencial').textContent = moeda.format(renda * ess / 100);
  $('vLazer').textContent = moeda.format(renda * laz / 100);
  $('vGuardar').textContent = moeda.format(renda * gua / 100);
  $('pGuardar').textContent = '(' + gua + '%)';

  const anual = renda * gua / 100 * 12;
  const aviso = $('avisoOrcamento');
  aviso.classList.remove('perigo');
  if (gua === 0) {
    aviso.textContent = 'Você não está guardando nada. Tente separar pelo menos uma pequena parte, mesmo 5%.';
    aviso.classList.add('perigo');
  } else {
    aviso.textContent = 'Guardando ' + gua + '% todo mês, você junta ' + moeda.format(anual) + ' em um ano.';
  }
}

rendaEl.addEventListener('input', () => atualizarOrcamento());
essencialEl.addEventListener('input', () => atualizarOrcamento('essencial'));
lazerEl.addEventListener('input', () => atualizarOrcamento('lazer'));

// ---------- 2. Meta ----------
function textoTempo(meses) {
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const partes = [];
  if (anos > 0) partes.push(anos + (anos === 1 ? ' ano' : ' anos'));
  if (resto > 0) partes.push(resto + (resto === 1 ? ' mês' : ' meses'));
  return partes.join(' e ') || '0 meses';
}

function calcularMeta() {
  const meta = parseFloat($('metaValor').value) || 0;
  const guardo = parseFloat($('metaGuardo').value) || 0;
  const taxa = (parseFloat($('metaTaxa').value) || 0) / 100;
  const out = $('metaResultado');
  const extra = $('metaExtra');

  if (meta <= 0) { out.textContent = 'Informe o valor da meta.'; extra.textContent = ''; return; }
  if (guardo <= 0) {
    out.textContent = 'Informe quanto você consegue guardar por mês.';
    extra.textContent = '';
    return;
  }

  let saldo = 0;
  let meses = 0;
  const LIMITE = 1200; // 100 anos
  while (saldo < meta && meses < LIMITE) {
    saldo = saldo * (1 + taxa) + guardo;
    meses++;
  }

  if (meses >= LIMITE) {
    out.textContent = 'Com esse valor, a meta demora demais. Tente guardar um pouco mais por mês.';
    extra.textContent = '';
    return;
  }

  out.innerHTML = 'Você chega lá em ' + textoTempo(meses) +
    '<small>Total guardado por você: ' + moeda.format(guardo * meses) + '</small>';

  const semRendimento = Math.ceil(meta / guardo);
  const ganho = saldo - guardo * meses;
  if (taxa > 0 && ganho > 0) {
    extra.textContent = 'O rendimento ajudou com cerca de ' + moeda.format(ganho) +
      ' e você chega ' + Math.max(0, semRendimento - meses) + ' mês(es) mais cedo do que sem rendimento.';
  } else {
    extra.textContent = 'Dica: guardar um pouco a mais por mês encurta bastante o caminho.';
  }
}

['metaValor', 'metaGuardo', 'metaTaxa'].forEach((id) => $(id).addEventListener('input', calcularMeta));

// ---------- 3. Juros compostos ----------
let modoDevendo = false;

function calcularJuros() {
  const v = Math.max(0, parseFloat($('jValor').value) || 0);
  const i = Math.max(0, parseFloat($('jTaxa').value) || 0) / 100;
  let n = parseInt($('jMeses').value, 10) || 1;
  n = Math.min(Math.max(n, 1), 120);

  const montante = v * Math.pow(1 + i, n);
  const juros = montante - v;
  const jurosSimples = v * i * n;

  const out = $('jResultado');
  out.classList.toggle('perigo', modoDevendo);

  if (modoDevendo) {
    out.innerHTML = 'Dívida final: ' + moeda.format(montante) +
      '<small>Você paga ' + moeda.format(juros) + ' só de juros</small>';
  } else {
    out.innerHTML = 'Valor final: ' + moeda.format(montante) +
      '<small>Seu dinheiro rende ' + moeda.format(juros) + ' em juros</small>';
  }

  // Gráfico com 6 pontos
  const graf = $('jGrafico');
  graf.innerHTML = '';
  const pontos = 6;
  const valores = [];
  for (let p = 1; p <= pontos; p++) {
    const mes = Math.max(1, Math.round((n * p) / pontos));
    valores.push({ mes, valor: v * Math.pow(1 + i, mes) });
  }
  const maximo = Math.max(...valores.map((x) => x.valor), 1);
  valores.forEach((x) => {
    const col = document.createElement('div');
    col.className = 'coluna' + (modoDevendo ? ' perigo' : '');
    const barra = document.createElement('div');
    barra.className = 'b';
    barra.style.height = (x.valor / maximo * 100) + '%';
    barra.title = moeda.format(x.valor);
    const rot = document.createElement('span');
    rot.textContent = x.mes + 'm';
    col.appendChild(barra);
    col.appendChild(rot);
    graf.appendChild(col);
  });

  const texto = $('jTexto');
  texto.classList.toggle('perigo', modoDevendo);
  const diferenca = juros - jurosSimples;
  if (modoDevendo) {
    texto.textContent = 'Com juros compostos, a dívida cresce ' + moeda.format(diferenca) +
      ' a mais do que cresceria com juros simples. Quanto mais tempo, mais rápido ela aumenta. Pagar cedo é o melhor remédio.';
  } else {
    texto.textContent = 'Os juros compostos rendem ' + moeda.format(diferenca) +
      ' a mais do que os simples nesse período. Quanto mais cedo começar a guardar, mais o tempo trabalha por você.';
  }
}

$('modoGuardar').addEventListener('click', () => {
  modoDevendo = false;
  $('modoGuardar').classList.add('ativo');
  $('modoGuardar').classList.remove('perigo');
  $('modoDever').classList.remove('ativo', 'perigo');
  $('jTaxa').value = 1;
  calcularJuros();
});

$('modoDever').addEventListener('click', () => {
  modoDevendo = true;
  $('modoDever').classList.add('ativo', 'perigo');
  $('modoGuardar').classList.remove('ativo');
  $('jTaxa').value = 10;
  calcularJuros();
});

['jValor', 'jTaxa', 'jMeses'].forEach((id) => $(id).addEventListener('input', calcularJuros));

// ---------- 4. Quiz ----------
const perguntas = [
  {
    q: 'Qual é a melhor hora de separar o dinheiro que você quer guardar?',
    o: ['No fim do mês, com o que sobrar', 'Assim que receber', 'Só quando surgir uma meta', 'Nunca, é melhor gastar'],
    r: 1,
    e: 'Separar primeiro garante que você guarde. O que sobra no fim do mês costuma ser zero.'
  },
  {
    q: 'O que são juros compostos?',
    o: ['Juros só sobre o valor inicial', 'Juros sobre o valor inicial e sobre os juros já acumulados', 'Uma taxa fixa do banco', 'Um desconto na compra'],
    r: 1,
    e: 'É o "juros sobre juros". Por isso o tempo faz tanta diferença, tanto pra investir quanto pra dívidas.'
  },
  {
    q: 'Sobre parcelar uma compra, o mais seguro é:',
    o: ['Olhar só o valor da parcela', 'Ver o valor total e se cabe no orçamento', 'Parcelar tudo, pois é mais fácil', 'Esperar os juros baixarem'],
    r: 1,
    e: 'Parcela pequena engana. Some o total e veja se existem juros embutidos antes de decidir.'
  },
  {
    q: 'Pra que serve uma reserva de emergência?',
    o: ['Pagar viagens', 'Comprar coisas em promoção', 'Cobrir imprevistos sem entrar em dívida', 'Emprestar para amigos'],
    r: 2,
    e: 'Ela evita que um imprevisto, como um conserto ou uma consulta, vire dívida com juros.'
  },
  {
    q: 'Você quer muito algo que não planejou comprar. O que ajuda?',
    o: ['Comprar na hora antes que acabe', 'Esperar um tempo e ver se a vontade continua', 'Pedir emprestado', 'Usar o dinheiro da meta'],
    r: 1,
    e: 'Esperar um ou dois dias reduz compras por impulso. Se ainda fizer sentido, compre com tranquilidade.'
  }
];

let atual = 0;
let acertos = 0;

function mostrarPergunta() {
  const box = $('quizBox');
  const p = perguntas[atual];
  box.innerHTML = '';

  const prog = document.createElement('p');
  prog.className = 'progresso';
  prog.textContent = 'Pergunta ' + (atual + 1) + ' de ' + perguntas.length;

  const titulo = document.createElement('h3');
  titulo.textContent = p.q;

  const lista = document.createElement('div');
  lista.className = 'opcoes';

  p.o.forEach((texto, idx) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opcao';
    b.textContent = texto;
    b.addEventListener('click', () => responder(idx, lista));
    lista.appendChild(b);
  });

  box.append(prog, titulo, lista);
}

function responder(idx, lista) {
  const p = perguntas[atual];
  const botoes = lista.querySelectorAll('.opcao');
  botoes.forEach((b, i) => {
    b.disabled = true;
    if (i === p.r) b.classList.add('certa');
  });
  if (idx === p.r) {
    acertos++;
  } else {
    botoes[idx].classList.add('errada');
  }

  const explica = document.createElement('p');
  explica.className = 'explica';
  explica.textContent = (idx === p.r ? 'Certo! ' : 'Quase! ') + p.e;

  const prox = document.createElement('button');
  prox.type = 'button';
  prox.className = 'botao proxima';
  prox.textContent = atual === perguntas.length - 1 ? 'Ver resultado' : 'Próxima';
  prox.addEventListener('click', () => {
    atual++;
    if (atual < perguntas.length) mostrarPergunta(); else mostrarResultado();
  });

  $('quizBox').append(explica, prox);
}

function mostrarResultado() {
  const box = $('quizBox');
  let msg;
  if (acertos === perguntas.length) msg = 'Perfeito! Você já pensa como alguém que domina o próprio dinheiro.';
  else if (acertos >= 3) msg = 'Muito bem! Revise as dicas abaixo e você chega no máximo.';
  else msg = 'Bom começo! Mexa nos simuladores e tente de novo.';

  box.innerHTML = '';
  const titulo = document.createElement('h3');
  titulo.textContent = 'Seu resultado';
  const nota = document.createElement('p');
  nota.className = 'nota-final';
  nota.textContent = acertos + ' / ' + perguntas.length;
  const texto = document.createElement('p');
  texto.textContent = msg;
  const again = document.createElement('button');
  again.type = 'button';
  again.className = 'botao proxima';
  again.textContent = 'Jogar de novo';
  again.addEventListener('click', () => { atual = 0; acertos = 0; mostrarPergunta(); });
  box.append(titulo, nota, texto, again);
}

// ---------- 5. Controle de gastos ----------
const CHAVE_GASTOS = 'grana-certa-gastos';
const NOMES_MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
let gastos = [];

try {
  gastos = JSON.parse(localStorage.getItem(CHAVE_GASTOS)) || [];
} catch (e) {
  gastos = [];
}
if (!Array.isArray(gastos)) gastos = [];

function salvarGastos() {
  try { localStorage.setItem(CHAVE_GASTOS, JSON.stringify(gastos)); } catch (e) {}
}

function nomeMes(ym) {
  const p = ym.split('-');
  return NOMES_MESES[parseInt(p[1], 10) - 1] + ' de ' + p[0];
}

function dataCurta(iso) {
  const p = iso.split('-');
  return p[2] + '/' + p[1];
}

function dataHoje() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

$('gData').value = dataHoje();
$('gMes').value = dataHoje().slice(0, 7);

function mostrarGastos() {
  const mes = $('gMes').value;
  const doMes = gastos
    .filter((g) => g.data.slice(0, 7) === mes)
    .sort((a, b) => (a.data < b.data ? 1 : -1));
  const total = doMes.reduce((s, g) => s + g.valor, 0);

  // Total do mês
  $('gTotal').textContent = mes ? 'Total em ' + nomeMes(mes) + ': ' + moeda.format(total) : '';

  // Total por categoria
  const porCat = { Essencial: 0, Lazer: 0, Outros: 0 };
  doMes.forEach((g) => { porCat[g.cat] = (porCat[g.cat] || 0) + g.valor; });
  const cats = $('gCats');
  cats.innerHTML = '';
  Object.keys(porCat).forEach((c) => {
    const li = document.createElement('li');
    li.textContent = c + ': ' + moeda.format(porCat[c]);
    cats.appendChild(li);
  });

  // Comparação com o simulador de mesada
  const renda = Math.max(0, parseFloat(rendaEl.value) || 0);
  const limEss = renda * parseInt(essencialEl.value, 10) / 100;
  const limLaz = renda * parseInt(lazerEl.value, 10) / 100;
  const aviso = $('gAviso');
  aviso.classList.remove('perigo');
  if (doMes.length === 0 || renda <= 0) {
    aviso.textContent = '';
  } else if (total > renda) {
    aviso.textContent = 'Você gastou ' + moeda.format(total - renda) + ' a mais do que a mesada do simulador (' + moeda.format(renda) + ').';
    aviso.classList.add('perigo');
  } else if (porCat.Lazer > limLaz) {
    aviso.textContent = 'Seu lazer passou do planejado no simulador (' + moeda.format(limLaz) + '). Dá pra segurar um pouco?';
    aviso.classList.add('perigo');
  } else if (porCat.Essencial > limEss) {
    aviso.textContent = 'Seus gastos essenciais passaram do planejado (' + moeda.format(limEss) + ').';
    aviso.classList.add('perigo');
  } else {
    aviso.textContent = 'Você usou ' + Math.round(total / renda * 100) + '% da mesada do simulador neste mês.';
  }

  // Lista do mês
  const lista = $('gLista');
  lista.innerHTML = '';
  if (doMes.length === 0) {
    const li = document.createElement('li');
    li.className = 'vazio';
    li.textContent = 'Nenhum gasto neste mês. Anote o primeiro acima.';
    lista.appendChild(li);
  }
  doMes.forEach((g) => {
    const li = document.createElement('li');
    const info = document.createElement('span');
    info.className = 'info';
    const nome = document.createElement('strong');
    nome.textContent = g.desc;
    const det = document.createElement('small');
    det.textContent = dataCurta(g.data) + ' · ' + g.cat + ' · ' + moeda.format(g.valor);
    info.append(nome, det);
    const bt = document.createElement('button');
    bt.type = 'button';
    bt.className = 'apagar';
    bt.textContent = 'Apagar';
    bt.addEventListener('click', () => {
      gastos = gastos.filter((x) => x.id !== g.id);
      salvarGastos();
      mostrarGastos();
    });
    li.append(info, bt);
    lista.appendChild(li);
  });

  // Resumo de todos os meses
  const meses = {};
  gastos.forEach((g) => {
    const k = g.data.slice(0, 7);
    meses[k] = (meses[k] || 0) + g.valor;
  });
  const resumo = $('gResumo');
  resumo.innerHTML = '';
  const chaves = Object.keys(meses).sort().reverse();
  if (chaves.length === 0) {
    const li = document.createElement('li');
    li.className = 'vazio';
    li.textContent = 'Ainda não há meses com gastos.';
    resumo.appendChild(li);
  }
  chaves.forEach((k) => {
    const li = document.createElement('li');
    const info = document.createElement('span');
    info.className = 'info';
    const nome = document.createElement('strong');
    nome.textContent = nomeMes(k);
    const det = document.createElement('small');
    det.textContent = moeda.format(meses[k]);
    info.append(nome, det);
    const bt = document.createElement('button');
    bt.type = 'button';
    bt.className = 'apagar ver';
    bt.textContent = 'Ver';
    bt.addEventListener('click', () => { $('gMes').value = k; mostrarGastos(); });
    li.append(info, bt);
    resumo.appendChild(li);
  });
}

$('gAdd').addEventListener('click', () => {
  const desc = $('gDesc').value.trim();
  const valor = parseFloat($('gValor').value);
  const data = $('gData').value;
  const erro = $('gErro');

  if (!desc) { erro.textContent = 'Escreva o que você comprou.'; return; }
  if (!(valor > 0)) { erro.textContent = 'Coloque um valor maior que zero.'; return; }
  if (!data) { erro.textContent = 'Escolha a data do gasto.'; return; }
  erro.textContent = '';

  gastos.push({ id: Date.now(), desc: desc, valor: valor, cat: $('gCat').value, data: data });
  salvarGastos();
  $('gMes').value = data.slice(0, 7);
  $('gDesc').value = '';
  $('gValor').value = '';
  mostrarGastos();
});

$('gMes').addEventListener('change', mostrarGastos);
rendaEl.addEventListener('input', mostrarGastos);
essencialEl.addEventListener('input', mostrarGastos);
lazerEl.addEventListener('input', mostrarGastos);

// ---------- Início ----------
atualizarOrcamento();
calcularMeta();
calcularJuros();
mostrarPergunta();
mostrarGastos();

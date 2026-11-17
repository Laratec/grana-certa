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

(function () {
  var CHAVE = "grana-certa-gastos";
  var gastos = [];

  // Carregar o que já foi salvo
  try {
    gastos = JSON.parse(localStorage.getItem(CHAVE)) || [];
  } catch (e) {
    gastos = [];
  }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(gastos)); } catch (e) {}
  }

  function reais(n) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function nomeMes(ym) {
    var p = ym.split("-");
    var nomes = ["janeiro","fevereiro","março","abril","maio","junho",
                 "julho","agosto","setembro","outubro","novembro","dezembro"];
    return nomes[Number(p[1]) - 1] + " de " + p[0];
  }

  function dataBR(iso) {
    var p = iso.split("-");
    return p[2] + "/" + p[1];
  }

  var $ = function (id) { return document.getElementById(id); };

  // Data e mês começam em hoje
  var hoje = new Date();
  var mm = String(hoje.getMonth() + 1).padStart(2, "0");
  var dd = String(hoje.getDate()).padStart(2, "0");
  $("g-data").value = hoje.getFullYear() + "-" + mm + "-" + dd;
  $("g-mes").value = hoje.getFullYear() + "-" + mm;

  function desenhar() {
    var mes = $("g-mes").value;
    var doMes = gastos.filter(function (g) { return g.data.slice(0, 7) === mes; })
                      .sort(function (a, b) { return a.data < b.data ? 1 : -1; });

    // Lista do mês escolhido
    var lista = $("g-lista");
    lista.innerHTML = "";
    if (doMes.length === 0) {
      lista.innerHTML = "<li>Nenhum gasto neste mês. Anote o primeiro acima.</li>";
    }
    doMes.forEach(function (g) {
      var li = document.createElement("li");
      var texto = document.createElement("span");
      texto.textContent = dataBR(g.data) + " · " + g.desc + " (" + g.cat + ") · " + reais(g.valor);
      var bt = document.createElement("button");
      bt.type = "button";
      bt.textContent = "Apagar";
      bt.onclick = function () {
        gastos = gastos.filter(function (x) { return x.id !== g.id; });
        salvar();
        desenhar();
      };
      li.appendChild(texto);
      li.appendChild(bt);
      lista.appendChild(li);
    });

    // Total e total por categoria
    var total = doMes.reduce(function (s, g) { return s + g.valor; }, 0);
    $("g-total").textContent = mes ? "Total em " + nomeMes(mes) + ": " + reais(total) : "";
    var porCat = {};
    doMes.forEach(function (g) { porCat[g.cat] = (porCat[g.cat] || 0) + g.valor; });
    $("g-cats").textContent = Object.keys(porCat).map(function (c) {
      return c + ": " + reais(porCat[c]);
    }).join("  |  ");

    // Resumo de todos os meses
    var meses = {};
    gastos.forEach(function (g) {
      var k = g.data.slice(0, 7);
      meses[k] = (meses[k] || 0) + g.valor;
    });
    var resumo = $("g-resumo");
    resumo.innerHTML = "";
    var chaves = Object.keys(meses).sort().reverse();
    if (chaves.length === 0) {
      resumo.innerHTML = "<li>Ainda não há meses com gastos.</li>";
    }
    chaves.forEach(function (k) {
      var li = document.createElement("li");
      li.innerHTML = "<span></span><strong></strong>";
      li.children[0].textContent = nomeMes(k);
      li.children[1].textContent = reais(meses[k]);
      resumo.appendChild(li);
    });
  }

  $("g-add").onclick = function () {
    var desc = $("g-desc").value.trim();
    var valor = parseFloat($("g-valor").value);
    var data = $("g-data").value;
    var erro = $("g-erro");

    if (!desc) { erro.textContent = "Escreva o que você comprou."; return; }
    if (!(valor > 0)) { erro.textContent = "Coloque um valor maior que zero."; return; }
    if (!data) { erro.textContent = "Escolha a data do gasto."; return; }
    erro.textContent = "";

    gastos.push({
      id: Date.now(),
      desc: desc,
      valor: valor,
      cat: $("g-cat").value,
      data: data
    });
    salvar();
    $("g-mes").value = data.slice(0, 7); 
    $("g-desc").value = "";
    $("g-valor").value = "";
    desenhar();
  };

  $("g-mes").onchange = desenhar;
  desenhar();
})();

// ---------- Início ----------
atualizarOrcamento();
calcularMeta();
calcularJuros();
mostrarPergunta();

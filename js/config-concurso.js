/* ===================================================================
   CONFIGURAÇÃO DO CONCURSO — edite SÓ ESTE ARQUIVO quando sair a retificação.
   Datas no formato AAAA-MM-DD. Para uma data ainda não divulgada, deixe
   data: null e status: 'a confirmar (aguardando retificação do edital)'.
   Depois de editar, recarregue o site: tudo (contagem, calendário, plano)
   passa a usar as datas novas.
   =================================================================== */
window.SOS = window.SOS || {};
SOS.CONFIG = {
  concurso: {
    id: 'TEC',
    cargo: 'Técnico Legislativo',
    codigo: 'CNM 01',
    orgao: 'Câmara Municipal de Cuiabá-MT',
    banca: 'Instituto Selecon',
    edital: 'Edital nº 001/2026-CMC, de 26/10/2026',
    vagas: 11,
    vagasDetalhe: '11 (8 AC · 1 PcD · 2 negros e indígenas) + cadastro de reserva',
    remuneracao: 'R$ 5.518,91 + auxílio-alimentação R$ 1.500,00 + auxílio-saúde R$ 1.000,00'
  },

  prova: {
    data: '2026-12-20',            // adiada de 13/12/2026 (informado por você; confira a retificação oficial)
    turno: 'Tarde',
    duracao: '4h30',
    descricao: 'Prova objetiva e discursiva (mesmo dia)',
    dataAnterior: '2026-12-13'
  },

  /* cronograma (aparece no calendário e na tela Concursos) */
  datas: [
    { id: 'inscricao', rotulo: 'Fim das inscrições', data: '2026-11-30', hora: '23:59', status: 'confirmada' },
    { id: 'boleto', rotulo: 'Último dia para pagar o boleto', data: '2026-12-01', hora: 'horário bancário', status: 'confirmada' },
    { id: 'locais', rotulo: 'Divulgação dos locais de prova (Cartão de Confirmação)', data: null, status: 'a confirmar (aguardando retificação do edital)' },
    { id: 'prova', rotulo: 'Prova objetiva e discursiva', data: '2026-12-20', hora: 'tarde · 4h30', status: 'confirmada (adiada de 13/12/2026)' },
    { id: 'gabarito', rotulo: 'Gabarito preliminar da objetiva', data: null, status: 'a confirmar (aguardando retificação do edital)' },
    { id: 'recursos', rotulo: 'Recursos contra questões e gabarito', data: null, status: 'a confirmar (aguardando retificação do edital)' },
    { id: 'res_objetiva', rotulo: 'Resultado preliminar da prova objetiva', data: null, status: 'a confirmar (aguardando retificação do edital)' },
    { id: 'res_discursiva', rotulo: 'Resultado da prova discursiva', data: null, status: 'a confirmar (aguardando retificação do edital)' },
    { id: 'res_final', rotulo: 'Resultado final', data: null, status: 'a confirmar (aguardando retificação do edital)' }
  ],

  /* ritmo do plano */
  retaFinalDias: 10            // últimos N dias antes da prova: mais revisão e simulados
};

const CATEGORIES = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Assinaturas",
  "Compras",
  "Impostos",
  "Receitas",
  "Transferências",
  "Outros",
];

const RULES = [
  { category: "Alimentação", words: ["mercado", "supermercado", "padaria", "restaurante", "ifood", "uber eats", "açougue"] },
  { category: "Moradia", words: ["aluguel", "condominio", "condomínio", "energia", "luz", "agua", "água", "internet", "gas", "gás"] },
  { category: "Transporte", words: ["uber", "99", "posto", "combustivel", "combustível", "estacionamento", "metro", "metrô", "onibus", "ônibus"] },
  { category: "Saúde", words: ["farmacia", "farmácia", "drogaria", "clinica", "clínica", "medico", "médico", "hospital", "plano de saude"] },
  { category: "Educação", words: ["faculdade", "curso", "escola", "livraria", "udemy", "alura"] },
  { category: "Lazer", words: ["cinema", "netflix", "spotify", "show", "bar", "ingresso"] },
  { category: "Assinaturas", words: ["amazon prime", "youtube", "icloud", "google", "microsoft", "assinatura"] },
  { category: "Impostos", words: ["ipva", "iptu", "dar", "receita federal", "fgts", "inss"] },
  { category: "Transferências", words: ["pix enviado", "ted", "doc", "transferencia", "transferência"] },
  { category: "Receitas", words: ["salario", "salário", "pix recebido", "recebimento", "deposito", "depósito"] },
];

module.exports = { CATEGORIES, RULES };

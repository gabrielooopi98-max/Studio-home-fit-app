-- Opcional: produtos de exemplo para ver a loja funcionando.
-- Rode no SQL Editor depois do 0003_loja.sql. Edite ou desative pela aba Loja → Gerenciar.
insert into public.produtos (nome, marca, categoria, descricao, preco_centavos, preco_antigo_centavos, estoque, destaque) values
  ('Whey Protein Concentrado 900g', 'Growth', 'proteinas', 'Proteína do soro do leite, 24 g de proteína por dose. Sabor chocolate.', 13990, 15990, 12, true),
  ('Creatina Monohidratada 300g', 'Max Titanium', 'creatina', '3 g por dose, 100 doses. Ajuda em força e desempenho em treinos intensos.', 8990, null, 20, true),
  ('Pré-treino Insane 300g', 'Demons Lab', 'pre-treino', 'Cafeína, beta-alanina e arginina. Sabor frutas vermelhas.', 11990, 13490, 6, false),
  ('BCAA 2:1:1 120 cápsulas', 'Integralmédica', 'aminoacidos', 'Aminoácidos de cadeia ramificada para recuperação muscular.', 5490, null, 15, false),
  ('Multivitamínico 60 cápsulas', 'Essential', 'vitaminas', 'Vitaminas e minerais essenciais, 1 cápsula ao dia.', 4990, null, 18, false),
  ('Coqueteleira 600ml', 'Home Fit', 'acessorios', 'Coqueteleira com mola misturadora e logo da academia.', 2990, null, 30, false);

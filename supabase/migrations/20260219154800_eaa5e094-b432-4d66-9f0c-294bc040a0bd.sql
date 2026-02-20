
INSERT INTO public.leads (nome, whatsapp, email, instagram, faturamento, origem, status, assigned_to, webinar_date_tag, profissao, maior_dificuldade, renda_familiar, quem_investe) VALUES
-- Leads não atribuídos (webinar)
('Ana Paula Ferreira', '5511999001001', 'anapaula@gmail.com', '@anapaula.fer', '1500', 'webinar', 'novo', NULL, 'Webinar 15/02', 'Designer', 'Captar clientes', 'R$ 3.000 - R$ 5.000', 'Eu mesma'),
('Beatriz Costa', '5511999002002', 'beatriz.costa@hotmail.com', '@bia.costa', '4500', 'webinar', 'novo', NULL, 'Webinar 15/02', 'Nutricionista', 'Escalar atendimentos', 'R$ 5.000 - R$ 8.000', 'Marido e eu'),
('Carla Mendes', '5511999003003', 'carla.mendes@outlook.com', '@carlamendes_', '8000', 'webinar', 'novo', NULL, 'Webinar 15/02', 'Fisioterapeuta', 'Marketing digital', 'R$ 8.000 - R$ 12.000', 'Eu mesma'),
('Daniela Rocha', '5511999004004', 'daniela.rocha@gmail.com', '@danirocha', '15000', 'webinar', 'novo', NULL, 'Webinar 10/02', 'Dentista', 'Gestão financeira', 'R$ 12.000 - R$ 20.000', 'Sócia'),
('Elaine Martins', '5511999005005', 'elaine.m@gmail.com', '@elainemartins', '2000', 'webinar', 'novo', NULL, 'Webinar 10/02', 'Esteticista', 'Fidelizar clientes', 'R$ 3.000 - R$ 5.000', 'Eu mesma'),
('Fabiana Lopes', '5511999006006', 'fabiana.lopes@yahoo.com', '@fabilopes', '6500', 'webinar', 'novo', NULL, 'Webinar 10/02', 'Psicóloga', 'Aumentar ticket médio', 'R$ 6.000 - R$ 10.000', 'Eu e meu pai'),
('Giovana Silva', '5511999007007', 'giovana.s@gmail.com', '@giovanasilvaa', '3500', 'webinar', 'novo', NULL, 'Webinar 05/02', 'Coach', 'Criar infoproduto', 'R$ 4.000 - R$ 6.000', 'Eu mesma'),
-- Leads atribuídos (coletados)
('Helena Ribeiro', '5511999008008', 'helena.rib@gmail.com', '@helenarib', '5000', 'webinar', 'contato_1_feito', '00000000-0000-0000-0000-000000000002', 'Webinar 15/02', 'Arquiteta', 'Precificação', 'R$ 7.000 - R$ 10.000', 'Eu mesma'),
('Isabela Nunes', '5511999009009', 'isabela.n@gmail.com', '@isabelanunes', '12000', 'webinar', 'agendado', '00000000-0000-0000-0000-000000000003', 'Webinar 15/02', 'Advogada', 'Prospecção ativa', 'R$ 15.000 - R$ 25.000', 'Marido'),
('Juliana Alves', '5511999010010', 'juliana.alves@gmail.com', '@jualves.pro', '9000', 'webinar', 'reuniao_realizada', '00000000-0000-0000-0000-000000000004', 'Webinar 10/02', 'Consultora', 'Escalar vendas', 'R$ 10.000 - R$ 15.000', 'Eu mesma'),
('Kamila Santos', '5511999011011', 'kamila.s@hotmail.com', '@kamilasantos', '1800', 'webinar', 'nao_respondeu_d0', '00000000-0000-0000-0000-000000000005', 'Webinar 10/02', 'Fotógrafa', 'Criar portfólio online', 'R$ 2.000 - R$ 4.000', 'Mãe'),
('Larissa Oliveira', '5511999012012', 'larissa.o@gmail.com', '@larissaoliveira', '20000', 'webinar', 'proposta_enviada', '00000000-0000-0000-0000-000000000002', 'Webinar 05/02', 'Médica', 'Gestão de consultório', 'R$ 20.000+', 'Eu mesma'),
('Mariana Souza', '5511999013013', 'mariana.sz@gmail.com', '@marisouza', '7000', 'bio', 'follow_up', '00000000-0000-0000-0000-000000000003', NULL, 'Personal Trainer', 'Vender online', 'R$ 5.000 - R$ 8.000', 'Namorado'),
('Natália Lima', '5511999014014', 'natalia.lima@gmail.com', '@natlima', '3000', 'social', 'contato_1_feito', '00000000-0000-0000-0000-000000000004', NULL, 'Confeiteira', 'Organizar finanças', 'R$ 3.000 - R$ 5.000', 'Eu mesma'),
('Priscila Dias', '5511999015015', 'priscila.d@outlook.com', '@prisciladias', '25000', 'lista', 'fechado_call', '00000000-0000-0000-0000-000000000005', NULL, 'Empresária', 'Escalar equipe', 'R$ 30.000+', 'Eu mesma');

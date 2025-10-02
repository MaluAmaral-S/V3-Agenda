// src/controllers/serviceController.js
const Service = require('../models/Service');

// Criar um novo serviço
exports.createService = async (req, res) => {
  try {
    const { nome, descricao, duracao_minutos, preco } = req.body;
    const userId = req.user.id; // Pegamos o ID do usuário logado através do middleware 'protect'

    if (!nome || !duracao_minutos) {
      return res.status(400).json({ message: 'Nome e duração são obrigatórios.' });
    }

    const newService = await Service.create({
      nome,
      descricao,
      duracao_minutos,
      preco,
      userId,
    });

    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor ao criar serviço.', error: error.message });
  }
};

// Listar todos os serviços do usuário logado
exports.getServices = async (req, res) => {
  try {
    const userId = req.user.id;
    const services = await Service.findAll({ where: { userId } });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor ao buscar serviços.', error: error.message });
  }
};

// (Opcional por enquanto, mas bom já ter) Deletar um serviço
exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params; // Pega o ID do serviço pela URL
        const userId = req.user.id;

        const service = await Service.findOne({ where: { id, userId } });

        if (!service) {
            return res.status(404).json({ message: 'Serviço não encontrado ou não pertence a você.' });
        }

        await service.destroy();
        res.status(200).json({ message: 'Serviço deletado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao deletar serviço.', error: error.message });
    }
};
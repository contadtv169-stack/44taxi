const supabase = require('../config/supabase');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token nao fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return res.status(401).json({ error: 'Token invalido ou expirado' });
    }

    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('firebase_uid', authUser.id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'Perfil de usuario nao encontrado' });
    }

    if (user.blocked) {
      return res.status(403).json({ error: 'Conta bloqueada. Contate o suporte.' });
    }

    req.user = user;
    req.authUser = authUser;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Erro de autenticacao', details: err.message });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso nao autorizado para esta funcao' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };

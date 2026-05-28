import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, User, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/login', {
        identifier,
        password,
      });

      const { token, user } = response.data;
      login(token, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <motion.div
        initial="hidden"
        animate="visible"
        className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/40 relative z-10 mx-4"
      >
        <motion.div variants={itemVariants} className="text-center flex flex-col items-center">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30"
          >
            <GraduationCap className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Selamat Datang</h2>
          <p className="mt-3 text-sm text-slate-500 font-medium">
            Masuk ke Sistem Informasi Akademik SiAK
          </p>
        </motion.div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="bg-red-50/80 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl text-center font-medium backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <motion.div variants={itemVariants} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                className="block w-full pl-11 pr-3 py-3.5 bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all duration-200 sm:text-sm outline-none"
                placeholder="NIP atau NIS"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </motion.div>

            <motion.div variants={itemVariants} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full pl-11 pr-3 py-3.5 bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all duration-200 sm:text-sm outline-none"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </motion.div>
          </div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk Sistem</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </motion.div>
        </form>

        <motion.div variants={itemVariants} className="text-center mt-8">
          <p className="text-xs text-slate-400 font-medium">
            &copy; {new Date().getFullYear()} SiAK &bull; Sistem Informasi Akademik Terpadu
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

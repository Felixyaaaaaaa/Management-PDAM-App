import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { loginService } from "../service/auth.service";
import { useAuth } from "../hooks/useAuth";
import { Mail, Lock, LogIn, Droplet } from "lucide-react";
import { canLoginToWeb, getDefaultPathByRole } from "../lib/access";

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role && canLoginToWeb(user.role)) {
      navigate(getDefaultPathByRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const data = await loginService({ email, password });

      if (!canLoginToWeb(data.user.role)) {
        setError(
          "Akses ditolak. Hanya role admin, reads, atau bendahara yang bisa login.",
        );
        return;
      }

      login(data.token, data.user);
      navigate(getDefaultPathByRole(data.user.role), { replace: true });
    } catch (error: any) {
      console.log(error);
      const errorMessage =
        error.response?.data?.message || "Email atau password salah";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading && email && password) {
      handleLogin();
    }
  };

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-white">
      {/* Left Side - Gradient Background dengan Content */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-700 relative items-center justify-center p-12 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-40 w-72 h-72 bg-indigo-400/10 rounded-full blur-3xl"></div>

        {/* Content */}
        <div className="relative z-10 text-white max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full backdrop-blur-md">
              <Droplet className="w-8 h-8 fill-white" />
            </div>
            <h2 className="text-4xl font-bold">Tirto Wening</h2>
          </div>
          <p className="text-lg text-blue-100 mb-6">Sistem Manajemen Administrasi Perusahaan Daerah Air PDAM</p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg mt-1">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Akses Aman</h3>
                <p className="text-blue-100 text-sm">Login dengan kredensial admin panel terlindungi</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/20 p-2 rounded-lg mt-1">
                <Droplet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Manajemen Terpadu</h3>
                <p className="text-blue-100 text-sm">Kelola seluruh operasional PDAM dengan efisien</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gradient-to-b from-white via-white to-blue-50">
        <div className="w-full max-w-sm">
          {/* Logo Mobile */}
          <div className="lg:hidden mb-8 flex items-center justify-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-full">
              <Droplet className="w-6 h-6 fill-white text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900">Tirto Wening</h2>
          </div>

          {/* Form Container */}
          <div className="space-y-8 ">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-4xl font-bold text-gray-900">Selamat datang</h2>
              <p className="text-gray-600">Masuk ke panel administrasi Anda</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700 block">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@pdam.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="pl-12 h-12 bg-gray-50 border-gray-200 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-lg"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700 block">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="pl-12 h-12 bg-gray-50 border-gray-200 hover:bg-gray-100 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all rounded-lg"
                  />
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="button"
                onClick={handleLogin}
                disabled={isLoading || !email || !password}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Sedang masuk...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Masuk
                  </span>
                )}
              </Button>
            </form>

            {/* Footer Info */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-center text-xs text-gray-500">
                PDAM Admin System <br /> Hanya untuk pengguna terotorisasi
                <b><br /> &copy; {new Date().getFullYear()} RHINNO. All rights reserved</b>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

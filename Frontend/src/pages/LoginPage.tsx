import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginThunk, selectDecryptedAccessToken } from "@/store/authSlice";
import InputField from "@/components/atoms/InputField";
import Button from "@/components/atoms/Button";
import Logo from "@/components/atoms/Logo";
import { AppDispatch, RootState } from "@/store";

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Obtener el estado de loading y el token desencriptado
  const { loading } = useSelector((state: RootState) => state.auth);
  const decryptedToken = useSelector(selectDecryptedAccessToken);

  // Redirigir si hay un token válido desencriptado
  useEffect(() => {
    if (decryptedToken) {
      navigate("/backoffice", { replace: true });
    }
  }, [decryptedToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const result = await dispatch(loginThunk({ username, password }));
      if (loginThunk.fulfilled.match(result)) {
        // Login exitoso, el useEffect manejará la redirección
      } else if (loginThunk.rejected.match(result)) {
        setError((result.payload as string) || "Error al iniciar sesión");
      }
    } catch (err) {
      setError("Error inesperado al iniciar sesión");
      console.error(err);
    }
  };

  const disabled = loading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-card p-8 rounded-2xl shadow-lg border border-border"
        >
          <div className="flex justify-center mb-6">
            < Logo variant="auto" showLink={false} />
          </div>

          <h2 className="text-2xl font-bold text-foreground text-center mb-6">
            Acceso BackOffice
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <InputField
              label="Usuario"
              placeholder="Ingrese el usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={disabled}
              required
            />

            <InputField
              type="password"
              label="Contraseña"
              placeholder="Ingrese la contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={disabled}
              required
            />

            <Button type="submit" className="w-full mt-6" disabled={disabled}>
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Ingrese sus credenciales para acceder
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

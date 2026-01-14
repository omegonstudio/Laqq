import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface TokenResponse {
  refresh: string;
  access: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("laqq_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Función para refrescar el token automáticamente
  const refreshAccessToken = async (
    refreshToken: string
  ): Promise<string | null> => {
    try {
      const response = await fetch(`${BASE_URL}/users/token/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data: TokenResponse = await response.json();
      localStorage.setItem("laqq_access_token", data.access);

      return data.access;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  };

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Primera petición: obtener tokens
      const response = await fetch(`${BASE_URL}/users/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        setIsLoading(false);
        return false;
      }

      const data: TokenResponse = await response.json();

      // Guardar tokens
      localStorage.setItem("laqq_refresh_token", data.refresh);
      localStorage.setItem("laqq_access_token", data.access);
      // Segunda petición automática: refrescar token
      const newAccessToken = await refreshAccessToken(data.refresh);

      if (!newAccessToken) {
        setIsLoading(false);
        return false;
      }

      // Crear usuario (puedes ajustar el role según tu API)
      const userData: User = {
        username,
        role: "administrator", // Ajusta según lo que devuelva tu API
      };

      setUser(userData);
      localStorage.setItem("laqq_user", JSON.stringify(userData));

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("laqq_user");
    localStorage.removeItem("laqq_access_token");
    localStorage.removeItem("laqq_refresh_token");
  };

  // Verificar y refrescar token al cargar la app
  useEffect(() => {
    const checkAuth = async () => {
      const refreshToken = localStorage.getItem("laqq_refresh_token");
      if (refreshToken && user) {
        await refreshAccessToken(refreshToken);
      }
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

// Hook helper para obtener el access token actual
export const useAccessToken = () => {
  return localStorage.getItem("laqq_access_token");
};

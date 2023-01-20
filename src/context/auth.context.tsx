import { createContext, useContext, useEffect, useState } from "react";

interface IUserData {
  username: string;
  token: string;
}

interface IAuthProvider {
  user: IUserData | null;
  setUserAuthInfo: (user: IUserData) => void;
}

const AuthContext = createContext<IAuthProvider | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUserData | null>(null);

  useEffect(() => {
    if (localStorage.getItem("user")) setUser(JSON.parse(localStorage.getItem("user")!));
    console.log("parent", user);
  }, []);

  const setUserAuthInfo = (user: IUserData) => {
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  return <AuthContext.Provider value={{ user: user, setUserAuthInfo }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;

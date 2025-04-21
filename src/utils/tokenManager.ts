interface DecodedToken {
  exp: number;
  user: {
    id: string;
    email: string;
  };
}

export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  
  try {
    const decoded = JSON.parse(atob(token.split('.')[1])) as DecodedToken;
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
};

export const setupTokenExpirationCheck = (logoutCallback: () => void) => {
  const checkToken = () => {
    const token = localStorage.getItem('token');
    if (token && isTokenExpired(token)) {
      logoutCallback();
    }
  };

  // Check every minute
  const intervalId = setInterval(checkToken, 60000);
  return () => clearInterval(intervalId);
};
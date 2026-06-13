export function setToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jwt', token);
    // Also set cookie for Next.js middleware
    document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Strict`;
  }
}

export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('jwt');
  }
  return null;
}

export function removeToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('jwt');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch (e) {
    return true;
  }
}

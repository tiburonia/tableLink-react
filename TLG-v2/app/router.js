import { renderMapPage } from '../views/MapView.js';
import { renderSearchPage } from '../views/SearchView.js';
import { renderLoginPage } from '../views/LoginView.js';
import { renderCartPage } from '../views/CartView.js';

const routes = {
  '': renderMapPage,
  'search': renderSearchPage,
  'login': renderLoginPage,
  'cart': renderCartPage
};

export function initRouter() {
  const onRoute = () => {
    const hash = location.hash.replace(/^#\//, '');
    const [path] = hash.split('?');
    const view = routes[path || ''] || renderMapPage;
    
    const root = document.getElementById('app');
    if (root) {
      view(root);
    }
  };
  
  window.addEventListener('hashchange', onRoute);
  onRoute();
}

export function navigate(path) {
  window.location.hash = `#/${path}`;
}

export function getQueryParams() {
  const hash = location.hash.replace(/^#\//, '');
  const [, queryString] = hash.split('?');
  
  if (!queryString) return {};
  
  return queryString.split('&').reduce((params, pair) => {
    const [key, value] = pair.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    return params;
  }, {});
}

export function getCurrentPath() {
  const hash = location.hash.replace(/^#\//, '');
  const [path] = hash.split('?');
  return path || '';
}
